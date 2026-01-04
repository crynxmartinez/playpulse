'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BarChart2, 
  FileText, 
  MessageSquare, 
  LineChart, 
  Settings 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectNavProps {
  projectId: string
}

const navItems = [
  { href: '/stats', label: 'Stats', icon: BarChart2 },
  { href: '/forms', label: 'Campaigns', icon: FileText },
  { href: '/responses', label: 'Responses', icon: MessageSquare },
  { href: '/analytics', label: 'Analytics', icon: LineChart },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function ProjectNav({ projectId }: ProjectNavProps) {
  const pathname = usePathname()
  const basePath = `/dashboard/projects/${projectId}`

  return (
    <nav className="rounded-2xl border bg-card p-1 flex items-center gap-1 overflow-x-auto">
      {navItems.map((item) => {
        const href = `${basePath}${item.href}`
        const isActive = pathname.startsWith(href)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
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
