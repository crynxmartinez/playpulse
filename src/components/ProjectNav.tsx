'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BarChart2, 
  FileText, 
  MessageSquare, 
  LineChart, 
  Camera,
  Settings,
  Eye,
  GitBranch,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectNavProps {
  projectId: string
}

// Form mode nav items
const formNavItems = [
  { href: '/stats', label: 'Stats', shortLabel: 'Stats', icon: BarChart2 },
  { href: '/forms', label: 'Campaigns', shortLabel: 'Forms', icon: FileText },
  { href: '/responses', label: 'Responses', shortLabel: 'Resp.', icon: MessageSquare },
  { href: '/analytics', label: 'Analytics', shortLabel: 'Stats', icon: LineChart },
  { href: '/snapshots', label: 'Snapshots', shortLabel: 'Snaps', icon: Camera },
  { href: '/forms/settings', label: 'Settings', shortLabel: 'Set.', icon: Settings },
]

// Overview mode nav items
const overviewNavItems = [
  { href: '', label: 'Overview', shortLabel: 'Overview', icon: Eye },
  { href: '/settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
]

// Updates mode nav items
const updatesNavItems = [
  { href: '/updates', label: 'Versions', shortLabel: 'Versions', icon: GitBranch },
]

export default function ProjectNav({ projectId }: ProjectNavProps) {
  const pathname = usePathname()
  const basePath = `/dashboard/projects/${projectId}`
  
  // Determine mode based on URL
  const isFormMode = pathname.includes('/forms') || pathname.includes('/stats') || pathname.includes('/responses') || pathname.includes('/analytics') || pathname.includes('/snapshots')
  const isUpdatesMode = pathname.includes('/updates')
  
  const navItems = isUpdatesMode ? updatesNavItems : isFormMode ? formNavItems : overviewNavItems

  return (
    <nav className="rounded-2xl border border-[#2a2a3e] bg-[#0d0d15] p-1 flex items-center gap-1 overflow-x-auto scrollbar-hide">
      {navItems.map((item) => {
        const href = `${basePath}${item.href}`
        // More precise matching to avoid /forms matching /forms/settings
        const isActive = item.href === '' 
          ? pathname === basePath || pathname === `${basePath}/`
          : item.href === '/forms' 
            ? pathname === href || pathname === `${href}/`
            : pathname.startsWith(href)
        const Icon = item.icon

        return (
          <Link
            key={item.href || 'overview'}
            href={href}
            className={cn(
              "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap",
              isActive
                ? "bg-purple-600 text-white"
                : "text-slate-400 hover:bg-[#1a1a2e] hover:text-white"
            )}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span className="sm:hidden">{item.shortLabel}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
