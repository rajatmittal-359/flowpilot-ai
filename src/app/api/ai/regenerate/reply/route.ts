import { NextResponse, type NextRequest } from "next/server"

import { getSessionFromRequest } from "@/lib/auth"
import { findUserById } from "@/services/auth"
import { getTicketByIdForActor } from "@/services/tickets"
import { generateTicketWorkspace } from "@/lib/gemini"
import {
  getAnalysisByTicketId,
  hasPersistedAnalysis,
  isFallbackWorkspace,
  upsertAnalysis,
} from "@/services/ai/cache"
import { ticketIdSchema } from "@/types/ai"

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ message: "Authentication required." }, { status: 401 })

    const body = await req.json()
    const parsed = ticketIdSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ message: "ticketId is required." }, { status: 400 })

    const user = await findUserById(session.userId)
    if (!user) return NextResponse.json({ message: "Authentication required." }, { status: 401 })

    const ticket = await getTicketByIdForActor({ id: user.id, role: user.role }, parsed.data.ticketId)
    if (!ticket) return NextResponse.json({ message: "Ticket not found." }, { status: 404 })

    const ws = await generateTicketWorkspace(ticket)

    if (isFallbackWorkspace(ws)) {
      const existing = await getAnalysisByTicketId(ticket.id)
      if (hasPersistedAnalysis(existing)) {
        return NextResponse.json(
          {
            message:
              "AI returned an unparseable response. Your previous reply was kept.",
            suggested_reply: existing?.suggested_reply ?? null,
            keptExisting: true,
          },
          { status: 422 }
        )
      }
      return NextResponse.json(
        { message: "Unable to parse AI response. Please try again." },
        { status: 502 }
      )
    }

    await upsertAnalysis(ticket.id, {
      suggested_reply: ws.suggestedReply?.trim() || null,
      analyzed_at: new Date().toISOString(),
      raw_analysis_json: ws as Record<string, unknown>,
    })

    return NextResponse.json({ message: "Suggested reply regenerated.", suggested_reply: ws.suggestedReply })
  } catch (error) {
    console.error("AI regenerate reply error", error)
    return NextResponse.json({ message: "Unable to regenerate suggested reply." }, { status: 500 })
  }
}
