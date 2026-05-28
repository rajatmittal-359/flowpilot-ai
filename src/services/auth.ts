import { queryOne } from "@/db/index"
import { verifyPassword, verifySessionToken } from "@/lib/auth"
import type { UserRow } from "@/types/db"

export async function findUserByEmail(email: string) {
  return queryOne<UserRow>(
    "SELECT id, name, email, password, role, created_at FROM users WHERE email = $1",
    [email]
  )
}

export async function findUserById(id: number) {
  return queryOne<UserRow>(
    "SELECT id, name, email, password, role, created_at FROM users WHERE id = $1",
    [id]
  )
}

export async function authenticateUser(email: string, password: string) {
  const user = await findUserByEmail(email)

  if (!user) {
    return null
  }

  const isValid = await verifyPassword(password, user.password)

  if (!isValid) {
    return null
  }

  return user
}

export async function getCurrentUserFromToken(token?: string) {
  if (!token) {
    return null
  }

  const session = await verifySessionToken(token)

  if (!session) {
    return null
  }

  return findUserById(session.userId)
}
