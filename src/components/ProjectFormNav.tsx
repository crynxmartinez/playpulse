'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Eye, FileText, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectFormNavProps {
  projectId: string
}

export default function ProjectFormNav({ projectId }: ProjectFormNavProps) {
  const pathname = usePathname()
  const basePath = `/dashboard/projects/${projectId}`
  
  // Determine active mode based on URL
  const isFormMode = pathname.includes('/forms') || pathname.includes('/stats') || pathname.includes('/responses') || pathname.includes('/analytics') || pathname.includes('/snapshots')
  const isUpdatesMode = pathname.includes('/updates')
  const isOverviewMode = !isFormMode && !isUpdatesMode
  
  return (
    <div className="mb-3">
      <div className="inline-flex items-center rounded-full border bg-muted/50 p-1">
        <Link
          href={basePath}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors",
            isOverviewMode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Eye size={14} />
          <span>Overview</span>
        </Link>
        <Link
          href={`${basePath}/forms`}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors",
            isFormMode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText size={14} />
          <span>Form</span>
        </Link>
        <Link
          href={`${basePath}/updates`}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors",
            isUpdatesMode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Megaphone size={14} />
          <span>Updates</span>
        </Link>
      </div>
    </div>
  )
}
