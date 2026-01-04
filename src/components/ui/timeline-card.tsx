'use client'

import { FileText, GitCommit, TestTube2, ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type UpdateType = 'DEVLOG' | 'RELEASE' | 'PLAYTEST'

interface Update {
  id: string
  title: string
  type: UpdateType
  version?: string
  date: string
  highlights: string[]
  responses?: number
  funScore?: number
  funDelta?: number
}

interface TimelineCardProps {
  update: Update
  onOpen: (update: Update) => void
}

function IconDot({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-2xl border bg-background/70">
      {children}
    </div>
  )
}

export function TimelineCard({ update, onOpen }: TimelineCardProps) {
  const isPlaytest = update.type === 'PLAYTEST'
  const isRelease = update.type === 'RELEASE'
  const icon = isPlaytest 
    ? <TestTube2 className="h-4 w-4" /> 
    : isRelease 
      ? <GitCommit className="h-4 w-4" /> 
      : <FileText className="h-4 w-4" />

  return (
    <button
      onClick={() => onOpen(update)}
      className="group w-full text-left"
    >
      <div className="rounded-3xl border bg-background/60 p-4 shadow-sm transition hover:shadow-md">
        <div className="flex items-start gap-3">
          <IconDot>{icon}</IconDot>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold truncate">{update.title}</div>
              <Badge variant="outline" className="rounded-full">
                {update.type}
              </Badge>
              {update.version && (
                <Badge variant="secondary" className="rounded-full">
                  {update.version}
                </Badge>
              )}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{update.date}</div>
            <ul className="mt-3 space-y-1 text-sm">
              {update.highlights.slice(0, 3).map((h, i) => (
                <li key={i} className="text-muted-foreground">
                  • {h}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              {typeof update.responses === 'number' && (
                <Badge variant="secondary" className="rounded-full">
                  {update.responses} responses
                </Badge>
              )}
              {typeof update.funScore === 'number' && (
                <Badge variant="secondary" className="rounded-full">
                  Fun {update.funScore.toFixed(1)} ({update.funDelta! >= 0 ? '+' : ''}{update.funDelta})
                </Badge>
              )}
              <span className="ml-auto inline-flex items-center gap-1 text-sm text-muted-foreground transition group-hover:text-foreground">
                Open <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

export type { Update, UpdateType }
