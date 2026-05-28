import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from "@google/generative-ai"
import { buildTicketAnalysisPrompt } from "@/lib/ai-prompts/analysis-prompts"
import { buildTicketWorkspacePrompt } from "@/lib/ai-prompts/workspace-prompt"
import { buildSuggestedReplyPrompt } from "@/lib/ai-prompts/reply-prompts"
import { buildTicketSummaryPrompt } from "@/lib/ai-prompts/summary-prompts"
import type { TicketRow } from "@/types/db"
import { ticketAnalysisSchema } from "@/types/ai"
import { ticketWorkspaceSchema } from "@/types/ai"

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
    if (process.env.NODE_ENV !== "production") console.debug(`[Gemini] trying model: ${model}`)
    const genieModel = createGeminiModel(model)

    try {
      const result = await genieModel.generateContent(prompt, {
        timeout: 60000,
      })
      if (process.env.NODE_ENV !== "production") console.debug(`[Gemini] request succeeded with model: ${model}`)
      const raw = result.response.text()
      return cleanAiText(await raw)
    } catch (error) {
      logGeminiError(model, error)
      lastError = error

      if (!isModelCompatibilityError(error)) {
        throw error
      }

      if (process.env.NODE_ENV !== "production") console.debug(`[Gemini] falling back from model ${model} to next supported model.`)
    }
  }

  throw new Error(
    `[Gemini] All supported models failed: ${SUPPORTED_GEMINI_MODELS.join(", ")}. Last error: ${
      typeof lastError === "string" ? lastError : JSON.stringify(lastError)
    }`
  )
}

function cleanAiText(raw: string) {
  if (!raw) return ""
  let text = raw

  // remove common markdown headings and badges
  text = text.replace(/^\s*#{1,6}\s*/gm, "")
  text = text.replace(/\*\*(.*?)\*\*/g, "$1")

  // convert different bullet markers to a consistent dash
  text = text.replace(/^[\s]*[-*•]\s+/gm, "- ")

  // collapse excessive blank lines to single blank line
  text = text.replace(/\n{3,}/g, "\n\n")

  // trim
  text = text.trim()

  return text
}

function stripCodeFences(text: string) {
  // remove triple-backtick blocks and inline code markers
  let t = text.replace(/```(?:[\w+-]*)?\n?[\s\S]*?```/g, (m) => {
    // strip the fences but keep inner content to allow extraction
    return m.replace(/```(?:[\w+-]*)?\n?/, "").replace(/```$/, "")
  })
  t = t.replace(/`([^`]+)`/g, "$1")
  return t
}

function parseTicketAnalysisResponse(raw: string) {
  const dev = process.env.NODE_ENV !== "production"

  if (dev) {
    console.debug("[Gemini] raw analysis response:", raw)
  }

  const cleaned = stripCodeFences(raw || "").trim().replace(/[“”‘’]/g, '"')

  // try to find JSON object candidates (non-greedy)
  const candidates = cleaned.match(/\{[\s\S]*?\}/g) || []

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      const parsedZ = ticketAnalysisSchema.safeParse(parsed)
      if (parsedZ.success) {
        if (dev) console.info("[Gemini] parsed analysis successfully")
        return parsedZ.data
      }
      // if schema fails, continue to next candidate
      if (dev) console.warn("[Gemini] candidate failed schema validation", parsedZ.error.issues)
    } catch (e) {
      if (dev) console.warn("[Gemini] candidate JSON.parse failed, trying next candidate", String(e))
      continue
    }
  }

  // As a last-ditch attempt, try to parse between the first { and last }
  const firstIndex = cleaned.indexOf("{")
  const lastIndex = cleaned.lastIndexOf("}")
  if (firstIndex !== -1 && lastIndex !== -1 && lastIndex > firstIndex) {
    const slice = cleaned.slice(firstIndex, lastIndex + 1)
    try {
      const parsed = JSON.parse(slice)
      const parsedZ = ticketAnalysisSchema.safeParse(parsed)
      if (parsedZ.success) {
        if (dev) console.info("[Gemini] parsed analysis via broad slice")
        return parsedZ.data
      }
      if (dev) console.warn("[Gemini] broad slice failed schema", parsedZ.error.issues)
    } catch (e) {
      if (dev) console.warn("[Gemini] broad slice JSON.parse failed", String(e))
    }
  }

  // If we couldn't parse, return a safe fallback (do not throw)
  const fallback = {
    sentiment: "unknown" as const,
    urgency: "medium" as const,
    recommendedPriority: "medium" as const,
    category: "general" as const,
    confidence: 0.5,
  }

  console.warn("[Gemini] Failed to parse analysis response; using fallback analysis.")
  if (dev) console.debug("[Gemini] cleaned raw response:", cleaned)

  return fallback
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

export async function generateTicketWorkspace(ticket: TicketRow) {
  const raw = await generateGeminiText(buildTicketWorkspacePrompt(ticket))

  // log in dev
  if (process.env.NODE_ENV !== "production") console.debug("[Gemini] raw workspace response:", raw)

  const cleaned = stripCodeFences(raw || "").trim().replace(/[“”‘’]/g, '"')

  // try to extract the first JSON object
  const candidates = cleaned.match(/\{[\s\S]*?\}/g) || []
  for (const c of candidates) {
    try {
      const parsed = JSON.parse(c)
      const z = ticketWorkspaceSchema.safeParse(parsed)
      if (z.success) return z.data
    } catch (e) {
      continue
    }
  }

  // fallback: try broad slice
  const firstIndex = cleaned.indexOf("{")
  const lastIndex = cleaned.lastIndexOf("}")
  if (firstIndex !== -1 && lastIndex > firstIndex) {
    try {
      const parsed = JSON.parse(cleaned.slice(firstIndex, lastIndex + 1))
      const z = ticketWorkspaceSchema.safeParse(parsed)
      if (z.success) return z.data
    } catch (e) {
      // ignore
    }
  }

  // return fallback workspace values rather than throwing
  return {
    summary: "",
    suggestedReply: "",
    sentiment: "unknown",
    urgency: "medium",
    category: "general",
    confidence: 0.5,
    recommendedPriority: "medium",
  }
}
