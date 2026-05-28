import type * as React from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type StatCardProps = {
  label: string
  value: string
  hint?: string
  icon?: React.ReactNode
  trend?: {
    label: string
    tone?: "neutral" | "positive" | "negative"
  }
  className?: string
}

const trendToneClass: Record<
  NonNullable<StatCardProps["trend"]>["tone"],
  string
> = {
  neutral: "text-muted-foreground",
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-rose-600 dark:text-rose-400",
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("shadow-sm", className)} size="sm">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">
            {value}
          </div>
        </div>
        {icon ? (
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
            {icon}
          </div>
        ) : null}
      </CardHeader>
      {(hint || trend) && (
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-xs">
            {trend ? (
              <span className={cn(trendToneClass[trend.tone ?? "neutral"])}>
                {trend.label}
              </span>
            ) : null}
            {hint ? (
              <span className="text-muted-foreground">{hint}</span>
            ) : null}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

