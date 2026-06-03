"use client"

import React, { useState, useEffect, type RefObject } from "react"
import type { CommentWithAuthor } from "@/services/comments"
import { formatDistanceToNowStrict } from "date-fns"

interface CommentListProps {
  initialComments: CommentWithAuthor[]
  ticketId: number
  refreshRef?: RefObject<(() => void) | null>
}

export function CommentList({ initialComments, ticketId, refreshRef }: CommentListProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments ?? [])

  async function refresh() {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments?limit=50`)
      if (!res.ok) return
      const payload = await res.json()
      setComments(payload.comments ?? [])
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    if (refreshRef) refreshRef.current = refresh
  })

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">No comments yet.</div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border bg-background p-3">
              <div className="flex items-start justify-between">
                <div className="text-sm font-medium">{c.author_name ?? "Unknown"}</div>
                <div className="text-xs text-muted-foreground">{formatDistanceToNowStrict(new Date(c.created_at))} ago</div>
              </div>
              <div className="mt-2 text-sm text-foreground whitespace-pre-wrap">{c.content}</div>
            </div>
          ))}
        </div>
      )}
      <div className="text-right">
        <button className="text-sm text-primary hover:underline" onClick={() => void refresh()}>
          Refresh
        </button>
      </div>
    </div>
  )
}
