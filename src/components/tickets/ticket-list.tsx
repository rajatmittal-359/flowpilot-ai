"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { TicketPriorityBadge, TicketStatusBadge } from "@/components/tickets/ticket-badges"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { TicketRow } from "@/types/db"

const STATUS_OPTIONS = ["all", "open", "in_progress", "resolved"] as const
const PRIORITY_OPTIONS = ["all", "low", "medium", "high", "urgent"] as const

export function TicketList({ tickets }: { tickets: TicketRow[] }) {
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_OPTIONS[number]>("all")
  const [priorityFilter, setPriorityFilter] = useState<typeof PRIORITY_OPTIONS[number]>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) {
        return false
      }
      if (priorityFilter !== "all" && ticket.priority !== priorityFilter) {
        return false
      }
      if (searchTerm.trim().length > 0) {
        return ticket.title.toLowerCase().includes(searchTerm.toLowerCase())
      }
      return true
    })
  }, [tickets, statusFilter, priorityFilter, searchTerm])

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>My tickets</CardTitle>
            <CardDescription>Filter by status, priority, or search by title.</CardDescription>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof STATUS_OPTIONS[number])}
              className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All statuses" : status.replace("_", " ")}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as typeof PRIORITY_OPTIONS[number])}
              className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority === "all" ? "All priorities" : priority}
                </option>
              ))}
            </select>
            <Input
              placeholder="Search ticket title"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTickets.length === 0 ? (
          <div className="grid h-44 place-items-center rounded-2xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
            No tickets match the selected filters.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/tickets/${ticket.id}`}
                className="group block rounded-3xl border border-border bg-background p-4 transition hover:border-primary/50 hover:bg-muted/70"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{ticket.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{ticket.description ?? "No description available."}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TicketStatusBadge status={ticket.status} />
                    <TicketPriorityBadge priority={ticket.priority} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
