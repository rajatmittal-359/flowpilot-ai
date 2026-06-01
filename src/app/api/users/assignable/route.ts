import { NextResponse, type NextRequest } from "next/server"

import { getSessionFromRequest } from "@/lib/auth"
import { findUserById } from "@/services/auth"
import { canAssignTickets } from "@/services/permissions"
import { getAssignableAgents } from "@/services/users"

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 })
    }

    const actor = await findUserById(session.userId)
    if (!actor) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 })
    }

    if (!canAssignTickets(actor)) {
      return NextResponse.json({ message: "Admin access required." }, { status: 403 })
    }

    const users = await getAssignableAgents()
    return NextResponse.json({ users })
  } catch (error) {
    console.error("Assignable users API error", error)
    return NextResponse.json(
      { message: "Unable to load assignable users." },
      { status: 500 }
    )
  }
}
