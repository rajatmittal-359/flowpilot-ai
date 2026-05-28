import { NextResponse } from "next/server"

import { authenticateUser } from "@/services/auth"
import { createSessionToken, setSessionCookie } from "@/lib/auth"
import { loginSchema } from "@/types/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid login payload" },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data
    const user = await authenticateUser(email, password)

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      )
    }

    const token = await createSessionToken(user.id)
    const response = NextResponse.json(
      {
        message: "Login successful.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    )

    setSessionCookie(response, token)
    return response
  } catch (error) {
    console.error("Login API error", error)
    return NextResponse.json(
      { message: "Unable to complete login at this time." },
      { status: 500 }
    )
  }
}
