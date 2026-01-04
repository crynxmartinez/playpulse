'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Form {
  id: string
  title: string
  slug: string | null
  isActive: boolean
}

interface ProjectFormNavProps {
  projectId: string
  forms: Form[]
}

export default function ProjectFormNav({ projectId, forms }: ProjectFormNavProps) {
  const pathname = usePathname()
  
  // Check if we're on a specific form page
  const activeFormId = pathname.match(/\/forms\/([^/]+)$/)?.[1] || null
  
  if (forms.length === 0) {
    return null
  }

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-muted-foreground font-medium px-2 shrink-0">Forms:</span>
        <div className="flex items-center gap-1.5 rounded-full border bg-muted/30 p-1">
          {forms.map((form) => {
            const isActive = activeFormId === form.id
            return (
              <Link
                key={form.id}
                href={`/dashboard/projects/${projectId}/forms/${form.id}`}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <FileText size={12} />
                {form.title}
                {form.isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                )}
              </Link>
            )
          })}
          <Link
            href={`/dashboard/projects/${projectId}/forms`}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground rounded-full transition-colors"
          >
            <Plus size={12} />
          </Link>
        </div>
      </div>
    </div>
  )
}
