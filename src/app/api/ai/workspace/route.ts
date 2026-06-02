import { NextResponse, type NextRequest } from "next/server"

import { getSessionFromRequest } from "@/lib/auth"
import { findUserById } from "@/services/auth"
import { getTicketWorkspaceForActor } from "@/services/ai"
import { ticketIdSchema } from "@/types/ai"

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ message: "Authentication required." }, { status: 401 })

    const actor = await findUserById(session.userId)
    if (!actor) return NextResponse.json({ message: "Authentication required." }, { status: 401 })

    const body = await req.json()
    const parsed = ticketIdSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ message: "ticketId is required." }, { status: 400 })

    const workspace = await getTicketWorkspaceForActor(actor, parsed.data.ticketId)
    if (!workspace) return NextResponse.json({ message: "Ticket not found." }, { status: 404 })

    return NextResponse.json({ success: true, workspace })
  } catch (error) {
    console.error("AI workspace API error", error)
    // On error (including rate limits), return a safe fallback workspace shape so UI can render
    return NextResponse.json({ success: true, workspace: { ticket: null, summary: null, suggestedReply: null, analysis: { sentiment: "unknown", urgency: "medium", recommendedPriority: "medium", category: "general", confidence: 0.5 }, analyzedAt: null } })
  }
}
