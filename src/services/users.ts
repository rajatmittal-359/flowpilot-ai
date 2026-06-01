import { query, queryOne } from "@/db/index"
import type { UserRow } from "@/types/db"

export type AssignableUser = Pick<UserRow, "id" | "name" | "email" | "role">

export async function getAssignableAgents() {
  return query<AssignableUser>(
    `SELECT id, name, email, role
     FROM users
     WHERE role = 'agent'
     ORDER BY name ASC, email ASC`
  )
}

export async function getAssignableAgentById(userId: number) {
  return queryOne<AssignableUser>(
    `SELECT id, name, email, role
     FROM users
     WHERE id = $1 AND role = 'agent'`,
    [userId]
  )
}
