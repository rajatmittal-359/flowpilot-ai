import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import {
  ActivityIcon,
  BotIcon,
  LifeBuoyIcon,
  TrendingUpIcon,
} from "lucide-react"

import { CreateTicketForm } from "@/components/forms/create-ticket-form"
import { StatCard } from "@/components/dashboard/stat-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SESSION_COOKIE_NAME } from "@/lib/auth"
import { getCurrentUserFromToken } from "@/services/auth"
import { getDashboardStatsForUser, getTicketsForUser } from "@/services/tickets"
import type { TicketRow } from "@/types/db"

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString))
}

function priorityClass(priority: TicketRow["priority"]) {
  switch (priority) {
    case "urgent":
      return "bg-rose-500/10 text-rose-600"
    case "high":
      return "bg-amber-500/10 text-amber-700"
    case "medium":
      return "bg-sky-500/10 text-sky-700"
    default:
      return "bg-emerald-500/10 text-emerald-700"
  }
}

export default async function DashboardPage() {
  const cookiesStore = await cookies()
  const token = cookiesStore.get(SESSION_COOKIE_NAME)?.value
  const user = await getCurrentUserFromToken(token)

  if (!user) {
    redirect("/login")
  }

  const stats =
    (await getDashboardStatsForUser(user.id)) ?? {
      total: 0,
      open_tickets: 0,
      resolved_tickets: 0,
      high_priority_tickets: 0,
    }
  const tickets = await getTicketsForUser(user.id)

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user.name}. Your ticket workflow is ready.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total tickets"
          value={String(stats.total)}
          hint="Tickets you have created"
          icon={<LifeBuoyIcon className="size-4" />}
          trend={{ label: "Current workload", tone: "neutral" }}
        />
        <StatCard
          label="Open tickets"
          value={String(stats.open_tickets)}
          hint="Tickets still open"
          icon={<ActivityIcon className="size-4" />}
          trend={{ label: "Real-time status", tone: "neutral" }}
        />
        <StatCard
          label="Resolved tickets"
          value={String(stats.resolved_tickets)}
          hint="Tickets you have closed"
          icon={<BotIcon className="size-4" />}
          trend={{ label: "Resolution progress", tone: "neutral" }}
        />
        <StatCard
          label="High priority"
          value={String(stats.high_priority_tickets)}
          hint="Urgent or high priority tickets"
          icon={<TrendingUpIcon className="size-4" />}
          trend={{ label: "Prioritize these", tone: "neutral" }}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Recent tickets</CardTitle>
            <CardDescription>
              Your latest tickets are listed below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="grid h-56 place-items-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground">
                Create your first ticket to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-2xl border bg-background p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{ticket.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{ticket.description ?? "No description provided."}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityClass(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className="rounded-full bg-muted/80 px-2.5 py-1 text-xs text-muted-foreground">
                          {ticket.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Created {formatDate(ticket.created_at)}</span>
                      <span>#{ticket.id}</span>
                    </div>
                  </div>
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

