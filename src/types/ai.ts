import { z } from "zod"

export const ticketIdSchema = z.object({
  ticketId: z.preprocess((value) => Number(value), z.number().int().positive()),
})

export const ticketAnalysisSchema = z.object({
  sentiment: z.enum(["negative", "neutral", "positive", "unknown"]),
  urgency: z.enum(["low", "medium", "high"]),
  recommendedPriority: z.enum(["low", "medium", "high", "urgent"]),
  category: z.enum(["authentication", "billing", "technical", "onboarding", "account", "performance", "other", "general"]),
  confidence: z.number().min(0).max(1),
})

export const ticketWorkspaceSchema = z.object({
  summary: z.string(),
  suggestedReply: z.string(),
  sentiment: z.enum(["negative", "neutral", "positive", "unknown"]),
  urgency: z.enum(["low", "medium", "high"]),
  category: z.enum(["authentication", "billing", "technical", "onboarding", "account", "performance", "other", "general"]),
  confidence: z.number().min(0).max(1),
  recommendedPriority: z.enum(["low", "medium", "high", "urgent"]),
})

export type TicketIdBody = z.infer<typeof ticketIdSchema>
export type TicketAnalysisResult = z.infer<typeof ticketAnalysisSchema>
