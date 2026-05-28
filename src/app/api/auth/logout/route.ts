import { NextResponse } from "next/server"

import { clearSessionCookie } from "@/lib/auth"

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL("/login", req.url))
  clearSessionCookie(response)
  return response
}
