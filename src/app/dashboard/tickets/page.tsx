import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { LifeBuoyIcon } from "lucide-react"

import { CreateTicketForm } from "@/components/forms/create-ticket-form"
import { TicketList } from "@/components/tickets/ticket-list"
import { SESSION_COOKIE_NAME } from "@/lib/auth"
import { getCurrentUserFromToken } from "@/services/auth"
import { getTicketsForActor } from "@/services/tickets"

export default async function DashboardTicketsPage() {
  const cookiesStore = await cookies()
  const token = cookiesStore.get(SESSION_COOKIE_NAME)?.value
  const user = await getCurrentUserFromToken(token)

  if (!user) {
    redirect("/login")
  }

  const tickets = await getTicketsForActor(user)

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
        <div>
          <TicketList tickets={tickets} />
        </div>

        <div className="space-y-4">
          <CreateTicketForm />
        </div>
      </section>
    </div>
  )
}
