import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { getSessionFromRequest } from "@/lib/auth"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session = await getSessionFromRequest(req)
  const isAuthPage = pathname === "/login" || pathname === "/signup"
  const isDashboardPage = pathname === "/dashboard" || pathname.startsWith("/dashboard/")

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (!session && isDashboardPage) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/login", "/signup", "/dashboard/:path*"],
}
