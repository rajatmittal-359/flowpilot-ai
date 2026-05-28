import { NextResponse, type NextRequest } from "next/server"

import { getSessionFromRequest } from "@/lib/auth"
import { createTicketSchema } from "@/types/tickets"
import { createTicket } from "@/services/tickets"

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)

    if (!session) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = createTicketSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid ticket payload" },
        { status: 400 }
      )
    }

    const { title, description, priority } = parsed.data
    const ticket = await createTicket(session.userId, title, description || null, priority)

    if (!ticket) {
      return NextResponse.json(
        { message: "Unable to create ticket." },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "Ticket created successfully.", ticket }, { status: 201 })
  } catch (error) {
    console.error("Ticket API error", error)
    return NextResponse.json(
      { message: "Unable to create ticket at this time." },
      { status: 500 }
    )
  }
}
