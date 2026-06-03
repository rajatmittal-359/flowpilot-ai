import { NextResponse, type NextRequest } from "next/server"

import { getSessionFromRequest } from "@/lib/auth"
import { findUserById } from "@/services/auth"
import { getCommentsForTicket, createComment } from "@/services/comments"
import { createCommentSchema } from "@/types/comments"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ message: "Authentication required." }, { status: 401 })

    const actor = await findUserById(session.userId)
    if (!actor) return NextResponse.json({ message: "Authentication required." }, { status: 401 })

    const params = await context.params
    const ticketId = Number(params.ticketId)
    if (Number.isNaN(ticketId)) return NextResponse.json({ message: "Ticket not found." }, { status: 404 })

    const url = new URL(req.url)
    const limit = Number(url.searchParams.get("limit") ?? "20")

    const comments = await getCommentsForTicket(actor, ticketId, limit)
    return NextResponse.json({ comments })
  } catch (error) {
    console.error("Comments GET API error", error)
    return NextResponse.json({ message: "Unable to load comments." }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ message: "Authentication required." }, { status: 401 })

    const actor = await findUserById(session.userId)
    if (!actor) return NextResponse.json({ message: "Authentication required." }, { status: 401 })

    const params = await context.params
    const ticketId = Number(params.ticketId)
    if (Number.isNaN(ticketId)) return NextResponse.json({ message: "Ticket not found." }, { status: 404 })

    const body = await req.json()
    const parsed = createCommentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 })
    }

    const row = await createComment(actor, ticketId, parsed.data.content)
    if (!row) return NextResponse.json({ message: "Ticket not found or unauthorized." }, { status: 404 })

    return NextResponse.json({ comment: row }, { status: 201 })
  } catch (error) {
    console.error("Comments POST API error", error)
    return NextResponse.json({ message: "Unable to create comment." }, { status: 500 })
  }
}
