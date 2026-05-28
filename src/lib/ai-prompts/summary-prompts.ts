import type { TicketRow } from "@/types/db"

export function buildTicketSummaryPrompt(ticket: TicketRow) {
  const description = ticket.description?.trim() || "No further details were provided."

  return `You are a professional customer support analyst. Review this ticket and produce a short, clean summary that captures the customer's issue, current context, and what support should do next. Do not use markdown or formatting characters. Avoid vague language.

Ticket title: ${ticket.title}
Ticket description: ${description}
Priority: ${ticket.priority}
Status: ${ticket.status}

Provide a clear, concise summary in one paragraph.`
}
