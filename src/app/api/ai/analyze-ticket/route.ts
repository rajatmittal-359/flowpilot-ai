import { NextResponse, type NextRequest } from "next/server"

import { getSessionFromRequest } from "@/lib/auth"
import { analyzeTicketForUser } from "@/services/ai"
import { ticketIdSchema } from "@/types/ai"

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 })
    }

    const body = await req.json()
    const parsed = ticketIdSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: "ticketId is required." }, { status: 400 })
    }

    const analysis = await analyzeTicketForUser(session.userId, parsed.data.ticketId)
    if (!analysis) {
      return NextResponse.json({ message: "Ticket not found or unauthorized." }, { status: 404 })
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Ticket analysis AI API error", error)
    return NextResponse.json(
      { message: "Unable to analyze ticket." },
      { status: 500 }
    )
  }
}
