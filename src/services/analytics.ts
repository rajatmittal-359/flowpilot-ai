import { query, queryOne } from "@/db/index"
import type { TicketRow } from "@/types/db"

// Analytics type definitions
export type AnalyticsMetrics = {
  total_tickets: number
  open_tickets: number
  resolved_tickets: number
  high_priority_tickets: number
  ai_analyzed_tickets: number
  resolution_percentage: number
  ai_coverage_percentage: number
}

export type PriorityDistribution = {
  priority: TicketRow["priority"]
  count: number
}

export type StatusDistribution = {
  status: TicketRow["status"]
  count: number
}

export type RecentActivity = {
  id: number
  title: string
  status: TicketRow["status"]
  priority: TicketRow["priority"]
  created_at: string
}

export type PriorityBreakdown = {
  urgent_count: number
  high_count: number
  medium_count: number
  low_count: number
}

/**
 * Get comprehensive analytics metrics for a user
 */
export async function getAnalyticsMetrics(userId: number): Promise<AnalyticsMetrics> {
  const result = await queryOne<AnalyticsMetrics>(
    `SELECT
      COUNT(*)::int AS total_tickets,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)::int AS open_tickets,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::int AS resolved_tickets,
      SUM(CASE WHEN priority IN ('high', 'urgent') THEN 1 ELSE 0 END)::int AS high_priority_tickets,
      (SELECT COUNT(*)::int FROM ticket_ai_analysis taa 
       WHERE taa.ticket_id IN (SELECT id FROM tickets WHERE created_by = $1))::int AS ai_analyzed_tickets,
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND((SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100)::numeric, 1)::int
      END AS resolution_percentage,
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(((SELECT COUNT(*) FROM ticket_ai_analysis taa 
                     WHERE taa.ticket_id IN (SELECT id FROM tickets WHERE created_by = $1))::numeric / COUNT(*) * 100)::numeric, 1)::int
      END AS ai_coverage_percentage
    FROM tickets
    WHERE created_by = $1`,
    [userId]
  )

  return result ?? {
    total_tickets: 0,
    open_tickets: 0,
    resolved_tickets: 0,
    high_priority_tickets: 0,
    ai_analyzed_tickets: 0,
    resolution_percentage: 0,
    ai_coverage_percentage: 0,
  }
}

/**
 * Get tickets breakdown by priority
 */
export async function getTicketsByPriority(userId: number): Promise<PriorityDistribution[]> {
  return query<PriorityDistribution>(
    `SELECT
      priority,
      COUNT(*)::int AS count
    FROM tickets
    WHERE created_by = $1
    GROUP BY priority
    ORDER BY 
      CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END`,
    [userId]
  )
}

/**
 * Get tickets breakdown by status
 */
export async function getTicketsByStatus(userId: number): Promise<StatusDistribution[]> {
  return query<StatusDistribution>(
    `SELECT
      status,
      COUNT(*)::int AS count
    FROM tickets
    WHERE created_by = $1
    GROUP BY status
    ORDER BY 
      CASE status
        WHEN 'open' THEN 1
        WHEN 'in_progress' THEN 2
        WHEN 'resolved' THEN 3
        WHEN 'closed' THEN 4
        ELSE 5
      END`,
    [userId]
  )
}

/**
 * Get priority breakdown (urgent, high, medium, low counts)
 */
export async function getPriorityBreakdown(userId: number): Promise<PriorityBreakdown> {
  const result = await queryOne<PriorityBreakdown>(
    `SELECT
      SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END)::int AS urgent_count,
      SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END)::int AS high_count,
      SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END)::int AS medium_count,
      SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END)::int AS low_count
    FROM tickets
    WHERE created_by = $1`,
    [userId]
  )

  return result ?? {
    urgent_count: 0,
    high_count: 0,
    medium_count: 0,
    low_count: 0,
  }
}

/**
 * Get recent ticket activity
 */
export async function getRecentTicketActivity(userId: number, limit: number = 8): Promise<RecentActivity[]> {
  return query<RecentActivity>(
    `SELECT
      id,
      title,
      status,
      priority,
      created_at
    FROM tickets
    WHERE created_by = $1
    ORDER BY created_at DESC
    LIMIT $2`,
    [userId, limit]
  )
}

/**
 * Get tickets analyzed by AI (with analysis details)
 */
export type AnalyzedTicketWithSentiment = {
  id: number
  title: string
  sentiment: string | null
  urgency: string | null
  category: string | null
  confidence: number | null
  analyzed_at: string | null
}

export async function getAnalyzedTickets(
  userId: number,
  limit: number = 10
): Promise<AnalyzedTicketWithSentiment[]> {
  return query<AnalyzedTicketWithSentiment>(
    `SELECT
      t.id,
      t.title,
      taa.sentiment,
      taa.urgency,
      taa.category,
      taa.confidence,
      taa.analyzed_at
    FROM tickets t
    LEFT JOIN ticket_ai_analysis taa ON t.id = taa.ticket_id
    WHERE t.created_by = $1 AND taa.id IS NOT NULL
    ORDER BY taa.analyzed_at DESC
    LIMIT $2`,
    [userId, limit]
  )
}

/**
 * Get ticket trends over time (daily)
 */
export type TicketTrend = {
  date: string
  count: number
}

export async function getTicketTrendLastDays(userId: number, days: number = 30): Promise<TicketTrend[]> {
  return query<TicketTrend>(
    `SELECT
      DATE(created_at)::text AS date,
      COUNT(*)::int AS count
    FROM tickets
    WHERE created_by = $1 
      AND created_at >= NOW() - INTERVAL '1 day' * $2
    GROUP BY DATE(created_at)
    ORDER BY date DESC`,
    [userId, days]
  )
}

/**
 * Get average resolution time in hours
 */
export type ResolutionMetrics = {
  avg_resolution_time_hours: number | null
  median_resolution_time_hours: number | null
  fastest_resolution_hours: number | null
  slowest_resolution_hours: number | null
}

export async function getResolutionMetrics(userId: number): Promise<ResolutionMetrics> {
  const result = await queryOne<ResolutionMetrics>(
    `SELECT
      ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)::numeric, 2)::float8 AS avg_resolution_time_hours,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)::numeric, 2)::float8 AS median_resolution_time_hours,
      ROUND(MIN(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)::numeric, 2)::float8 AS fastest_resolution_hours,
      ROUND(MAX(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)::numeric, 2)::float8 AS slowest_resolution_hours
    FROM tickets
    WHERE created_by = $1 AND status = 'resolved'`,
    [userId]
  )

  return result ?? {
    avg_resolution_time_hours: null,
    median_resolution_time_hours: null,
    fastest_resolution_hours: null,
    slowest_resolution_hours: null,
  }
}
