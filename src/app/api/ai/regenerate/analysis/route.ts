import { NextResponse, type NextRequest } from "next/server"

import { getSessionFromRequest } from "@/lib/auth"
import { getTicketByIdForUser } from "@/services/tickets"
import { generateTicketWorkspace } from "@/lib/gemini"
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

    // Force fresh unified generation and update cache
    const ws = await generateTicketWorkspace(ticket)
    await upsertAnalysis(ticket.id, {
      summary: ws.summary ?? null,
      suggested_reply: ws.suggestedReply ?? null,
      sentiment: ws.sentiment ?? undefined,
      urgency: ws.urgency ?? undefined,
      recommended_priority: ws.recommendedPriority ?? undefined,
      category: ws.category ?? undefined,
      confidence: ws.confidence ?? undefined,
      analyzed_at: new Date().toISOString(),
      raw_analysis_json: ws ?? null,
    })

    return NextResponse.json({ message: "AI analysis regenerated." })
  } catch (error) {
    console.error("AI regenerate analysis error", error)
    return NextResponse.json({ message: "Unable to regenerate analysis." }, { status: 500 })
  }
}
