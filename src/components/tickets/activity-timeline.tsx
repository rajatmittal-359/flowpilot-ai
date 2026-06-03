import { formatDistanceToNowStrict } from "date-fns"
import type { ActivityEntry } from "@/services/activity"

export function ActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
        No activity yet.
      </div>
    )
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3 text-sm">
          <div className="mt-0.5 size-2 shrink-0 rounded-full bg-primary/40 mt-1.5" />
          <div className="flex-1 space-y-0.5">
            <div className="text-foreground">{entry.action}</div>
            <div className="text-xs text-muted-foreground">
              {entry.actor_name ?? "System"} &middot;{" "}
              {formatDistanceToNowStrict(new Date(entry.created_at))} ago
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
