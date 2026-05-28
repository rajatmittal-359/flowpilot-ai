import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardSettingsPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure account, workspace, and notification preferences.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Account settings</CardTitle>
            <CardDescription>Manage your user profile and authentication preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
              Placeholder for account settings, email, and security preferences.
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Workspace settings</CardTitle>
            <CardDescription>Control workspace options and support team defaults.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
              Placeholder for workspace-wide configuration and team settings.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
