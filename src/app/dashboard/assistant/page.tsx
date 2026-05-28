import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ActivityIcon, SparklesIcon } from "lucide-react"

import { AiSummaryCard } from "@/components/ai/ai-summary-card"
import { AiSuggestionCard } from "@/components/ai/ai-suggestion-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SESSION_COOKIE_NAME } from "@/lib/auth"
import { getCurrentUserFromToken } from "@/services/auth"

export default async function DashboardAssistantPage() {
  const cookiesStore = await cookies()
  const token = cookiesStore.get(SESSION_COOKIE_NAME)?.value
  const user = await getCurrentUserFromToken(token)

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SparklesIcon className="size-4" />
          <span>AI support foundation</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Assistant</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Built for support teams, this assistant foundation gives you AI summaries and suggested replies for your ticket pipeline.
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>AI assistant workflow</CardTitle>
            <CardDescription>Generate smart ticket summaries and customer-facing replies without exposing API keys.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-dashed border-muted/70 bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">Ticket summary</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Extract key details from a ticket to help your team triage faster.
                </p>
              </div>
              <div className="rounded-2xl border border-dashed border-muted/70 bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">Suggested reply</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Draft professional customer responses with a single ticket lookup.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-background p-4">
              <ActivityIcon className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Foundation ready</p>
                <p className="text-sm text-muted-foreground">
                  Gemini-based AI routes are isolated on the server and authorized with session cookies.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>AI health</CardTitle>
            <CardDescription>Track the assistant status and readiness for future workflow expansion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-muted/70 bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">Secure server-side AI</p>
              <p className="mt-2 text-sm text-muted-foreground">
                All Gemini requests happen on the server. Your API key stays private and protected.
              </p>
            </div>
            <div className="rounded-2xl border border-muted/70 bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">Future-ready architecture</p>
              <p className="mt-2 text-sm text-muted-foreground">
                The service layer is isolated so you can swap providers, add streaming, or add retrieval later.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AiSummaryCard />
        <AiSuggestionCard />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Suggested automations</CardTitle>
            <CardDescription>Ideas for AI workflows and support automation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="space-y-2 list-disc pl-5">
              <li>Ticket triage based on priority and sentiment.</li>
              <li>Automated response drafts for common issues.</li>
              <li>AI-generated status summaries for managers.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Assistant activity</CardTitle>
            <CardDescription>Placeholder for AI workflow metrics and history.</CardDescription>
          </CardHeader>
          <CardContent className="rounded-2xl border border-dashed border-muted/70 bg-muted/20 p-6 text-sm text-muted-foreground">
            AI usage details, runtime health, and workflow history will appear here when the assistant is extended.
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
