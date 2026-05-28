export function AiLoadingState({ message = "Generating response..." }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-muted/60 bg-muted/20 p-4 text-sm text-muted-foreground">
      {message}
    </div>
  )
}
