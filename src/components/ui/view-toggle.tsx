'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ViewToggleProps {
  workspaceUrl: string
  gamePageUrl: string
  activeView: 'workspace' | 'gamepage'
}

export function ViewToggle({ workspaceUrl, gamePageUrl, activeView }: ViewToggleProps) {
  return (
    <div className="flex items-center rounded-2xl border bg-muted/50 p-1">
      <Link
        href={workspaceUrl}
        className={cn(
          "px-3 py-1.5 text-xs sm:text-sm sm:px-4 font-medium rounded-xl transition-colors",
          activeView === 'workspace'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Workspace
      </Link>
      <Link
        href={gamePageUrl}
        className={cn(
          "px-3 py-1.5 text-xs sm:text-sm sm:px-4 font-medium rounded-xl transition-colors",
          activeView === 'gamepage'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Game Page
      </Link>
    </div>
  )
}
