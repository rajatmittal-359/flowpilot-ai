import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { TrendingUpIcon, TrendingDownIcon, ActivityIcon, BarChart3Icon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUserFromToken } from "@/services/auth"
import {
  getAnalyticsMetrics,
  getTicketsByPriority,
  getTicketsByStatus,
  getPriorityBreakdown,
  getRecentTicketActivity,
  getResolutionMetrics,
} from "@/services/analytics"

function priorityColor(priority: string) {
  switch (priority) {
    case "urgent":
      return "bg-red-500"
    case "high":
      return "bg-orange-500"
    case "medium":
      return "bg-yellow-500"
    default:
      return "bg-green-500"
  }
}

function statusColor(status: string) {
  switch (status) {
    case "open":
      return "text-blue-600 bg-blue-50"
    case "in_progress":
      return "text-purple-600 bg-purple-50"
    case "resolved":
      return "text-green-600 bg-green-50"
    case "closed":
      return "text-gray-600 bg-gray-50"
    default:
      return "text-gray-600 bg-gray-50"
  }
}

function getMaxCount(counts: number[]) {
  return Math.max(...counts.filter((c) => c > 0), 1)
}

export default async function DashboardAnalyticsPage() {
  const cookiesStore = await cookies()
  const token = cookiesStore.get("flowpilot_session")?.value
  const user = await getCurrentUserFromToken(token)

  if (!user) {
    redirect("/login")
  }

  const [
    metrics,
    priorityDistribution,
    statusDistribution,
    priorityBreakdown,
    recentActivity,
    resolutionMetrics,
  ] = await Promise.all([
    getAnalyticsMetrics(user.id),
    getTicketsByPriority(user.id),
    getTicketsByStatus(user.id),
    getPriorityBreakdown(user.id),
    getRecentTicketActivity(user.id, 8),
    getResolutionMetrics(user.id),
  ])

  const maxPriorityCount = getMaxCount(priorityDistribution.map((p) => p.count))
  const maxStatusCount = getMaxCount(statusDistribution.map((s) => s.count))

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Review key performance indicators and insights for your support operations.
        </p>
      </section>

      {/* Key metrics cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-3xl font-bold mt-2">{metrics.total_tickets}</p>
              </div>
              <ActivityIcon className="size-8 text-slate-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-3xl font-bold mt-2">{metrics.open_tickets}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.total_tickets > 0
                    ? Math.round((metrics.open_tickets / metrics.total_tickets) * 100)
                    : 0}
                  % of total
                </p>
              </div>
              <TrendingDownIcon className="size-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-3xl font-bold mt-2">{metrics.resolved_tickets}</p>
                <p className="text-xs text-muted-foreground mt-1">{metrics.resolution_percentage}% completion</p>
              </div>
              <TrendingUpIcon className="size-8 text-green-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Coverage</p>
                <p className="text-3xl font-bold mt-2">{metrics.ai_coverage_percentage}%</p>
                <p className="text-xs text-muted-foreground mt-1">{metrics.ai_analyzed_tickets} analyzed</p>
              </div>
              <BarChart3Icon className="size-8 text-purple-300" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Charts section */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Priority distribution */}
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Tickets by Priority</CardTitle>
            <CardDescription>Distribution across priority levels</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {priorityDistribution.length > 0 ? (
                priorityDistribution.map((item) => {
                  const percentage = (item.count / maxPriorityCount) * 100
                  return (
                    <div key={item.priority}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">{item.priority}</span>
                        <span className="text-sm font-semibold">{item.count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${priorityColor(item.priority)} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">No ticket data available.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Tickets by Status</CardTitle>
            <CardDescription>Current workflow distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {statusDistribution.length > 0 ? (
                statusDistribution.map((item) => {
                  const percentage = (item.count / maxStatusCount) * 100
                  return (
                    <div key={item.status}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${statusColor(item.status)}`}>
                          {item.status.replace("_", " ")}
                        </span>
                        <span className="text-sm font-semibold">{item.count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-slate-400 transition-all" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">No status data available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* KPI overview and priority breakdown */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader className="border-b">
            <CardTitle>Priority Summary</CardTitle>
            <CardDescription>Quick breakdown by level</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                <span className="text-sm font-medium text-red-900">Urgent</span>
                <span className="text-lg font-bold text-red-600">{priorityBreakdown.urgent_count}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                <span className="text-sm font-medium text-orange-900">High</span>
                <span className="text-lg font-bold text-orange-600">{priorityBreakdown.high_count}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                <span className="text-sm font-medium text-yellow-900">Medium</span>
                <span className="text-lg font-bold text-yellow-600">{priorityBreakdown.medium_count}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <span className="text-sm font-medium text-green-900">Low</span>
                <span className="text-lg font-bold text-green-600">{priorityBreakdown.low_count}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resolution metrics */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader className="border-b">
            <CardTitle>Resolution Metrics</CardTitle>
            <CardDescription>Time to close analysis</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Average Time</p>
                <p className="text-2xl font-bold">
                  {resolutionMetrics.avg_resolution_time_hours
                    ? `${resolutionMetrics.avg_resolution_time_hours}h`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Median Time</p>
                <p className="text-2xl font-bold">
                  {resolutionMetrics.median_resolution_time_hours
                    ? `${resolutionMetrics.median_resolution_time_hours}h`
                    : "—"}
                </p>
              </div>
              <div className="pt-3 border-t space-y-2 text-xs">
                <p>
                  <span className="text-muted-foreground">Fastest:</span>{" "}
                  <span className="font-semibold">
                    {resolutionMetrics.fastest_resolution_hours
                      ? `${resolutionMetrics.fastest_resolution_hours}h`
                      : "—"}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Slowest:</span>{" "}
                  <span className="font-semibold">
                    {resolutionMetrics.slowest_resolution_hours
                      ? `${resolutionMetrics.slowest_resolution_hours}h`
                      : "—"}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* High priority alert */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader className="border-b">
            <CardTitle>Priority Alert</CardTitle>
            <CardDescription>Items needing attention</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs text-red-900 font-medium mb-1">Urgent & High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {metrics.high_priority_tickets}
                </p>
                <p className="text-xs text-red-700 mt-2">
                  {metrics.total_tickets > 0
                    ? Math.round(
                        ((priorityBreakdown.urgent_count + priorityBreakdown.high_count) / metrics.total_tickets) *
                          100
                      )
                    : 0}
                  % of workload
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Recent activity */}
      <section>
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest ticket updates and changes</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.created_at).toLocaleDateString()} at{" "}
                        {new Date(activity.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColor(activity.status)}`}>
                        {activity.status.replace("_", " ")}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize bg-slate-100 text-slate-700`}>
                        {activity.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

