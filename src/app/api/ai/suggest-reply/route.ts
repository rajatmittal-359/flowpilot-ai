import { NextResponse, type NextRequest } from "next/server"

import { getSessionFromRequest } from "@/lib/auth"
import { findUserById } from "@/services/auth"
import { getSuggestedReplyForActor } from "@/services/ai"
import { ticketIdSchema } from "@/types/ai"

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 })
    }

    const actor = await findUserById(session.userId)
    if (!actor) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 })
    }

    const body = await req.json()
    const parsed = ticketIdSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: "ticketId is required." }, { status: 400 })
    }

    const result = await getSuggestedReplyForActor(actor, parsed.data.ticketId)
    if (!result) {
      return NextResponse.json({ message: "Ticket not found or unauthorized." }, { status: 404 })
    }

    return NextResponse.json({ suggestedReply: result.suggestedReply })
  } catch (error) {
    console.error("Suggested reply AI API error", error)
    return NextResponse.json(
      { message: "Unable to generate suggested reply." },
      { status: 500 }
    )
  }
}
