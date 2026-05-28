import type { TicketRow } from "@/types/db"

export function buildSuggestedReplyPrompt(ticket: TicketRow) {
  const description = ticket.description?.trim() || "No further details were provided."

  return `You are a professional customer support agent. Write a helpful, empathetic reply to the customer that acknowledges the issue, offers a clear next step, and avoids vague or generic language. Do not use markdown or bold text.

Customer ticket:
Title: ${ticket.title}
Description: ${description}
Priority: ${ticket.priority}
Status: ${ticket.status}

Write the reply as one concise support response.`
}
