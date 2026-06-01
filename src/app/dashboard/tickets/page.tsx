import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ActivityIcon, CheckCircle2Icon, ClockIcon, LifeBuoyIcon } from "lucide-react"

import { StatCard } from "@/components/dashboard/stat-card"
import { CreateTicketForm } from "@/components/forms/create-ticket-form"
import { TicketList } from "@/components/tickets/ticket-list"
import { SESSION_COOKIE_NAME } from "@/lib/auth"
import { getCurrentUserFromToken } from "@/services/auth"
import { getDashboardStatsForActor, getTicketsForActor } from "@/services/tickets"

function getTicketPageContent(role: string) {
  if (role === "agent") {
    return {
      eyebrow: "Agent queue",
      title: "My Assigned Tickets",
      description: "Review your assigned work, update status, and keep requests moving.",
      emptyMessage: "No tickets are assigned to you yet.",
      listTitle: "Assigned work",
    }
  }

  if (role === "admin") {
    return {
      eyebrow: "Service desk visibility",
      title: "All Tickets",
      description: "Review all requests and open ticket details for assignment or status updates.",
      emptyMessage: "No tickets have been created in the workspace yet.",
      listTitle: "All tickets",
    }
  }

  return {
    eyebrow: "Ticket management",
    title: "Tickets",
    description: "Review your requests, track ticket status, and open details for updates.",
    emptyMessage: "No tickets created yet. Use the form to create your first ticket.",
    listTitle: "My tickets",
  }
}

export default async function DashboardTicketsPage() {
  const cookiesStore = await cookies()
  const token = cookiesStore.get(SESSION_COOKIE_NAME)?.value
  const user = await getCurrentUserFromToken(token)

  if (!user) {
    redirect("/login")
  }

  const [tickets, stats] = await Promise.all([
    getTicketsForActor(user, 100),
    getDashboardStatsForActor(user),
  ])
  const content = getTicketPageContent(user.role)

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LifeBuoyIcon className="size-4" />
          <span>{content.eyebrow}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{content.title}</h1>
        <p className="text-sm text-muted-foreground">
          {content.description}
        </p>
      </section>

      {user.role === "agent" ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Assigned"
            value={String(stats?.total ?? 0)}
            hint="Total tickets in your queue"
            icon={<LifeBuoyIcon className="size-4" />}
          />
          <StatCard
            label="Open"
            value={String(stats?.open_tickets ?? 0)}
            hint="Ready for review"
            icon={<ClockIcon className="size-4" />}
          />
          <StatCard
            label="In progress"
            value={String(stats?.in_progress_tickets ?? 0)}
            hint="Currently being worked"
            icon={<ActivityIcon className="size-4" />}
          />
          <StatCard
            label="Resolved"
            value={String(stats?.resolved_tickets ?? 0)}
            hint="Completed assigned work"
            icon={<CheckCircle2Icon className="size-4" />}
          />
        </section>
      ) : null}

      <section className={user.role === "member" ? "grid gap-4 xl:grid-cols-[1.4fr_0.6fr]" : "grid gap-4"}>
        <div>
          <TicketList
            tickets={tickets}
            title={content.listTitle}
            emptyMessage={content.emptyMessage}
          />
        </div>

        {user.role === "member" ? (
          <div className="space-y-4">
            <CreateTicketForm />
          </div>
        ) : null}
      </section>
    </div>
  )
}
