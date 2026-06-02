import { getTicketByIdForActor, getTicketByIdForUser } from "@/services/tickets"
import { generateTicketWorkspace } from "@/lib/gemini"
import {
  getAnalysisByTicketId,
  isAnalysisExpired,
  persistWorkspaceAnalysis,
} from "./cache"
import type { PermissionActor } from "@/services/permissions"
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

// Helper: Build workspace from a ticket row (shared by User and Actor variants)
async function buildWorkspaceFromTicket(ticket: TicketRow) {
  const cached = await getAnalysisByTicketId(ticket.id)

  const normalizeText = (value: string | null | undefined) => {
    if (!value || !value.trim()) return null
    return value
  }

  const workspace: any = {
    ticket,
    summary: normalizeText(cached?.summary ?? null),
    suggestedReply: normalizeText(cached?.suggested_reply ?? null),
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

  // If we have cached AI output, return immediately (fast path)
  // Metadata-only rows should not bypass regeneration.
  const hasComplete = workspace.summary || workspace.suggestedReply
  if (hasComplete && !isAnalysisExpired(cached ?? null, 60 * 60 * 24)) {
    // If cached but stale (older than TTL), schedule background regeneration but don't wait
    if (cached && isAnalysisExpired(cached, 60 * 60 * 24)) {
      if (!generationLocks.has(ticket.id)) {
        const bg = (async () => {
          try {
            const ws = await generateTicketWorkspace(ticket)
            await persistWorkspaceAnalysis(ticket.id, ws)
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
      try {
        const ws = await generateTicketWorkspace(ticket)
        await persistWorkspaceAnalysis(ticket.id, ws)
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

export async function getTicketWorkspaceForUser(userId: number, ticketId: number) {
  const ticket = await getTicketByIdForUser(userId, ticketId)
  if (!ticket) return null
  return buildWorkspaceFromTicket(ticket)
}

export async function getTicketWorkspaceForActor(actor: PermissionActor, ticketId: number) {
  const ticket = await getTicketByIdForActor(actor, ticketId)
  if (!ticket) return null
  return buildWorkspaceFromTicket(ticket)
}

export async function regenerateTicketAnalysisForUser(userId: number, ticketId: number) {
  const ticket = await getTicketByIdForUser(userId, ticketId)
  if (!ticket) return null
  // Force unified workspace generation and persist
  const ws = await generateTicketWorkspace(ticket)
  const row = await persistWorkspaceAnalysis(ticket.id, ws)

  return {
    summary: ws.summary,
    suggestedReply: ws.suggestedReply,
    analysis: {
      sentiment: ws.sentiment,
      urgency: ws.urgency,
      recommendedPriority: ws.recommendedPriority,
      category: ws.category,
      confidence: ws.confidence,
    },
    row,
  }
}

// Backwards-compatible helpers for existing API routes
export async function getTicketSummaryForUser(userId: number, ticketId: number) {
  const ws = await getTicketWorkspaceForUser(userId, ticketId)
  if (!ws) return null
  return { ticket: ws.ticket, summary: ws.summary }
}

export async function getTicketSummaryForActor(actor: PermissionActor, ticketId: number) {
  const ticket = await getTicketByIdForActor(actor, ticketId)
  if (!ticket) return null

  const cached = await getAnalysisByTicketId(ticket.id)
  const cachedSummary = cached?.summary?.trim() ? cached.summary : null

  if (cachedSummary && !isAnalysisExpired(cached ?? null, 60 * 60 * 24)) {
    return { ticket, summary: cachedSummary }
  }

  if (generationLocks.has(ticket.id)) {
    await generationLocks.get(ticket.id)
    const fresh = await getAnalysisByTicketId(ticket.id)
    return { ticket, summary: fresh?.summary?.trim() || null }
  }

  const lockPromise = (async () => {
    try {
      const ws = await generateTicketWorkspace(ticket)
      await persistWorkspaceAnalysis(ticket.id, ws)
    } catch (err) {
      console.warn("[AI] summary generation error", { ticketId: ticket.id, err })
    }
  })()

  markGenerationStarted(ticket.id, lockPromise)
  await lockPromise

  const latest = await getAnalysisByTicketId(ticket.id)
  return { ticket, summary: latest?.summary?.trim() || cachedSummary }
}

export async function getSuggestedReplyForUser(userId: number, ticketId: number) {
  const ws = await getTicketWorkspaceForUser(userId, ticketId)
  if (!ws) return null
  return { ticket: ws.ticket, suggestedReply: ws.suggestedReply }
}

export async function getSuggestedReplyForActor(actor: PermissionActor, ticketId: number) {
  const ticket = await getTicketByIdForActor(actor, ticketId)
  if (!ticket) return null

  const cached = await getAnalysisByTicketId(ticket.id)
  const cachedReply = cached?.suggested_reply?.trim() ? cached.suggested_reply : null

  if (cachedReply && !isAnalysisExpired(cached ?? null, 60 * 60 * 24)) {
    return { ticket, suggestedReply: cachedReply }
  }

  if (generationLocks.has(ticket.id)) {
    await generationLocks.get(ticket.id)
    const fresh = await getAnalysisByTicketId(ticket.id)
    return { ticket, suggestedReply: fresh?.suggested_reply?.trim() || null }
  }

  const lockPromise = (async () => {
    try {
      const ws = await generateTicketWorkspace(ticket)
      await persistWorkspaceAnalysis(ticket.id, ws)
    } catch (err) {
      console.warn("[AI] suggested reply generation error", { ticketId: ticket.id, err })
    }
  })()

  markGenerationStarted(ticket.id, lockPromise)
  await lockPromise

  const latest = await getAnalysisByTicketId(ticket.id)
  return { ticket, suggestedReply: latest?.suggested_reply?.trim() || cachedReply }
}

export async function analyzeTicketForUser(userId: number, ticketId: number) {
  const ws = await getTicketWorkspaceForUser(userId, ticketId)
  if (!ws) return null
  return ws.analysis
}
