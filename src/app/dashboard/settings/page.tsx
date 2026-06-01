import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SESSION_COOKIE_NAME } from "@/lib/auth"
import { getCurrentUserFromToken } from "@/services/auth"

function formatRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export default async function DashboardSettingsPage() {
  const cookiesStore = await cookies()
  const token = cookiesStore.get(SESSION_COOKIE_NAME)?.value
  const user = await getCurrentUserFromToken(token)

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Your account details for this workspace.</p>
      </section>

      <section className="max-w-lg">
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Account</CardTitle>
            <CardDescription>Read-only profile information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="mt-1 text-sm font-medium text-foreground">{user.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="mt-1 text-sm font-medium text-foreground">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="mt-1 text-sm font-medium text-foreground">{formatRole(user.role)}</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
