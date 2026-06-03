import { query, queryOne } from "@/db/index"
import { getTicketByIdForActor } from "@/services/tickets"
import { findUserById } from "@/services/auth"
import { sendEmail } from "@/lib/email"
import type { PermissionActor } from "@/services/permissions"
import type { CommentRow } from "@/types/db"

export type CommentWithAuthor = CommentRow & { author_name: string | null }

export async function getCommentsForTicket(actor: PermissionActor, ticketId: number, limit = 20) {
  // Authorization: ensure actor can view the ticket
  const ticket = await getTicketByIdForActor(actor, ticketId)
  if (!ticket) return [] as CommentWithAuthor[]

  return query<CommentWithAuthor>(
    `SELECT c.id, c.ticket_id, c.user_id, c.content, c.created_at, u.name AS author_name
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.ticket_id = $1
     ORDER BY c.created_at DESC
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

  if (row) {
    // Resolve creator email — assignee_email is already available on ticket
    const creatorNeedsLookup = ticket.created_by !== actor.id
    const creator = creatorNeedsLookup
      ? await findUserById(ticket.created_by).catch((err) => {
          console.warn("[email] failed to look up ticket creator for comment notification", { ticketId, err })
          return null
        })
      : null

    // Build deduplicated recipient list using already-available data
    const recipients: Array<{ name: string; email: string }> = []

    if (creator) {
      recipients.push({ name: creator.name, email: creator.email })
    }

    if (
      ticket.assignee_email &&
      ticket.assigned_to !== actor.id &&
      ticket.assignee_email !== creator?.email
    ) {
      recipients.push({ name: ticket.assignee_name ?? "Agent", email: ticket.assignee_email })
    }

    for (const recipient of recipients) {
      sendEmail({
        to: recipient.email,
        subject: `[FlowPilot] New comment on ticket: ${ticket.title}`,
        text: `Hi ${recipient.name},\n\nA new comment was posted on ticket #${ticketId}.\n\nTitle: ${ticket.title}\n\nLog in to FlowPilot to view the discussion.`,
      })
    }
  }

  return row
}
