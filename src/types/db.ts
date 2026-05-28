export type UserRole = "admin" | "agent" | "member"

export type UserRow = {
  id: number
  name: string
  email: string
  password: string
  role: UserRole
  created_at: string
}

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed"
export type TicketPriority = "low" | "medium" | "high" | "urgent"

export type TicketRow = {
  id: number
  title: string
  description: string | null
  status: TicketStatus
  priority: TicketPriority
  created_by: number
  assigned_to: number | null
  created_at: string
}

export type CommentRow = {
  id: number
  ticket_id: number
  user_id: number | null
  content: string
  created_at: string
}

export type ActivityLogRow = {
  id: number
  action: string
  user_id: number | null
  ticket_id: number | null
  created_at: string
}
