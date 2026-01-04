'use client'

import { useState } from 'react'
import { ExternalLink, Eye, EyeOff } from 'lucide-react'

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
  const [viewMode, setViewMode] = useState<'workspace' | 'public'>('workspace')
  
  // Generate slug from project name
  const projectSlug = project.slug || project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const publicUrl = `/g/${projectSlug}`
  
  const canPreview = project.visibility === 'PUBLIC' || project.visibility === 'UNLISTED'

  const handleToggle = (mode: 'workspace' | 'public') => {
    if (mode === 'public' && canPreview) {
      window.open(publicUrl, '_blank')
    }
    setViewMode(mode)
  }

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
            <button
              onClick={() => handleToggle('workspace')}
              className={`px-4 py-1.5 text-sm font-medium rounded-xl transition-colors ${
                viewMode === 'workspace'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Workspace
            </button>
            <button
              onClick={() => handleToggle('public')}
              disabled={!canPreview}
              className={`px-4 py-1.5 text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5 ${
                viewMode === 'public'
                  ? 'bg-background text-foreground shadow-sm'
                  : canPreview
                    ? 'text-muted-foreground hover:text-foreground'
                    : 'text-muted-foreground/50 cursor-not-allowed'
              }`}
            >
              Public View
              {canPreview && <ExternalLink size={12} />}
            </button>
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
