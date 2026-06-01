import { query, queryOne } from "@/db/index"
import { canAssignTickets, getTicketVisibilityCondition, type PermissionActor } from "@/services/permissions"
import { getAssignableAgentById } from "@/services/users"
import type { TicketRow } from "@/types/db"

export type TicketStats = {
  total: number
  open_tickets: number
  resolved_tickets: number
  high_priority_tickets: number
  ai_analyzed_tickets: number
}

export type TicketWithAssignee = TicketRow & {
  assignee_name: string | null
  assignee_email: string | null
}

const ticketWithAssigneeSelect = `
  tickets.id,
  tickets.title,
  tickets.description,
  tickets.status,
  tickets.priority,
  tickets.created_by,
  tickets.assigned_to,
  tickets.created_at,
  assignee.name AS assignee_name,
  assignee.email AS assignee_email
`

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

export async function getTicketsForActor(actor: PermissionActor, limit = 10) {
  const visibility = getTicketVisibilityCondition(actor, { tableAlias: "tickets" })
  const limitParam = `$${visibility.params.length + 1}`

  return query<TicketWithAssignee>(
    `SELECT ${ticketWithAssigneeSelect}
     FROM tickets
     LEFT JOIN users assignee ON assignee.id = tickets.assigned_to
     WHERE ${visibility.sql}
     ORDER BY tickets.created_at DESC
     LIMIT ${limitParam}`,
    [...visibility.params, limit]
  )
}

export async function getDashboardStatsForUser(userId: number) {
  return queryOne<TicketStats>(
    `SELECT
      COUNT(*)::int AS total,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)::int AS open_tickets,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::int AS resolved_tickets,
      SUM(CASE WHEN priority IN ('high', 'urgent') THEN 1 ELSE 0 END)::int AS high_priority_tickets,
      (SELECT COUNT(*)::int FROM ticket_ai_analysis taa
       WHERE taa.ticket_id IN (SELECT id FROM tickets WHERE created_by = $1))::int AS ai_analyzed_tickets
    FROM tickets
    WHERE created_by = $1`,
    [userId]
  )
}

export async function getDashboardStatsForActor(actor: PermissionActor) {
  const visibility = getTicketVisibilityCondition(actor, { tableAlias: "t" })
  const aiVisibility = getTicketVisibilityCondition(actor, { tableAlias: "t2" })

  return queryOne<TicketStats>(
    `SELECT
      COUNT(*)::int AS total,
      COALESCE(SUM(CASE WHEN t.status = 'open' THEN 1 ELSE 0 END), 0)::int AS open_tickets,
      COALESCE(SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END), 0)::int AS resolved_tickets,
      COALESCE(SUM(CASE WHEN t.priority IN ('high', 'urgent') THEN 1 ELSE 0 END), 0)::int AS high_priority_tickets,
      (SELECT COUNT(*)::int
       FROM ticket_ai_analysis taa
       JOIN tickets t2 ON t2.id = taa.ticket_id
       WHERE ${aiVisibility.sql})::int AS ai_analyzed_tickets
    FROM tickets t
    WHERE ${visibility.sql}`,
    visibility.params
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

export async function getTicketByIdForActor(actor: PermissionActor, ticketId: number) {
  const visibility = getTicketVisibilityCondition(actor, {
    tableAlias: "tickets",
    parameterOffset: 1,
  })

  return queryOne<TicketWithAssignee>(
    `SELECT ${ticketWithAssigneeSelect}
     FROM tickets
     LEFT JOIN users assignee ON assignee.id = tickets.assigned_to
     WHERE tickets.id = $1 AND ${visibility.sql}`,
    [ticketId, ...visibility.params]
  )
}

export type AssignTicketResult =
  | { status: "assigned"; ticket: TicketWithAssignee }
  | { status: "forbidden" }
  | { status: "ticket_not_found" }
  | { status: "assignee_not_found" }

export async function assignTicketToAgent(
  actor: PermissionActor,
  ticketId: number,
  assigneeId: number
): Promise<AssignTicketResult> {
  if (!canAssignTickets(actor)) {
    return { status: "forbidden" }
  }

  const ticket = await getTicketByIdForActor(actor, ticketId)
  if (!ticket) {
    return { status: "ticket_not_found" }
  }

  const assignee = await getAssignableAgentById(assigneeId)
  if (!assignee) {
    return { status: "assignee_not_found" }
  }

  const updated = await queryOne<TicketWithAssignee>(
    `UPDATE tickets
     SET assigned_to = $1
     FROM users assignee
     WHERE tickets.id = $2
       AND assignee.id = $1
     RETURNING ${ticketWithAssigneeSelect}`,
    [assignee.id, ticketId]
  )

  if (!updated) {
    return { status: "ticket_not_found" }
  }

  return { status: "assigned", ticket: updated }
}

export async function updateTicketStatusForUser(
  userId: number,
  ticketId: number,
  status: TicketRow["status"]
) {
  return queryOne<TicketRow>(
    `UPDATE tickets
     SET status = $1,
         resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE NULL END
     WHERE id = $2 AND created_by = $3
     RETURNING id, title, description, status, priority, created_by, assigned_to, created_at`,
    [status, ticketId, userId]
  )
}
