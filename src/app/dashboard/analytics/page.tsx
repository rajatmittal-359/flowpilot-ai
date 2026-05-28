import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUserFromToken } from "@/services/auth"
import { getDashboardStatsForUser } from "@/services/tickets"

export default async function DashboardAnalyticsPage() {
  const cookiesStore = await cookies()
  const token = cookiesStore.get("flowpilot_session")?.value
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
      ai_analyzed_tickets: 0,
    }

  const resolvedRate = stats.total ? Math.round((stats.resolved_tickets / stats.total) * 100) : 0
  const aiCoverage = stats.total ? Math.round((stats.ai_analyzed_tickets / stats.total) * 100) : 0

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Review key performance indicators and chart summaries for your support operations.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Tickets growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 rounded-2xl border border-dashed bg-muted/30" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Resolution trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 rounded-2xl border border-dashed bg-muted/30" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Priority mix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 rounded-2xl border border-dashed bg-muted/30" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>KPI overview</CardTitle>
            <CardDescription>Quick performance snapshots for support workflow health.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Total tickets", value: String(stats.total) },
              { label: "Resolved rate", value: `${resolvedRate}%` },
              { label: "High priority", value: String(stats.high_priority_tickets) },
              { label: "AI-ready tickets", value: `${stats.ai_analyzed_tickets} (${aiCoverage}%)` },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border bg-background p-4">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{metric.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Insights</CardTitle>
            <CardDescription>Early analytics for support workload and AI readiness.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/80 bg-background p-4">
                <p className="text-sm text-muted-foreground">Open tickets</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{stats.open_tickets}</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-background p-4">
                <p className="text-sm text-muted-foreground">Tickets ready for AI analysis</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{stats.ai_analyzed_tickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
