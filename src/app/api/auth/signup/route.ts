import { NextResponse } from "next/server"
import { hash } from "bcryptjs"

import { query, queryOne } from "@/db/index"
import { signupRequestSchema } from "@/types/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = signupRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.errors[0]?.message ?? "Invalid signup payload",
        },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data

    const existingUser = await queryOne("SELECT id FROM users WHERE email = $1", [email])

    if (existingUser) {
      return NextResponse.json(
        { message: "A user with that email already exists." },
        { status: 409 }
      )
    }

    const hashedPassword = await hash(password, 12)

    await query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
      [name, email, hashedPassword, "member"]
    )

    return NextResponse.json({ message: "User created successfully." }, { status: 201 })
  } catch (error) {
    console.error("Signup API error", error)
    return NextResponse.json(
      { message: "Unable to complete signup at this time." },
      { status: 500 }
    )
  }
}
