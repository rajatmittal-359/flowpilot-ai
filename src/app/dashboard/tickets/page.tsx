import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { LifeBuoyIcon } from "lucide-react"

import { CreateTicketForm } from "@/components/forms/create-ticket-form"
import { TicketPriorityBadge, TicketStatusBadge } from "@/components/tickets/ticket-badges"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SESSION_COOKIE_NAME } from "@/lib/auth"
import { getCurrentUserFromToken } from "@/services/auth"
import { getTicketsForUser } from "@/services/tickets"
import type { TicketRow } from "@/types/db"

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString))
}

export default async function DashboardTicketsPage() {
  const cookiesStore = await cookies()
  const token = cookiesStore.get(SESSION_COOKIE_NAME)?.value
  const user = await getCurrentUserFromToken(token)

  if (!user) {
    redirect("/login")
  }

  const tickets = await getTicketsForUser(user.id)

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LifeBuoyIcon className="size-4" />
          <span>Ticket management</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
        <p className="text-sm text-muted-foreground">
          Review your requests, track ticket status, and open details for updates.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <div>
              <CardTitle>My tickets</CardTitle>
              <CardDescription>Click into a ticket to update status or review details.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="grid h-44 place-items-center rounded-2xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
                No tickets found. Create one to begin your workflow.
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/dashboard/tickets/${ticket.id}`}
                    className="group block rounded-3xl border border-border bg-background p-4 transition hover:border-primary/50 hover:bg-muted/70"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{ticket.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Created {formatDate(ticket.created_at)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <TicketStatusBadge status={ticket.status} />
                        <TicketPriorityBadge priority={ticket.priority} />
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      {ticket.description ?? "No description available."}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <CreateTicketForm />
        </div>
      </section>
    </div>
  )
}
