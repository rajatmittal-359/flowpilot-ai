import { getTicketByIdForUser } from "@/services/tickets"
import { generateSuggestedReply, generateTicketSummary, generateTicketAnalysis } from "@/lib/gemini"
import type { TicketRow } from "@/types/db"
import type { TicketAnalysisResult } from "@/types/ai"

export async function getTicketSummaryForUser(userId: number, ticketId: number) {
  const ticket = await getTicketByIdForUser(userId, ticketId)
  if (!ticket) {
    return null
  }

  const summary = await generateTicketSummary(ticket)
  return { ticket, summary }
}

export async function getSuggestedReplyForUser(userId: number, ticketId: number) {
  const ticket = await getTicketByIdForUser(userId, ticketId)
  if (!ticket) {
    return null
  }

  const suggestedReply = await generateSuggestedReply(ticket)
  return { ticket, suggestedReply }
}

export async function analyzeTicketForUser(userId: number, ticketId: number) {
  const ticket = await getTicketByIdForUser(userId, ticketId)
  if (!ticket) {
    return null
  }

  const analysis = await generateTicketAnalysis(ticket)
  return analysis as TicketAnalysisResult
}
