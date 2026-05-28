import { AiBadge } from "@/components/ai/ai-badge"
import { AiConfidenceIndicator } from "@/components/ai/ai-confidence-indicator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TicketAnalysisResult } from "@/types/ai"

export function AiAnalysisCard({ analysis }: { analysis: TicketAnalysisResult }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>AI ticket analysis</CardTitle>
          <AiConfidenceIndicator confidence={analysis.confidence} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/80 bg-background p-4">
            <p className="text-sm text-muted-foreground">Sentiment</p>
            <p className="mt-2 text-base font-semibold text-foreground capitalize">{analysis.sentiment}</p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-background p-4">
            <p className="text-sm text-muted-foreground">Urgency</p>
            <p className="mt-2 text-base font-semibold text-foreground capitalize">{analysis.urgency}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/80 bg-background p-4">
            <p className="text-sm text-muted-foreground">Recommended priority</p>
            <p className="mt-2 text-base font-semibold text-foreground capitalize">{analysis.recommendedPriority}</p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-background p-4">
            <p className="text-sm text-muted-foreground">Category</p>
            <p className="mt-2 text-base font-semibold text-foreground capitalize">{analysis.category}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-muted/60 bg-muted/20 p-4 text-sm text-muted-foreground">
          Use this AI insight to prioritize the ticket and choose the best next step.
        </div>
      </CardContent>
    </Card>
  )
}
