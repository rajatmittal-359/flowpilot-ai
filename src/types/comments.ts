import { z } from "zod"

export const createCommentSchema = z.object({
  content: z.string().min(1, "Content is required").max(2000, "Content is too long"),
})

export type CreateCommentBody = z.infer<typeof createCommentSchema>
