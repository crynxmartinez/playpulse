'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Eye, EyeOff, Globe, Link as LinkIcon } from 'lucide-react'
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
              Game Page
            </Link>
          </div>
          
          {/* Visibility Badge */}
          {(() => {
            const visibilityMeta = {
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
            };
            const meta = visibilityMeta[project.visibility];
            const Icon = meta.icon;
            return (
              <Badge variant="outline" className={`rounded-full text-sm font-medium ${meta.className}`}>
                <Icon className="h-3 w-3 mr-1.5" />
                {meta.label}
              </Badge>
            );
          })()}
        </div>
      </div>
    </div>
  )
}
