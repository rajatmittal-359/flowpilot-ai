import { query, queryOne } from "@/db/index"
import { getTicketVisibilityCondition, type PermissionActor } from "@/services/permissions"

export type ActivityEntry = {
  id: number
  action: string
  actor_name: string | null
  created_at: string
}

export function logActivity(ticketId: number, userId: number, action: string): void {
  query(
    `INSERT INTO activity_logs (ticket_id, user_id, action) VALUES ($1, $2, $3)`,
    [ticketId, userId, action]
  ).catch((err) => {
    console.warn("[activity] failed to log activity", { ticketId, action, err })
  })
}

export async function getActivityForTicket(
  actor: PermissionActor,
  ticketId: number,
  limit = 50
): Promise<ActivityEntry[]> {
  const visibility = getTicketVisibilityCondition(actor, { tableAlias: "tickets", parameterOffset: 1 })

  const ticket = await queryOne<{ id: number }>(
    `SELECT tickets.id FROM tickets WHERE tickets.id = $1 AND ${visibility.sql}`,
    [ticketId, ...visibility.params]
  )
  if (!ticket) return []

  return query<ActivityEntry>(
    `SELECT al.id, al.action, u.name AS actor_name, al.created_at
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.user_id
     WHERE al.ticket_id = $1
     ORDER BY al.created_at DESC
     LIMIT $2`,
    [ticketId, limit]
  )
}
