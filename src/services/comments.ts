import { query, queryOne } from "@/db/index"
import { getTicketByIdForActor } from "@/services/tickets"
import type { PermissionActor } from "@/services/permissions"
import type { CommentRow } from "@/types/db"

export async function getCommentsForTicket(actor: PermissionActor, ticketId: number, limit = 20) {
  // Authorization: ensure actor can view the ticket
  const ticket = await getTicketByIdForActor(actor, ticketId)
  if (!ticket) return [] as CommentRow[]

  return query<CommentRow>(
    `SELECT id, ticket_id, user_id, content, created_at
     FROM comments
     WHERE ticket_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [ticketId, limit]
  )
}

export async function createComment(actor: PermissionActor, ticketId: number, content: string) {
  // Authorization: ensure actor can view the ticket
  const ticket = await getTicketByIdForActor(actor, ticketId)
  if (!ticket) return null

  const row = await queryOne<CommentRow>(
    `INSERT INTO comments (ticket_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, ticket_id, user_id, content, created_at`,
    [ticketId, actor.id, content]
  )

  return row
}
