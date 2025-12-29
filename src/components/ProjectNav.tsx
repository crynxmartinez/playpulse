'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  BarChart2, 
  FileText, 
  MessageSquare, 
  LineChart, 
  Settings 
} from 'lucide-react'

interface ProjectNavProps {
  projectId: string
}

const navItems = [
  { href: '', label: 'Overview', icon: LayoutDashboard },
  { href: '/stats', label: 'Stats', icon: BarChart2 },
  { href: '/forms', label: 'Forms', icon: FileText },
  { href: '/responses', label: 'Responses', icon: MessageSquare },
  { href: '/analytics', label: 'Analytics', icon: LineChart },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function ProjectNav({ projectId }: ProjectNavProps) {
  const pathname = usePathname()
  const basePath = `/dashboard/projects/${projectId}`

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="flex items-center gap-1 px-4 overflow-x-auto">
        {navItems.map((item) => {
          const href = `${basePath}${item.href}`
          const isActive = item.href === '' 
            ? pathname === basePath
            : pathname.startsWith(href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={href}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
