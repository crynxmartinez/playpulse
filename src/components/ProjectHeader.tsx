'use client'

import { EyeOff, Globe, Link as LinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ViewToggle } from '@/components/ui/view-toggle'
import { Project, VISIBILITY_CONFIG } from '@/types'

interface ProjectHeaderProps {
  project: Project
}

const VISIBILITY_ICONS = {
  PUBLIC: Globe,
  UNLISTED: LinkIcon,
  PRIVATE: EyeOff,
}

export default function ProjectHeader({ project }: ProjectHeaderProps) {
  const workspaceUrl = `/dashboard/projects/${project.id}`
  const gamePageUrl = `/game/${project.id}`
  
  const config = VISIBILITY_CONFIG[project.visibility]
  const VisibilityIcon = VISIBILITY_ICONS[project.visibility]

  return (
    <div className="rounded-3xl border bg-card p-4 mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left - Title & Description */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate">{project.name}</h1>
            {/* Visibility Badge - Inline on mobile */}
            <Badge 
              variant="outline" 
              className={`rounded-full text-xs font-medium sm:hidden ${config.className}`}
            >
              <VisibilityIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{project.description}</p>
          )}
        </div>
        
        {/* Right - Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <ViewToggle 
            workspaceUrl={workspaceUrl}
            gamePageUrl={gamePageUrl}
            activeView="workspace"
          />
          
          {/* Visibility Badge - Hidden on mobile (shown inline with title) */}
          <Badge 
            variant="outline" 
            className={`hidden sm:flex rounded-full text-sm font-medium ${config.className}`}
          >
            <VisibilityIcon className="h-3 w-3 mr-1.5" />
            {config.label}
          </Badge>
        </div>
      </div>
    </div>
  )
}
