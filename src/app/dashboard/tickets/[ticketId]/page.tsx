import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { TicketPriorityBadge, TicketStatusBadge } from "@/components/tickets/ticket-badges"
import { TicketStatusForm } from "@/components/tickets/ticket-status-form"
import { TicketAssignmentPanel } from "@/components/tickets/ticket-assignment-panel"
import { AiWorkspace } from "@/components/ai/ai-workspace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SESSION_COOKIE_NAME } from "@/lib/auth"
import { canUpdateTicketStatus } from "@/services/permissions"
import { getCurrentUserFromToken } from "@/services/auth"
import { getTicketByIdForActor } from "@/services/tickets"
import type { TicketRow } from "@/types/db"

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString))
}

interface DashboardTicketDetailsPageProps {
  params: Promise<{
    ticketId: string
  }>
}

export default async function DashboardTicketDetailsPage({ params }: DashboardTicketDetailsPageProps) {
  const resolvedParams = await params
  const cookiesStore = await cookies()
  const token = cookiesStore.get?.(SESSION_COOKIE_NAME)?.value ?? cookiesStore.get?.(String(SESSION_COOKIE_NAME))?.value
  const user = await getCurrentUserFromToken(token)

  if (!user) {
    redirect("/login")
  }

  const ticketId = Number(resolvedParams.ticketId)
  if (Number.isNaN(ticketId)) {
    return notFound()
  }

  const ticket = await getTicketByIdForActor(user, ticketId)
  if (!ticket) {
    return notFound()
  }

  const canUseAiWorkspace = ticket.created_by === user.id
  const canUpdateStatus = canUpdateTicketStatus(user, ticket)

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <Link href="/dashboard/tickets" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/90">
            <ArrowLeft className="size-4" />
            Back to tickets
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{ticket.title}</h1>
        </div>
        <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
          <div className="font-medium text-foreground">Ticket #{ticket.id}</div>
          <div>Created {formatDate(ticket.created_at)}</div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="order-1 space-y-4 xl:order-none">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Description</CardTitle>
                  <CardDescription>Ticket request details.</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <TicketStatusBadge status={ticket.status} />
                  <TicketPriorityBadge priority={ticket.priority} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-dashed border-muted/60 bg-muted/20 p-5">
                <p className="text-sm leading-7 text-muted-foreground">
                  {ticket.description ?? "No description was provided for this ticket."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="order-2 space-y-4 xl:order-none">
          <TicketAssignmentPanel
            ticketId={ticket.id}
            assignedTo={ticket.assigned_to}
            assigneeName={ticket.assignee_name}
            assigneeEmail={ticket.assignee_email}
            currentUserRole={user.role}
          />
          {canUpdateStatus ? (
            <TicketStatusForm ticket={ticket as TicketRow} />
          ) : null}
          {canUseAiWorkspace ? (
            <>
              <AiWorkspace ticketId={ticket.id} />
            </>
          ) : null}
        </div>
      </section>
    </div>
  )
}
