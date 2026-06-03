"use client"

import React, { useState } from "react"

export function CommentForm({ ticketId, onSuccess }: { ticketId: number; onSuccess?: () => void }) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage("")
    if (!content.trim()) {
      setMessage("Please enter a comment.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      const payload = await res.json()
      if (!res.ok) {
        setMessage(payload?.message ?? "Unable to post comment.")
        return
      }

      setContent("")
      setMessage("Comment posted.")
      if (onSuccess) onSuccess()
    } catch (err) {
      setMessage("Unable to post comment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="Write a comment..."
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
      />
      {message ? <div className="text-sm text-muted-foreground">{message}</div> : null}
      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center rounded-md bg-primary px-3 py-1 text-sm text-white disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Posting..." : "Post comment"}
        </button>
      </div>
    </form>
  )
}
