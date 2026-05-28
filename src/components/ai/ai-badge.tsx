export function AiBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-slate-900/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 ring-1 ring-slate-900/5">
      {label}
    </span>
  )
}
