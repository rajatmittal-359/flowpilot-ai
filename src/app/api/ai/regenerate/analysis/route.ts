import { NextResponse, type NextRequest } from "next/server"

import { getSessionFromRequest } from "@/lib/auth"
import { getTicketByIdForUser } from "@/services/tickets"
import { generateTicketAnalysis, generateTicketSummary, generateSuggestedReply } from "@/lib/gemini"
import { upsertAnalysis } from "@/services/ai/cache"
import { ticketIdSchema } from "@/types/ai"

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ message: "Authentication required." }, { status: 401 })

    const body = await req.json()
    const parsed = ticketIdSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ message: "ticketId is required." }, { status: 400 })

    const ticket = await getTicketByIdForUser(session.userId, parsed.data.ticketId)
    if (!ticket) return NextResponse.json({ message: "Ticket not found." }, { status: 404 })

    // Force fresh generation for all AI outputs and update cache
    const [summary, suggested_reply, analysis] = await Promise.all([
      generateTicketSummary(ticket),
      generateSuggestedReply(ticket),
      generateTicketAnalysis(ticket),
    ])

    await upsertAnalysis(ticket.id, {
      summary,
      suggested_reply,
      sentiment: analysis.sentiment,
      urgency: analysis.urgency,
      recommended_priority: analysis.recommendedPriority,
      category: analysis.category,
      confidence: analysis.confidence,
      analyzed_at: new Date().toISOString(),
    })

    return NextResponse.json({ message: "AI analysis regenerated." })
  } catch (error) {
    console.error("AI regenerate analysis error", error)
    return NextResponse.json({ message: "Unable to regenerate analysis." }, { status: 500 })
  }
}
