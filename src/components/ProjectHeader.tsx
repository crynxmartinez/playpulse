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
  const [isPublicView, setIsPublicView] = useState(false)
  
  // Generate slug from project name
  const projectSlug = project.slug || project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const publicUrl = `/g/${projectSlug}`
  
  const canPreview = project.visibility === 'PUBLIC' || project.visibility === 'UNLISTED'

  const handleToggle = () => {
    if (isPublicView) {
      setIsPublicView(false)
    } else if (canPreview) {
      // Open public view in new tab
      window.open(publicUrl, '_blank')
    }
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
        
        {/* Public View Toggle */}
        <div className="flex items-center gap-3">
          {canPreview ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
            >
              <Eye size={16} />
              <span className="text-sm font-medium">Public View</span>
              <ExternalLink size={14} />
            </a>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground">
              <EyeOff size={16} />
              <span className="text-sm font-medium">Private</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
