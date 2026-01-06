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
    <div className="flex items-center rounded-full border border-[#2a2a3e] bg-[#0d0d15] p-1">
      <Link
        href={workspaceUrl}
        className={cn(
          "px-3 py-1.5 text-xs sm:text-sm sm:px-4 font-medium rounded-full transition-colors",
          activeView === 'workspace'
            ? "bg-purple-600 text-white shadow-sm"
            : "text-slate-400 hover:text-white"
        )}
      >
        Workspace
      </Link>
      <Link
        href={gamePageUrl}
        className={cn(
          "px-3 py-1.5 text-xs sm:text-sm sm:px-4 font-medium rounded-full transition-colors",
          activeView === 'gamepage'
            ? "bg-purple-600 text-white shadow-sm"
            : "text-slate-400 hover:text-white"
        )}
      >
        Game Page
      </Link>
    </div>
  )
}
