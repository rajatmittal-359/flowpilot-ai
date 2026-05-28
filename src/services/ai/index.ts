import { getTicketByIdForUser } from "@/services/tickets"
import { generateTicketWorkspace } from "@/lib/gemini"
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
            const ws = await generateTicketWorkspace(ticket)
            await upsertAnalysis(ticket.id, {
              summary: ws.summary ?? null,
              suggested_reply: ws.suggestedReply ?? null,
              sentiment: ws.sentiment ?? undefined,
              urgency: ws.urgency ?? undefined,
              recommended_priority: ws.recommendedPriority ?? undefined,
              category: ws.category ?? undefined,
              confidence: ws.confidence ?? undefined,
              analyzed_at: new Date().toISOString(),
              raw_analysis_json: ws ?? null,
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
      // Unified generation: call the single workspace generator
      try {
        const ws = await generateTicketWorkspace(ticket)
        await upsertAnalysis(ticket.id, {
          summary: ws.summary ?? null,
          suggested_reply: ws.suggestedReply ?? null,
          sentiment: ws.sentiment ?? undefined,
          urgency: ws.urgency ?? undefined,
          recommended_priority: ws.recommendedPriority ?? undefined,
          category: ws.category ?? undefined,
          confidence: ws.confidence ?? undefined,
          analyzed_at: new Date().toISOString(),
          raw_analysis_json: ws ?? null,
        })
      } catch (err: any) {
        const isRateLimit = err && ((err.status && err.status === 429) || String(err).includes("429") || String(err).toLowerCase().includes("too many requests"))
        console.warn("[AI] generation error", { ticketId: ticket.id, isRateLimit, err })
        // don't rethrow; let callers use cached or fallback
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
  // Force unified workspace generation and persist
  const ws = await generateTicketWorkspace(ticket)

  const row = await upsertAnalysis(ticket.id, {
    summary: ws.summary ?? null,
    suggested_reply: ws.suggestedReply ?? null,
    sentiment: ws.sentiment ?? undefined,
    urgency: ws.urgency ?? undefined,
    recommended_priority: ws.recommendedPriority ?? undefined,
    category: ws.category ?? undefined,
    confidence: ws.confidence ?? undefined,
    analyzed_at: new Date().toISOString(),
    raw_analysis_json: ws ?? null,
  })

  return { summary: ws.summary, suggestedReply: ws.suggestedReply, analysis: { sentiment: ws.sentiment, urgency: ws.urgency, recommendedPriority: ws.recommendedPriority, category: ws.category, confidence: ws.confidence }, row }
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
