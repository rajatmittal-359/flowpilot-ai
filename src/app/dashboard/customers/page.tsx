import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardCustomersPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Monitor customer accounts, support tiers, and key engagement metrics.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Customer management</CardTitle>
            <CardDescription>Keep track of active accounts and customer health.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This workspace will let you manage customer profiles, plan tiers, and support relationships.
            </p>
            <div className="rounded-2xl border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
              Placeholder for customer list and account actions.
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Customer metrics</CardTitle>
            <CardDescription>See engagement, churn risk, and support workload snapshots.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Active accounts", value: "1,024" },
                { label: "Support health", value: "89 %" },
                { label: "Top tier", value: "Enterprise" },
                { label: "Recent upgrades", value: "18" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-2xl border bg-background p-4">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{metric.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
