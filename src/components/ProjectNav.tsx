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
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectNavProps {
  projectId: string
}

// Form mode nav items
const formNavItems = [
  { href: '/stats', label: 'Stats', icon: BarChart2 },
  { href: '/forms', label: 'Campaigns', icon: FileText },
  { href: '/responses', label: 'Responses', icon: MessageSquare },
  { href: '/analytics', label: 'Analytics', icon: LineChart },
  { href: '/snapshots', label: 'Snapshots', icon: Camera },
  { href: '/forms/settings', label: 'Settings', icon: Settings },
]

// Overview mode nav items
const overviewNavItems = [
  { href: '', label: 'Overview', icon: Eye },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function ProjectNav({ projectId }: ProjectNavProps) {
  const pathname = usePathname()
  const basePath = `/dashboard/projects/${projectId}`
  
  // Determine mode based on URL
  // Form mode: /forms, /stats, /responses, /analytics, /snapshots
  // Overview mode: base path, /settings (but not /forms/settings)
  const isFormMode = pathname.includes('/forms') || pathname.includes('/stats') || pathname.includes('/responses') || pathname.includes('/analytics') || pathname.includes('/snapshots')
  
  const navItems = isFormMode ? formNavItems : overviewNavItems

  return (
    <nav className="rounded-2xl border bg-card p-1 flex items-center gap-1 overflow-x-auto">
      {navItems.map((item) => {
        const href = `${basePath}${item.href}`
        const isActive = item.href === '' 
          ? pathname === basePath || pathname === `${basePath}/`
          : pathname.startsWith(href)
        const Icon = item.icon

        return (
          <Link
            key={item.href || 'overview'}
            href={href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon size={16} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
