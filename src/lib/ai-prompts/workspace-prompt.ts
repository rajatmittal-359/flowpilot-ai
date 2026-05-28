import type { TicketRow } from "@/types/db"

export function buildTicketWorkspacePrompt(ticket: TicketRow) {
  const description = ticket.description?.trim() || "No details provided."

  return `You are an AI assistant for support teams. Analyze the ticket below and RETURN ONLY a single valid JSON OBJECT (no markdown, no code fences, no explanation) with these keys: summary, suggestedReply, sentiment, urgency, category, confidence, recommendedPriority.

Rules:
- "summary": a short human-readable summary of the ticket (string).
- "suggestedReply": a concise suggested reply message (string).
- "sentiment": one of "negative", "neutral", "positive", or "unknown".
- "urgency": one of "low", "medium", "high".
- "category": one of "authentication", "billing", "technical", "onboarding", "account", "performance", "other", "general".
- "recommendedPriority": one of "low", "medium", "high", "urgent".
- "confidence": a number between 0.0 and 1.0 representing model confidence.

If you cannot produce valid JSON, output the fallback object exactly: {"summary":"","suggestedReply":"","sentiment":"unknown","urgency":"medium","category":"general","confidence":0.5,"recommendedPriority":"medium"}

Ticket:
Title: ${ticket.title}
Description: ${description}
Priority: ${ticket.priority}
Status: ${ticket.status}

Return the JSON only.`
}
