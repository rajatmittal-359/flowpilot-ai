import { getTicketByIdForUser } from "@/services/tickets"
import { generateSuggestedReply, generateTicketSummary, generateTicketAnalysis } from "@/lib/gemini"
import { getAnalysisByTicketId, upsertAnalysis, isAnalysisExpired } from "./cache"
import type { TicketRow } from "@/types/db"
import type { TicketAnalysisResult } from "@/types/ai"

// Prevent duplicate simultaneous generations for the same ticket in this process
const generationLocks = new Map<number, Promise<void>>()

function markGenerationStarted(ticketId: number, p: Promise<void>) {
  generationLocks.set(ticketId, p)
  p.finally(() => generationLocks.delete(ticketId))
}

function getFallbackAnalysis() {
  return {
    sentiment: "unknown" as const,
    urgency: "medium" as const,
    recommendedPriority: "medium" as const,
    category: "general" as const,
    confidence: 0.5,
  }
}

export async function getTicketWorkspaceForUser(userId: number, ticketId: number) {
  const ticket = await getTicketByIdForUser(userId, ticketId)
  if (!ticket) return null
  // prefer cached analysis
  const cached = await getAnalysisByTicketId(ticket.id)

  const workspace: any = {
    ticket,
    summary: cached?.summary ?? null,
    suggestedReply: cached?.suggested_reply ?? null,
    analysis: cached?.sentiment
      ? {
          sentiment: cached.sentiment as TicketAnalysisResult["sentiment"],
          urgency: cached.urgency as TicketAnalysisResult["urgency"],
          recommendedPriority: (cached.recommended_priority ?? "medium") as TicketAnalysisResult["recommendedPriority"],
          category: (cached.category ?? "general") as TicketAnalysisResult["category"],
          confidence: Number(cached.confidence) || 0,
        }
      : null,
    analyzedAt: cached?.analyzed_at ?? null,
  }

  // If we have a cached row that looks complete, return immediately (fast path)
  const hasComplete = workspace.summary || workspace.suggestedReply || workspace.analysis
  if (hasComplete && !isAnalysisExpired(cached ?? null, 60 * 60 * 24)) {
    // If cached but stale (older than TTL), schedule background regeneration but don't wait
    if (cached && isAnalysisExpired(cached, 60 * 60 * 24)) {
      if (!generationLocks.has(ticket.id)) {
        const bg = (async () => {
          try {
            const [s, r, a] = await Promise.all([
              workspace.summary ? Promise.resolve(workspace.summary) : generateTicketSummary(ticket),
              workspace.suggestedReply ? Promise.resolve(workspace.suggestedReply) : generateSuggestedReply(ticket),
              workspace.analysis ? Promise.resolve(workspace.analysis) : generateTicketAnalysis(ticket),
            ])
            await upsertAnalysis(ticket.id, {
              summary: s ?? null,
              suggested_reply: r ?? null,
              sentiment: a?.sentiment ?? undefined,
              urgency: a?.urgency ?? undefined,
              recommended_priority: a?.recommendedPriority ?? undefined,
              category: a?.category ?? undefined,
              confidence: a?.confidence ?? undefined,
              analyzed_at: new Date().toISOString(),
              raw_analysis_json: a ?? null,
            })
          } catch (err) {
            console.warn("[AI] background regeneration failed", err)
          }
        })()
        markGenerationStarted(ticket.id, bg)
      }
    }

    return workspace
  }

  // No usable cache: attempt to generate missing pieces but avoid duplicate work
  if (generationLocks.has(ticket.id)) {
    // wait for existing generation to finish, then return latest cache
    await generationLocks.get(ticket.id)
    const fresh = await getAnalysisByTicketId(ticket.id)
    return {
      ticket,
      summary: fresh?.summary ?? null,
      suggestedReply: fresh?.suggested_reply ?? null,
      analysis: fresh?.sentiment
        ? {
            sentiment: fresh.sentiment as TicketAnalysisResult["sentiment"],
            urgency: fresh.urgency as TicketAnalysisResult["urgency"],
            recommendedPriority: (fresh.recommended_priority ?? "medium") as TicketAnalysisResult["recommendedPriority"],
            category: (fresh.category ?? "general") as TicketAnalysisResult["category"],
            confidence: Number(fresh.confidence) || 0,
          }
        : null,
      analyzedAt: fresh?.analyzed_at ?? null,
    }
  }

  const lockPromise = (async () => {
    try {
      // generate only missing pieces
      const toGenerate: Array<Promise<any>> = []
      const genSummary = !workspace.summary
      const genReply = !workspace.suggestedReply
      const genAnalysis = !workspace.analysis

      if (genSummary) toGenerate.push(generateTicketSummary(ticket))
      if (genReply) toGenerate.push(generateSuggestedReply(ticket))
      if (genAnalysis) toGenerate.push(generateTicketAnalysis(ticket))

      let results: any[] = []
      try {
        results = await Promise.all(toGenerate)
      } catch (err: any) {
        // handle quota/rate limit gracefully: log and fall back
        const isRateLimit = err && ((err.status && err.status === 429) || String(err).includes("429") || String(err).toLowerCase().includes("too many requests"))
        console.warn("[AI] generation error", { ticketId: ticket.id, isRateLimit, err })
        if (isRateLimit) {
          // if we have some cached data return it (handled by outer code after lock resolves)
        }
        // continue: we'll upsert whatever partial results we do have
      }

      // Map results back into fields in order
      let ri = 0
      const out: any = {}
      if (genSummary) {
        out.summary = results[ri++] ?? null
      }
      if (genReply) {
        out.suggested_reply = results[ri++] ?? null
      }
      if (genAnalysis) {
        const a = results[ri++] ?? null
        if (a) {
          out.sentiment = a.sentiment
          out.urgency = a.urgency
          out.recommended_priority = a.recommendedPriority
          out.category = a.category
          out.confidence = a.confidence
          out.raw_analysis_json = a
        }
      }

      if (Object.keys(out).length > 0) {
        out.analyzed_at = new Date().toISOString()
        await upsertAnalysis(ticket.id, out)
      }
    } catch (err) {
      console.error("[AI] generation lock failed", err)
    }
  })()

  markGenerationStarted(ticket.id, lockPromise)

  // wait for generation to finish and return latest cache (but don't throw on errors)
  await lockPromise
  const latest = await getAnalysisByTicketId(ticket.id)
  if (latest) {
    return {
      ticket,
      summary: latest.summary ?? null,
      suggestedReply: latest.suggested_reply ?? null,
      analysis: latest.sentiment
        ? {
            sentiment: latest.sentiment as TicketAnalysisResult["sentiment"],
            urgency: latest.urgency as TicketAnalysisResult["urgency"],
            recommendedPriority: (latest.recommended_priority ?? "medium") as TicketAnalysisResult["recommendedPriority"],
            category: (latest.category ?? "general") as TicketAnalysisResult["category"],
            confidence: Number(latest.confidence) || 0,
          }
        : getFallbackAnalysis(),
      analyzedAt: latest.analyzed_at ?? null,
    }
  }

  // nothing available: return fallback workspace
  return {
    ticket,
    summary: null,
    suggestedReply: null,
    analysis: getFallbackAnalysis(),
    analyzedAt: null,
  }
}

export async function regenerateTicketAnalysisForUser(userId: number, ticketId: number) {
  const ticket = await getTicketByIdForUser(userId, ticketId)
  if (!ticket) return null

  const [summary, suggestedReply, analysis] = await Promise.all([
    generateTicketSummary(ticket),
    generateSuggestedReply(ticket),
    generateTicketAnalysis(ticket),
  ])

  const row = await upsertAnalysis(ticket.id, {
    summary,
    suggested_reply: suggestedReply,
    sentiment: analysis.sentiment,
    urgency: analysis.urgency,
    recommended_priority: analysis.recommendedPriority,
    category: analysis.category,
    confidence: analysis.confidence,
    analyzed_at: new Date().toISOString(),
  })

  return { summary, suggestedReply, analysis, row }
}

// Backwards-compatible helpers for existing API routes
export async function getTicketSummaryForUser(userId: number, ticketId: number) {
  const ws = await getTicketWorkspaceForUser(userId, ticketId)
  if (!ws) return null
  return { ticket: ws.ticket, summary: ws.summary }
}

export async function getSuggestedReplyForUser(userId: number, ticketId: number) {
  const ws = await getTicketWorkspaceForUser(userId, ticketId)
  if (!ws) return null
  return { ticket: ws.ticket, suggestedReply: ws.suggestedReply }
}

export async function analyzeTicketForUser(userId: number, ticketId: number) {
  const ws = await getTicketWorkspaceForUser(userId, ticketId)
  if (!ws) return null
  return ws.analysis
}
