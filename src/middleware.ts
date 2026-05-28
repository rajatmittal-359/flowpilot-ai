import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  // Future auth guard will use session data or cookie validation.
  // This placeholder ensures the route structure is in place.
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
