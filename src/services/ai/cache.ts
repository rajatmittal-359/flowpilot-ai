import { query, queryOne } from "@/db"

export interface AIAnalysisRow {
  id?: number
  ticket_id: number
  summary?: string | null
  suggested_reply?: string | null
  sentiment?: string | null
  urgency?: string | null
  recommended_priority?: string | null
  category?: string | null
  confidence?: number | null
  raw_analysis_json?: Record<string, unknown> | null
  analyzed_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  cache_version?: number | null
}

// NOTE: migrations should be used to create/modify schema. This module
// assumes the `ticket_ai_analysis` table exists (see src/db/migrations).

export async function getAnalysisByTicketId(ticketId: number) {
  const row = await queryOne<AIAnalysisRow>(
    `SELECT * FROM ticket_ai_analysis WHERE ticket_id = $1`,
    [ticketId]
  )
  return row
}

export type TicketWorkspacePayload = {
  summary?: string | null
  suggestedReply?: string | null
  sentiment?: string
  urgency?: string
  recommendedPriority?: string
  category?: string
  confidence?: number
}

function pickMergedField<K extends keyof AIAnalysisRow>(
  key: K,
  data: Partial<AIAnalysisRow>,
  existing: AIAnalysisRow | null
): AIAnalysisRow[K] | null | undefined {
  if (key in data) {
    const value = data[key]
    return (value === undefined ? null : value) as AIAnalysisRow[K]
  }
  return existing?.[key] ?? null
}

export function isFallbackWorkspace(ws: TicketWorkspacePayload) {
  const noText = !ws.summary?.trim() && !ws.suggestedReply?.trim()
  return noText && ws.sentiment === "unknown" && Number(ws.confidence) === 0.5
}

export function hasPersistedAnalysis(row: AIAnalysisRow | null | undefined) {
  if (!row) return false
  return Boolean(row.sentiment?.trim() || row.summary?.trim() || row.suggested_reply?.trim())
}

export async function upsertAnalysis(ticketId: number, data: Partial<AIAnalysisRow>) {
  const existing = await getAnalysisByTicketId(ticketId)
  const merged: AIAnalysisRow = {
    ticket_id: ticketId,
    summary: pickMergedField("summary", data, existing) as string | null,
    suggested_reply: pickMergedField("suggested_reply", data, existing) as string | null,
    sentiment: pickMergedField("sentiment", data, existing) as string | null,
    urgency: pickMergedField("urgency", data, existing) as string | null,
    recommended_priority: pickMergedField("recommended_priority", data, existing) as string | null,
    category: pickMergedField("category", data, existing) as string | null,
    confidence: pickMergedField("confidence", data, existing) as number | null,
    raw_analysis_json: pickMergedField("raw_analysis_json", data, existing) as Record<string, unknown> | null,
    analyzed_at: (pickMergedField("analyzed_at", data, existing) as string | null) ?? new Date().toISOString(),
  }

  const result = await queryOne<AIAnalysisRow>(
    `INSERT INTO ticket_ai_analysis (ticket_id, summary, suggested_reply, sentiment, urgency, recommended_priority, category, confidence, raw_analysis_json, analyzed_at, updated_at, cache_version)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (ticket_id) DO UPDATE SET
       summary = EXCLUDED.summary,
       suggested_reply = EXCLUDED.suggested_reply,
       sentiment = EXCLUDED.sentiment,
       urgency = EXCLUDED.urgency,
       recommended_priority = EXCLUDED.recommended_priority,
       category = EXCLUDED.category,
       confidence = EXCLUDED.confidence,
       raw_analysis_json = EXCLUDED.raw_analysis_json,
       analyzed_at = EXCLUDED.analyzed_at,
       updated_at = EXCLUDED.updated_at,
       cache_version = COALESCE(ticket_ai_analysis.cache_version, 0) + 1
     RETURNING *
    `,
    [
      ticketId,
      merged.summary ?? null,
      merged.suggested_reply ?? null,
      merged.sentiment ?? null,
      merged.urgency ?? null,
      merged.recommended_priority ?? null,
      merged.category ?? null,
      merged.confidence ?? null,
      merged.raw_analysis_json ?? null,
      merged.analyzed_at ?? new Date().toISOString(),
      new Date().toISOString(),
      data.cache_version ?? 1,
    ]
  )

  return result
}

/** Persist Gemini workspace output; skip write when parse fallback would erase valid cache. */
export async function persistWorkspaceAnalysis(ticketId: number, ws: TicketWorkspacePayload) {
  if (isFallbackWorkspace(ws)) {
    const existing = await getAnalysisByTicketId(ticketId)
    if (hasPersistedAnalysis(existing)) {
      return existing
    }
    return null
  }

  return upsertAnalysis(ticketId, {
    summary: ws.summary?.trim() || null,
    suggested_reply: ws.suggestedReply?.trim() || null,
    sentiment: ws.sentiment ?? null,
    urgency: ws.urgency ?? null,
    recommended_priority: ws.recommendedPriority ?? null,
    category: ws.category ?? null,
    confidence: ws.confidence ?? null,
    analyzed_at: new Date().toISOString(),
    raw_analysis_json: (ws as Record<string, unknown>) ?? null,
  })
}

export function isAnalysisExpired(row: AIAnalysisRow | null, maxAgeSeconds = 60 * 60 * 24) {
  if (!row || !row.analyzed_at) return true
  const analyzed = new Date(row.analyzed_at).getTime()
  const age = Date.now() - analyzed
  return age > maxAgeSeconds * 1000
}

export async function invalidateTicketAnalysis(ticketId: number) {
  await query(`UPDATE ticket_ai_analysis SET summary = NULL, suggested_reply = NULL, sentiment = NULL, urgency = NULL, recommended_priority = NULL, category = NULL, confidence = NULL, raw_analysis_json = NULL, analyzed_at = NULL, updated_at = NOW(), cache_version = COALESCE(cache_version,0)+1 WHERE ticket_id = $1`, [ticketId])
}
