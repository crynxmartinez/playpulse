import { cn } from "@/lib/utils"

interface StatPillProps {
  label: string
  value: string
  hint?: string
  className?: string
}

export function StatPill({ label, value, hint, className }: StatPillProps) {
  return (
    <div className={cn("rounded-2xl border bg-background/60 px-3 py-2 shadow-sm", className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-lg font-semibold">{value}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
    </div>
  )
}
