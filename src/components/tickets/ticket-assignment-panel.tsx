"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import type { UserRole } from "@/types/db"

type AssignableAgent = {
  id: number
  name: string
  email: string
  role: "agent"
}

type TicketAssignmentPanelProps = {
  ticketId: number
  assignedTo: number | null
  assigneeName?: string | null
  assigneeEmail?: string | null
  currentUserRole: UserRole
}

export function TicketAssignmentPanel({
  ticketId,
  assignedTo,
  assigneeName,
  assigneeEmail,
  currentUserRole,
}: TicketAssignmentPanelProps) {
  const canAssign = currentUserRole === "admin"
  const [agents, setAgents] = useState<AssignableAgent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState(assignedTo ? String(assignedTo) : "")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (!canAssign) return

    let ignore = false

    fetch("/api/users/assignable")
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to load agents.")
        }
        if (!ignore) {
          setAgents(payload.users ?? [])
          setLoadError("")
        }
      })
      .catch((error) => {
        if (!ignore) {
          setLoadError(error instanceof Error ? error.message : "Unable to load agents.")
        }
      })

    return () => {
      ignore = true
    }
  }, [canAssign])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")

    if (!selectedAgentId) {
      setMessage("Select an agent before assigning this ticket.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/tickets/${ticketId}/assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: Number(selectedAgentId) }),
      })
      const payload = await response.json()

      if (!response.ok) {
        setMessage(payload?.message ?? "Unable to assign ticket.")
        return
      }

      setMessage(payload?.message ?? "Ticket assigned successfully.")
      router.refresh()
    } catch {
      setMessage("Unable to assign ticket. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-background p-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold">Assignment</h2>
        <p className="text-xs text-muted-foreground">Current ticket owner.</p>
      </div>

      <div className="rounded-xl border border-border/80 bg-muted/30 px-3 py-2 text-sm">
        {assignedTo ? (
          <div>
            <p className="font-medium text-foreground">{assigneeName ?? "Assigned agent"}</p>
            {assigneeEmail ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{assigneeEmail}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground">Unassigned</p>
        )}
      </div>

      {canAssign ? (
        <form onSubmit={onSubmit} className="space-y-3">
          <select
            value={selectedAgentId}
            onChange={(event) => setSelectedAgentId(event.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            disabled={isSubmitting || Boolean(loadError)}
          >
            <option value="">Select agent</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.email})
              </option>
            ))}
          </select>

          {loadError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {loadError}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {message}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting || Boolean(loadError)}>
            {isSubmitting ? "Assigning..." : assignedTo ? "Reassign ticket" : "Assign ticket"}
          </Button>
        </form>
      ) : null}
    </section>
  )
}
