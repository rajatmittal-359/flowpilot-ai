import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AiSummaryCard } from "@/components/ai/ai-summary-card"
import { AiSuggestionCard } from "@/components/ai/ai-suggestion-card"
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
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">AI Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Generate ticket summaries and suggested replies by ticket ID.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AiSummaryCard />
        <AiSuggestionCard />
      </section>
    </div>
  )
}
