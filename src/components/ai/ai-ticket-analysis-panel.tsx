"use client"

import { useEffect, useState } from "react"
import { AiAnalysisCard } from "@/components/ai/ai-analysis-card"
import { AiErrorState } from "@/components/ai/ai-error-state"
import { AiLoadingState } from "@/components/ai/ai-loading-state"
import type { TicketAnalysisResult } from "@/types/ai"

export function AiTicketAnalysisPanel({ ticketId }: { ticketId: number }) {
  const [analysis, setAnalysis] = useState<TicketAnalysisResult | null>(null)
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAnalysis() {
      setError("")
      setIsLoading(true)

      try {
        const response = await fetch("/api/ai/analyze-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId }),
        })

        const payload = await response.json()
        if (!response.ok) {
          setError(payload?.message ?? "Unable to load AI analysis.")
          return
        }

        setAnalysis(payload)
      } catch (err) {
        setError("Unable to connect to AI analysis service.")
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalysis()
  }, [ticketId])

  if (isLoading) {
    return <AiLoadingState message="Analyzing ticket with AI..." />
  }

  if (error) {
    return <AiErrorState message={error} />
  }

  if (!analysis) {
    return <AiErrorState message="AI analysis could not be retrieved." />
  }

  return <AiAnalysisCard analysis={analysis} />
}
