import { query, queryOne } from "@/db/index"
import type { TicketRow } from "@/types/db"

export type TicketStats = {
  total: number
  open_tickets: number
  resolved_tickets: number
  high_priority_tickets: number
  ai_analyzed_tickets: number
}

export async function createTicket(
  createdBy: number,
  title: string,
  description: string | null,
  priority: TicketRow["priority"]
) {
  return queryOne<TicketRow>(
    "INSERT INTO tickets (title, description, status, priority, created_by, assigned_to) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [title, description, "open", priority, createdBy, null]
  )
}

export async function getTicketsForUser(userId: number) {
  return query<TicketRow>(
    "SELECT id, title, description, status, priority, created_by, assigned_to, created_at FROM tickets WHERE created_by = $1 ORDER BY created_at DESC LIMIT 10",
    [userId]
  )
}

export async function getDashboardStatsForUser(userId: number) {
  return queryOne<TicketStats>(
    `SELECT
      COUNT(*)::int AS total,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)::int AS open_tickets,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::int AS resolved_tickets,
      SUM(CASE WHEN priority IN ('high', 'urgent') THEN 1 ELSE 0 END)::int AS high_priority_tickets,
      SUM(CASE WHEN description IS NOT NULL AND description <> '' THEN 1 ELSE 0 END)::int AS ai_analyzed_tickets
    FROM tickets
    WHERE created_by = $1`,
    [userId]
  )
}

export async function getTicketByIdForUser(userId: number, ticketId: number) {
  return queryOne<TicketRow>(
    `SELECT id, title, description, status, priority, created_by, assigned_to, created_at
     FROM tickets
     WHERE id = $1 AND created_by = $2`,
    [ticketId, userId]
  )
}

export async function updateTicketStatusForUser(
  userId: number,
  ticketId: number,
  status: TicketRow["status"]
) {
  return queryOne<TicketRow>(
    `UPDATE tickets
     SET status = $1
     WHERE id = $2 AND created_by = $3
     RETURNING id, title, description, status, priority, created_by, assigned_to, created_at`,
    [status, ticketId, userId]
  )
}
