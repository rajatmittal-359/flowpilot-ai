import { compare, hash } from "bcryptjs"
import type { NextRequest } from "next/server"

export const SESSION_COOKIE_NAME = "flowpilot_session"

export async function hashPassword(password: string) {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return compare(password, hashedPassword)
}

export function getSessionFromRequest(_req: NextRequest) {
  // Placeholder for future session validation logic.
  return null
}

export function buildSessionCookie(token: string) {
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
}
