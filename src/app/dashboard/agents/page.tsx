export default function DashboardAgentsPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
        <p className="text-sm text-muted-foreground">
          Agent management is not available in this workspace yet.
        </p>
      </section>

      <section>
        <div className="grid h-44 place-items-center rounded-2xl border border-dashed bg-muted/30 px-6 text-center text-sm text-muted-foreground">
          Agent profiles and queue management will be added in a future release. Use Tickets to
          manage your support requests today.
        </div>
      </section>
    </div>
  )
}
