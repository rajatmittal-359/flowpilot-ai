import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardTicketsPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
        <p className="text-sm text-muted-foreground">
          Manage incoming requests, track priorities, and prepare tickets for future detail workflows.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Ticket list</CardTitle>
            <CardDescription>Review open support tickets and drill into details later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                {
                  id: "#101",
                  title: "Unable to sync workspace",
                  status: "Open",
                  priority: "High",
                },
                {
                  id: "#102",
                  title: "Billing email not received",
                  status: "In progress",
                  priority: "Medium",
                },
                {
                  id: "#103",
                  title: "Feature request: AI summary",
                  status: "Open",
                  priority: "Low",
                },
              ].map((ticket) => (
                <div key={ticket.id} className="rounded-2xl border bg-background p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{ticket.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{ticket.id}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="block rounded-full bg-muted px-2 py-1 text-muted-foreground">
                        {ticket.status}
                      </span>
                      <span className="mt-2 block rounded-full bg-muted/70 px-2 py-1 text-muted-foreground">
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Create ticket</CardTitle>
            <CardDescription>Start a new support ticket for the ops team.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This section will become the ticket creation form. For now, use the main dashboard to file a new ticket.
              </p>
              <div className="rounded-2xl border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
                Placeholder for the create ticket flow.
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
