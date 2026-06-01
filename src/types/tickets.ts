import { z } from "zod"

export const createTicketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
})

export const updateTicketStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved"]),
})

export const assignTicketSchema = z.object({
  assignedTo: z.preprocess((value) => Number(value), z.number().int().positive()),
})

export type CreateTicketBody = z.infer<typeof createTicketSchema>
export type UpdateTicketStatusBody = z.infer<typeof updateTicketStatusSchema>
export type AssignTicketBody = z.infer<typeof assignTicketSchema>
