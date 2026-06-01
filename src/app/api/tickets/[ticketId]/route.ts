import { NextResponse, type NextRequest } from "next/server"

import { getSessionFromRequest } from "@/lib/auth"
import { findUserById } from "@/services/auth"
import { updateTicketStatusSchema } from "@/types/tickets"
import { updateTicketStatusForActor } from "@/services/tickets"

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getSessionFromRequest(req)

    if (!session) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      )
    }

    const actor = await findUserById(session.userId)
    if (!actor) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      )
    }

    const params = await context.params
    const ticketId = Number(params.ticketId)
    if (Number.isNaN(ticketId)) {
      return NextResponse.json({ message: "Ticket not found." }, { status: 404 })
    }

    const body = await req.json()
    const parsed = updateTicketStatusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid status payload." },
        { status: 400 }
      )
    }

    const result = await updateTicketStatusForActor(actor, ticketId, parsed.data.status)

    if (result.status === "ticket_not_found") {
      return NextResponse.json(
        { message: "Ticket not found or unauthorized." },
        { status: 404 }
      )
    }

    if (result.status === "forbidden") {
      return NextResponse.json(
        { message: "You do not have permission to update this ticket status." },
        { status: 403 }
      )
    }

    return NextResponse.json({ message: "Ticket status updated.", ticket: result.ticket })
  } catch (error) {
    console.error("Ticket status API error", error)
    return NextResponse.json(
      { message: "Unable to update ticket status." },
      { status: 500 }
    )
  }
}
