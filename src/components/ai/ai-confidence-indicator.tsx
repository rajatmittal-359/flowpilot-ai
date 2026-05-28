export function AiConfidenceIndicator({ confidence }: { confidence: number }) {
  const score = Math.min(Math.max(confidence, 0), 1)
  const percentage = Math.round(score * 100)
  const ring = score > 0.8 ? "ring-emerald-500" : score > 0.6 ? "ring-amber-500" : "ring-rose-500"

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-muted/70 bg-muted/60 px-3 py-1 text-xs font-medium text-foreground">
      <span className={`h-2.5 w-2.5 rounded-full ${ring}`} />
      {percentage}% confidence
    </div>
  )
}
