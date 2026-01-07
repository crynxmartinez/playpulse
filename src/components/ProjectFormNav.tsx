'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Eye, FileText, Megaphone, ImageIcon } from 'lucide-react'
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
  const isGalleryMode = pathname.includes('/gallery')
  const isOverviewMode = !isFormMode && !isUpdatesMode && !isGalleryMode
  
  return (
    <div className="mb-3">
      <div className="inline-flex items-center rounded-full border border-[#2a2a3e] bg-[#0d0d15] p-1">
        <Link
          href={basePath}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors",
            isOverviewMode
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white"
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
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white"
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
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          )}
        >
          <Megaphone size={14} />
          <span>Updates</span>
        </Link>
        <Link
          href={`${basePath}/gallery`}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors",
            isGalleryMode
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          )}
        >
          <ImageIcon size={14} />
          <span>Gallery</span>
        </Link>
      </div>
    </div>
  )
}
