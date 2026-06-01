import type { TicketRow, UserRow } from "@/types/db"

export type PermissionActor = Pick<UserRow, "id" | "role">

export function isAdmin(actor: PermissionActor) {
  return actor.role === "admin"
}

export function isAgent(actor: PermissionActor) {
  return actor.role === "agent"
}

export function canViewTicket(actor: PermissionActor, ticket: Pick<TicketRow, "created_by" | "assigned_to">) {
  if (isAdmin(actor)) return true
  if (isAgent(actor)) return ticket.assigned_to === actor.id
  return ticket.created_by === actor.id
}

export function getTicketVisibilityCondition(
  actor: PermissionActor,
  options: { tableAlias?: string; parameterOffset?: number } = {}
) {
  const { tableAlias = "tickets", parameterOffset = 0 } = options
  const columnPrefix = tableAlias ? `${tableAlias}.` : ""
  const actorIdParam = `$${parameterOffset + 1}`

  if (isAdmin(actor)) {
    return { sql: "TRUE", params: [] as unknown[] }
  }

  if (isAgent(actor)) {
    return {
      sql: `${columnPrefix}assigned_to = ${actorIdParam}`,
      params: [actor.id] as unknown[],
    }
  }

  return {
    sql: `${columnPrefix}created_by = ${actorIdParam}`,
    params: [actor.id] as unknown[],
  }
}
