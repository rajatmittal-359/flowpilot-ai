"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AiLoadingState } from "./ai-loading-state"
import { AiErrorState } from "./ai-error-state"
import { AiConfidenceIndicator } from "./ai-confidence-indicator"
import { AiBadge } from "./ai-badge"
import { toast } from "sonner"

type Analysis = {
  sentiment: string
  urgency: string
  recommendedPriority: string
  category: string
  confidence: number
}

export function AiWorkspace({ ticketId }: { ticketId: number }) {
  const [summary, setSummary] = useState<string | null>(null)
  const [reply, setReply] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch("/api/ai/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      })

      const payload = await res.json()
      // Support both legacy and new response shapes
      const workspace = payload?.success ? payload.workspace : payload

      if (!workspace) {
        setError("AI service temporarily unavailable. Try again later.")
        return
      }

      setSummary(workspace?.summary ?? null)
      setReply(workspace?.suggestedReply ?? null)
      setAnalysis(workspace?.analysis ?? null)
      setAnalyzedAt(workspace?.analyzedAt ?? null)

      const isFallbackAnalysis = workspace?.analysis && workspace.analysis.sentiment === "unknown" && Number(workspace.analysis.confidence) === 0.5
      if (isFallbackAnalysis && !workspace?.summary && !workspace?.suggestedReply) {
        setError("AI service temporarily unavailable. Try again later.")
      }
    } catch (err) {
      setError("AI service temporarily unavailable. Try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  const cooldownMs = 5 * 60 * 1000 // 5 minutes
  const analyzedAtMs = analyzedAt ? Date.parse(analyzedAt) : 0
  const isInCooldown = Boolean(analyzedAt) && Date.now() - analyzedAtMs < cooldownMs

  async function regenerate(kind: "analysis" | "summary" | "reply") {
    setIsRegenerating(true)
    setError(null)

    try {
      const res = await fetch(`/api/ai/regenerate/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      })

      const payload = await res.json()
      if (!res.ok) {
        setError(payload?.message ?? "Unable to regenerate.")
        return
      }

      // reload fresh workspace
      await load()
    } catch (err) {
      setError("Unable to contact AI service.")
    } finally {
      setIsRegenerating(false)
    }
  }

  if (isLoading) return <AiLoadingState message="Loading AI workspace…" />
  if (error) return <AiErrorState message={error} />

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="border-b flex items-center justify-between gap-3">
          <CardTitle>AI Summary</CardTitle>
          <div className="flex items-center gap-2">
            {analyzedAt ? <AiBadge label={`Analyzed ${new Date(analyzedAt).toLocaleString()}`} /> : null}
            {analyzedAt ? <AiBadge label="Cached result" /> : null}
            <Button size="sm" onClick={async () => { await regenerate("summary"); toast.success("Summary regenerated") }} disabled={isRegenerating || isInCooldown}>
              {isInCooldown ? "Cooldown" : "Regenerate"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {summary ? (
            <div className="prose max-w-none text-sm leading-7">{summary}</div>
          ) : (
            <div className="text-sm text-muted-foreground">No summary available.</div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="border-b flex items-center justify-between gap-3">
          <CardTitle>Suggested reply</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={async () => { await regenerate("reply"); toast.success("Reply regenerated") }} disabled={isRegenerating || isInCooldown}>
              {isInCooldown ? "Cooldown" : "Regenerate"}
            </Button>
            <Button size="sm" onClick={async () => { if (reply) { await navigator.clipboard.writeText(reply); toast.success("Copied reply to clipboard") } }} disabled={!reply}>
              Copy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reply ? (
            <div className="prose max-w-none text-sm leading-7">{reply}</div>
          ) : (
            <div className="text-sm text-muted-foreground">No suggested reply available.</div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="border-b flex items-center justify-between gap-3">
          <CardTitle>AI Analysis</CardTitle>
          <div className="flex items-center gap-2">
            {analysis ? <AiConfidenceIndicator confidence={analysis.confidence} /> : null}
            <Button size="sm" onClick={async () => { await regenerate("analysis"); toast.success("Analysis regenerated") }} disabled={isRegenerating}>
              Regenerate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Sentiment</p>
                <div className="font-semibold capitalize">{analysis.sentiment}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Urgency</p>
                <div className="font-semibold capitalize">{analysis.urgency}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <div className="font-semibold capitalize">{analysis.recommendedPriority}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <div className="font-semibold capitalize">{analysis.category}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No AI analysis available.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
