"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AiErrorState } from "@/components/ai/ai-error-state"
import { AiLoadingState } from "@/components/ai/ai-loading-state"

export function AiSummaryCard() {
  const [ticketId, setTicketId] = useState("")
  const [summary, setSummary] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSummary(null)

    const parsedTicketId = Number(ticketId)
    if (!parsedTicketId || parsedTicketId <= 0) {
      setError("Enter a valid ticket ID to generate a summary.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/ticket-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: parsedTicketId }),
      })
      const payload = await response.json()

      if (!response.ok) {
        setError(payload?.message ?? "Unable to generate ticket summary.")
        return
      }

      setSummary(payload.summary ?? "No summary was generated.")
    } catch (error) {
      setError("Unable to connect to the AI service. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-border bg-background p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Ticket AI summary</h2>
        <p className="text-sm text-muted-foreground">
          Generate a concise ticket summary from your ticket ID.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          id="summary-ticket-id"
          type="number"
          min={1}
          placeholder="Ticket ID"
          value={ticketId}
          onChange={(event) => setTicketId(event.target.value)}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Generating…" : "Generate"}
        </Button>
      </div>

      {isLoading ? (
        <AiLoadingState message="Generating AI ticket summary..." />
      ) : error ? (
        <AiErrorState message={error} />
      ) : summary ? (
        <div className="rounded-2xl border border-border/80 bg-muted/50 p-4 text-sm leading-6 text-foreground">
          {summary}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-muted/70 bg-muted/20 p-4 text-sm text-muted-foreground">
          Enter a ticket ID and submit to see a concise summary.
        </div>
      )}
    </form>
  )
}
