import {
  ActivityIcon,
  BotIcon,
  LifeBuoyIcon,
  TrendingUpIcon,
} from "lucide-react"

import { StatCard } from "@/components/dashboard/stat-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back — here’s a quick snapshot of what’s happening.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open tickets"
          value="—"
          hint="This will populate from your support system"
          icon={<LifeBuoyIcon className="size-4" />}
          trend={{ label: "No data yet", tone: "neutral" }}
        />
        <StatCard
          label="Customers"
          value="—"
          hint="Synced customers will appear here"
          icon={<ActivityIcon className="size-4" />}
          trend={{ label: "No data yet", tone: "neutral" }}
        />
        <StatCard
          label="AI resolutions"
          value="—"
          hint="Automation impact overview"
          icon={<BotIcon className="size-4" />}
          trend={{ label: "No data yet", tone: "neutral" }}
        />
        <StatCard
          label="SLA performance"
          value="—"
          hint="Response and resolution trends"
          icon={<TrendingUpIcon className="size-4" />}
          trend={{ label: "No data yet", tone: "neutral" }}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Analytics</CardTitle>
            <CardDescription>
              Key performance charts will live here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid h-[280px] place-items-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground">
              Analytics charts placeholder
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest events across your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                "Ticket updates will appear here",
                "Customer events will appear here",
                "AI assistant actions will appear here",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm">{item}</div>
                    <div className="text-xs text-muted-foreground">
                      Coming soon
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">—</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>
              Suggested replies, summaries, and automations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid h-40 place-items-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground">
              AI assistant module placeholder
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Work queue</CardTitle>
            <CardDescription>
              Tickets requiring attention will show up here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid h-40 place-items-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground">
              Queue placeholder
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

