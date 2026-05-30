import { NextResponse, type NextRequest } from "next/server"

import { getSessionFromRequest } from "@/lib/auth"
import { getTicketByIdForUser } from "@/services/tickets"
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

    const ticket = await getTicketByIdForUser(session.userId, parsed.data.ticketId)
    if (!ticket) return NextResponse.json({ message: "Ticket not found." }, { status: 404 })

    const ws = await generateTicketWorkspace(ticket)

    if (isFallbackWorkspace(ws)) {
      const existing = await getAnalysisByTicketId(ticket.id)
      if (hasPersistedAnalysis(existing)) {
        return NextResponse.json(
          {
            message:
              "AI returned an unparseable response. Your previous summary was kept.",
            summary: existing?.summary ?? null,
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
      summary: ws.summary?.trim() || null,
      analyzed_at: new Date().toISOString(),
      raw_analysis_json: ws as Record<string, unknown>,
    })

    return NextResponse.json({ message: "Summary regenerated.", summary: ws.summary })
  } catch (error) {
    console.error("AI regenerate summary error", error)
    return NextResponse.json({ message: "Unable to regenerate summary." }, { status: 500 })
  }
}
