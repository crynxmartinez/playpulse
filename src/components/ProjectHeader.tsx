'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { EyeOff, Globe, Link as LinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ProjectHeaderProps {
  project: {
    id: string
    name: string
    slug: string | null
    description: string | null
    visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC'
  }
}

const VISIBILITY_META = {
  PUBLIC: {
    label: 'Public',
    icon: Globe,
    className: 'text-green-600 border-green-200 bg-green-50',
  },
  UNLISTED: {
    label: 'Unlisted',
    icon: LinkIcon,
    className: 'text-yellow-600 border-yellow-200 bg-yellow-50',
  },
  PRIVATE: {
    label: 'Private',
    icon: EyeOff,
    className: 'bg-muted',
  },
}

export default function ProjectHeader({ project }: ProjectHeaderProps) {
  const pathname = usePathname()
  
  // Determine if we're in public view mode based on URL
  const isPublicView = pathname.includes('/public')
  const workspaceUrl = `/dashboard/projects/${project.id}`
  const publicEditorUrl = `/dashboard/projects/${project.id}/public`
  
  const meta = VISIBILITY_META[project.visibility]
  const VisibilityIcon = meta.icon

  return (
    <div className="rounded-3xl border bg-card p-4 mb-4">
      {/* Desktop: Single row spread apart */}
      {/* Mobile: Stack vertically */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left - Title & Description */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate">{project.name}</h1>
            {/* Visibility Badge - Inline on mobile */}
            <Badge 
              variant="outline" 
              className={`rounded-full text-xs font-medium sm:hidden ${meta.className}`}
            >
              <VisibilityIcon className="h-3 w-3 mr-1" />
              {meta.label}
            </Badge>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{project.description}</p>
          )}
        </div>
        
        {/* Right - Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Workspace / Game Page Toggle */}
          <div className="flex items-center rounded-2xl border bg-muted/50 p-1">
            <Link
              href={workspaceUrl}
              className={`px-3 py-1.5 text-xs sm:text-sm sm:px-4 font-medium rounded-xl transition-colors ${
                !isPublicView
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Workspace
            </Link>
            <Link
              href={publicEditorUrl}
              className={`px-3 py-1.5 text-xs sm:text-sm sm:px-4 font-medium rounded-xl transition-colors ${
                isPublicView
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Game Page
            </Link>
          </div>
          
          {/* Visibility Badge - Hidden on mobile (shown inline with title) */}
          <Badge 
            variant="outline" 
            className={`hidden sm:flex rounded-full text-sm font-medium ${meta.className}`}
          >
            <VisibilityIcon className="h-3 w-3 mr-1.5" />
            {meta.label}
          </Badge>
        </div>
      </div>
    </div>
  )
}
