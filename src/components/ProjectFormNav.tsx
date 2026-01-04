'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectFormNavProps {
  projectId: string
}

export default function ProjectFormNav({ projectId }: ProjectFormNavProps) {
  const pathname = usePathname()
  
  // Determine active mode based on URL
  const isFormMode = pathname.includes('/forms')
  
  return (
    <div className="mb-3">
      <div className="inline-flex items-center rounded-full border bg-muted/50 p-1">
        <Link
          href={`/dashboard/projects/${projectId}`}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
            !isFormMode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutDashboard size={14} />
          Dashboard
        </Link>
        <Link
          href={`/dashboard/projects/${projectId}/forms`}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
            isFormMode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText size={14} />
          Form
        </Link>
      </div>
    </div>
  )
}
