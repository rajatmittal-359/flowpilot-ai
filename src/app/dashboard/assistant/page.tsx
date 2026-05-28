import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardAssistantPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">AI Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Explore future AI workflows for automation, summaries, and support triage.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>AI automation</CardTitle>
            <CardDescription>Smart workflows to automate ticket routing and responses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This area will house AI-powered assistants, automated suggestions, and workflow rules.
            </p>
            <div className="rounded-2xl border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
              Placeholder for AI assistant tools.
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Future tools</CardTitle>
            <CardDescription>Build intelligent helpers for your ops team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li>• Auto-response composer</li>
              <li>• Support ticket summarization</li>
              <li>• Context-aware escalation</li>
            </ol>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
