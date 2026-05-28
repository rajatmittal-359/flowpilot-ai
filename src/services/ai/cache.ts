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

export async function upsertAnalysis(ticketId: number, data: Partial<AIAnalysisRow>) {
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
      data.summary ?? null,
      data.suggested_reply ?? null,
      data.sentiment ?? null,
      data.urgency ?? null,
      data.recommended_priority ?? null,
      data.category ?? null,
      data.confidence ?? null,
      data.raw_analysis_json ?? null,
      data.analyzed_at ?? new Date().toISOString(),
      new Date().toISOString(),
      data.cache_version ?? 1,
    ]
  )

  return result
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
