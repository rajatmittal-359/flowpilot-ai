import { z } from "zod"

export const ticketIdSchema = z.object({
  ticketId: z.preprocess((value) => Number(value), z.number().int().positive()),
})

export const ticketAnalysisSchema = z.object({
  sentiment: z.enum(["negative", "neutral", "positive"]),
  urgency: z.enum(["low", "medium", "high"]),
  recommendedPriority: z.enum(["low", "medium", "high", "urgent"]),
  category: z.enum(["authentication", "billing", "technical", "onboarding", "account", "performance", "other"]),
  confidence: z.number().min(0).max(1),
})

export type TicketIdBody = z.infer<typeof ticketIdSchema>
export type TicketAnalysisResult = z.infer<typeof ticketAnalysisSchema>
