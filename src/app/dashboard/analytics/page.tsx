import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardAnalyticsPage() {
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
              { label: "CSAT", value: "93 %" },
              { label: "Avg. response", value: "12h" },
              { label: "Resolved", value: "430" },
              { label: "Backlog", value: "14" },
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
            <CardDescription>Future analytics for teams and operational forecasting.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
              Placeholder for analytical insights and trend analysis.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
