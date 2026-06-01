import { NextResponse, type NextRequest } from "next/server"

import { getSessionFromRequest } from "@/lib/auth"
import { findUserById } from "@/services/auth"
import { assignTicketToAgent } from "@/services/tickets"
import { assignTicketSchema } from "@/types/tickets"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 })
    }

    const actor = await findUserById(session.userId)
    if (!actor) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 })
    }

    const params = await context.params
    const ticketId = Number(params.ticketId)
    if (Number.isNaN(ticketId)) {
      return NextResponse.json({ message: "Ticket not found." }, { status: 404 })
    }

    const body = await req.json()
    const parsed = assignTicketSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid assignment payload." },
        { status: 400 }
      )
    }

    const result = await assignTicketToAgent(actor, ticketId, parsed.data.assignedTo)

    if (result.status === "forbidden") {
      return NextResponse.json({ message: "Admin access required." }, { status: 403 })
    }

    if (result.status === "ticket_not_found") {
      return NextResponse.json({ message: "Ticket not found." }, { status: 404 })
    }

    if (result.status === "assignee_not_found") {
      return NextResponse.json(
        { message: "Assignee must be an agent user." },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: "Ticket assigned successfully.",
      ticket: result.ticket,
    })
  } catch (error) {
    console.error("Ticket assignment API error", error)
    return NextResponse.json(
      { message: "Unable to assign ticket." },
      { status: 500 }
    )
  }
}
