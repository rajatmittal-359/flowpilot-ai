import type { TicketRow } from "@/types/db"

export function buildTicketAnalysisPrompt(ticket: TicketRow) {
  const description = ticket.description?.trim() || "No details provided."

  return `You are an AI support analyst. Analyze the following ticket and return only valid JSON with these keys: sentiment, urgency, recommendedPriority, category, confidence.

Rules:
- sentiment must be one of: negative, neutral, positive.
- urgency must be one of: low, medium, high.
- recommendedPriority must be one of: low, medium, high, urgent.
- category must be one of: authentication, billing, technical, onboarding, account, performance, other.
- confidence must be a number between 0.0 and 1.0.
- Return only JSON, no markdown, no explanation text.

Ticket details:
Title: ${ticket.title}
Description: ${description}
Priority: ${ticket.priority}
Status: ${ticket.status}

Example output:
{"sentiment":"negative","urgency":"high","recommendedPriority":"urgent","category":"authentication","confidence":0.92}`
}
