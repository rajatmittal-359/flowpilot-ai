import type { TicketRow } from "@/types/db"

export function buildTicketAnalysisPrompt(ticket: TicketRow) {
  const description = ticket.description?.trim() || "No details provided."
  return `You are an AI support analyst. Analyze the following ticket and return ONLY a single, valid JSON OBJECT and NOTHING ELSE. Do NOT include any markdown, code fences, explanation text, or extra characters. The JSON object must contain exactly these keys: sentiment, urgency, recommendedPriority, category, confidence.

STRICT RULES:
- Return a single JSON object and nothing else (no surrounding backticks, no markdown, no explanation).
- Use the exact keys: "sentiment", "urgency", "recommendedPriority", "category", "confidence".
- "sentiment" must be one of: "negative", "neutral", "positive", or "unknown".
- "urgency" must be one of: "low", "medium", "high".
- "recommendedPriority" must be one of: "low", "medium", "high", "urgent".
- "category" must be one of: "authentication", "billing", "technical", "onboarding", "account", "performance", "other", "general".
- "confidence" must be a number between 0.0 and 1.0.

If you cannot produce valid JSON for any reason, OUTPUT THIS FALLBACK EXACTLY (no extra text):
{"sentiment":"unknown","urgency":"medium","recommendedPriority":"medium","category":"general","confidence":0.5}

Ticket details:
Title: ${ticket.title}
Description: ${description}
Priority: ${ticket.priority}
Status: ${ticket.status}

Correct example output (single line):
{"sentiment":"negative","urgency":"high","recommendedPriority":"urgent","category":"authentication","confidence":0.92}`
}
