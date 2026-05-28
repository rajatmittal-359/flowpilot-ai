"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import type { TicketRow } from "@/types/db"
import { type UpdateTicketStatusBody, updateTicketStatusSchema } from "@/types/tickets"

type MutableTicketStatus = "open" | "in_progress" | "resolved"

export function TicketStatusForm({ ticket }: { ticket: TicketRow }) {
  const initialStatus: MutableTicketStatus =
    ticket.status === "closed" ? "resolved" : ticket.status

  const [status, setStatus] = useState<MutableTicketStatus>(initialStatus)
  const [message, setMessage] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")

    const payload: UpdateTicketStatusBody = { status }
    const parsed = updateTicketStatusSchema.safeParse(payload)

    if (!parsed.success) {
      setMessage("Invalid status selection.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (!response.ok) {
        setMessage(result?.message ?? "Unable to update ticket status.")
        return
      }

      setMessage("Ticket status updated.")
      router.refresh()
    } catch (error) {
      setMessage("Unable to update ticket status. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-border bg-background p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Ticket status</h2>
          <p className="text-xs text-muted-foreground">Update the current lifecycle state.</p>
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as MutableTicketStatus)}
          className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          disabled={isSubmitting}
        >
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {message ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating…" : "Save status"}
      </Button>
    </form>
  )
}
