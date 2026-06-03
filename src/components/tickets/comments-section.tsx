"use client"

import { useRef } from "react"
import type { CommentRow } from "@/types/db"
import { CommentList } from "@/components/tickets/comment-list"
import { CommentForm } from "@/components/tickets/comment-form"

interface CommentsSectionProps {
  ticketId: number
  initialComments: CommentRow[]
}

export function CommentsSection({ ticketId, initialComments }: CommentsSectionProps) {
  const refreshRef = useRef<() => void>(null)

  return (
    <div className="space-y-4">
      <CommentList ticketId={ticketId} initialComments={initialComments} refreshRef={refreshRef} />
      <CommentForm ticketId={ticketId} onSuccess={() => refreshRef.current?.()} />
    </div>
  )
}
