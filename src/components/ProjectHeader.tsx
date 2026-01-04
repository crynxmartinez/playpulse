'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

interface ProjectHeaderProps {
  project: {
    id: string
    name: string
    slug: string | null
    description: string | null
    visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC'
  }
}

export default function ProjectHeader({ project }: ProjectHeaderProps) {
  const pathname = usePathname()
  
  // Determine if we're in public view mode based on URL
  const isPublicView = pathname.includes('/public')
  const workspaceUrl = `/dashboard/projects/${project.id}`
  const publicEditorUrl = `/dashboard/projects/${project.id}/public`

  return (
    <div className="rounded-3xl border bg-card p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
        
        {/* Workspace / Public View Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-2xl border bg-muted/50 p-1">
            <Link
              href={workspaceUrl}
              className={`px-4 py-1.5 text-sm font-medium rounded-xl transition-colors ${
                !isPublicView
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Workspace
            </Link>
            <Link
              href={publicEditorUrl}
              className={`px-4 py-1.5 text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5 ${
                isPublicView
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background'
              }`}
            >
              Public View
            </Link>
          </div>
          
          {/* Visibility Badge */}
          {project.visibility === 'PRIVATE' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm">
              <EyeOff size={14} />
              Private
            </div>
          )}
          {project.visibility === 'PUBLIC' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm">
              <Eye size={14} />
              Public
            </div>
          )}
          {project.visibility === 'UNLISTED' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700 text-sm">
              <Eye size={14} />
              Unlisted
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
