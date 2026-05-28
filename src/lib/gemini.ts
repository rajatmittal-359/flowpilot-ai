import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from "@google/generative-ai"
import { buildTicketAnalysisPrompt } from "@/lib/ai-prompts/analysis-prompts"
import { buildSuggestedReplyPrompt } from "@/lib/ai-prompts/reply-prompts"
import { buildTicketSummaryPrompt } from "@/lib/ai-prompts/summary-prompts"
import type { TicketRow } from "@/types/db"
import { ticketAnalysisSchema } from "@/types/ai"

const SUPPORTED_GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
] as const

type GeminiModelName = (typeof SUPPORTED_GEMINI_MODELS)[number]

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required for AI assistant functionality.")
  }
  return apiKey
}

function createGeminiModel(model: GeminiModelName) {
  const apiKey = getGeminiApiKey()
  const ai = new GoogleGenerativeAI(apiKey)

  return ai.getGenerativeModel(
    {
      model,
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.3,
      },
    },
    {
      timeout: 60000,
      apiVersion: "v1",
    }
  )
}

function logGeminiError(model: GeminiModelName, error: unknown) {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: string }).message)
      : String(error)

  const status =
    typeof error === "object" && error !== null && "status" in error
      ? (error as { status?: number }).status
      : undefined

  const statusText =
    typeof error === "object" && error !== null && "statusText" in error
      ? (error as { statusText?: string }).statusText
      : undefined

  const details =
    typeof error === "object" && error !== null && "errorDetails" in error
      ? (error as { errorDetails?: unknown }).errorDetails
      : undefined

  const reachedGoogle =
    error instanceof GoogleGenerativeAIFetchError || status !== undefined

  console.error("[Gemini] model attempt failed:", {
    model,
    apiVersion: "v1",
    reachedGoogle,
    status,
    statusText,
    message,
    details,
  })
}

function isModelCompatibilityError(error: unknown) {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: string }).message).toLowerCase()
      : String(error).toLowerCase()

  return [
    "model not found",
    "unsupported model",
    "not found",
    "api version",
    "unknown model",
    "unsupported",
  ].some((term) => message.includes(term))
}

async function generateGeminiText(prompt: string) {
  let lastError: unknown = null

  for (const model of SUPPORTED_GEMINI_MODELS) {
    console.log(`[Gemini] trying model: ${model}`)
    const genieModel = createGeminiModel(model)

    try {
      const result = await genieModel.generateContent(prompt, {
        timeout: 60000,
      })
      console.log(`[Gemini] request succeeded with model: ${model}`)
      return result.response.text()
    } catch (error) {
      logGeminiError(model, error)
      lastError = error

      if (!isModelCompatibilityError(error)) {
        throw error
      }

      console.log(`[Gemini] falling back from model ${model} to next supported model.`)
    }
  }

  throw new Error(
    `[Gemini] All supported models failed: ${SUPPORTED_GEMINI_MODELS.join(", ")}. Last error: ${
      typeof lastError === "string" ? lastError : JSON.stringify(lastError)
    }`
  )
}

function parseTicketAnalysisResponse(raw: string) {
  const normalized = raw.trim().replace(/[“”‘’]/g, '"')
  const jsonMatch = normalized.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("AI analysis did not return valid JSON.")
  }

  try {
    const parsed = JSON.parse(jsonMatch[0])
    const result = ticketAnalysisSchema.parse(parsed)
    return result
  } catch (error) {
    throw new Error(`Unable to parse AI analysis result: ${String(error)}`)
  }
}

export async function generateTicketSummary(ticket: TicketRow) {
  return generateGeminiText(buildTicketSummaryPrompt(ticket))
}

export async function generateSuggestedReply(ticket: TicketRow) {
  return generateGeminiText(buildSuggestedReplyPrompt(ticket))
}

export async function generateTicketAnalysis(ticket: TicketRow) {
  const raw = await generateGeminiText(buildTicketAnalysisPrompt(ticket))
  return parseTicketAnalysisResponse(raw)
}
