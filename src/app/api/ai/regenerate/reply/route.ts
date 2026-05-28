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

    const ws = await generateTicketWorkspace(ticket)

    await upsertAnalysis(ticket.id, {
      suggested_reply: ws.suggestedReply ?? null,
      analyzed_at: new Date().toISOString(),
      raw_analysis_json: ws ?? null,
    })

    return NextResponse.json({ message: "Suggested reply regenerated.", suggested_reply: ws.suggestedReply })
  } catch (error) {
    console.error("AI regenerate reply error", error)
    return NextResponse.json({ message: "Unable to regenerate suggested reply." }, { status: 500 })
  }
}
