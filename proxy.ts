import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { getSessionFromRequest } from "@/lib/auth"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await getSessionFromRequest(request)
  const isAuthPage = pathname === "/login" || pathname === "/signup"
  const isDashboardPage =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/")

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!session && isDashboardPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/login", "/signup", "/dashboard/:path*"],
}
