'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Gamepad2,
  Compass,
  Settings,
  Lock,
  Link as LinkIcon,
  Globe,
  ChevronDown,
  Check,
  User,
  Trophy,
  Users,
  BarChart3,
  Shield,
  MessageSquare,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Game, VISIBILITY_CONFIG } from '@/types'

interface NewSidebarProps {
  selectedGameId?: string | null
  onSelectGame?: (id: string) => void
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'profile', label: 'Profile', icon: User, href: '/dashboard/profile' },
  { id: 'mygames', label: 'My Games', icon: Gamepad2, href: '/dashboard/games' },
  { id: 'mytests', label: 'My Tests', icon: Trophy, href: '/dashboard/my-tests' },
  { id: 'discover', label: 'Discover', icon: Compass, href: '/dashboard/discover' },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, href: '/dashboard/feedback' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
]

const ADMIN_NAV_ITEMS = [
  { id: 'admin-users', label: 'Users', icon: Users, href: '/dashboard/admin/users' },
  { id: 'admin-games', label: 'All Games', icon: Gamepad2, href: '/dashboard/admin/games' },
  { id: 'admin-reports', label: 'Reports', icon: BarChart3, href: '/dashboard/admin/reports' },
]

const VISIBILITY_ICONS = {
  PRIVATE: Lock,
  UNLISTED: LinkIcon,
  PUBLIC: Globe,
}

export default function NewSidebar({ selectedGameId: propSelectedGameId, onSelectGame }: NewSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [isGameSelectorOpen, setIsGameSelectorOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Extract project ID from URL if on a project page
  const urlProjectId = pathname.match(/\/dashboard\/projects\/([^/]+)/)?.[1] || null
  const selectedGameId = urlProjectId || propSelectedGameId

  useEffect(() => {
    fetchGames()
    fetchUserRole()
  }, [])

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (data.projects) {
        setGames(data.projects)
      }
    } catch (error) {
      console.error('Failed to fetch games:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user?.role) {
        setUserRole(data.user.role)
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error)
    }
  }
  
  const handleSelectGame = (gameId: string) => {
    if (onSelectGame) {
      onSelectGame(gameId)
    }
    // Navigate to the selected game's project page
    router.push(`/dashboard/projects/${gameId}`)
  }

  const getActiveNav = () => {
    if (pathname === '/dashboard') return 'dashboard'
    if (pathname.startsWith('/dashboard/profile')) return 'profile'
    if (pathname.startsWith('/dashboard/games') || pathname.startsWith('/dashboard/projects')) return 'mygames'
    if (pathname.startsWith('/dashboard/my-tests')) return 'mytests'
    if (pathname.startsWith('/dashboard/discover')) return 'discover'
    if (pathname.startsWith('/dashboard/feedback')) return 'feedback'
    if (pathname.startsWith('/dashboard/settings')) return 'settings'
    if (pathname.startsWith('/dashboard/admin/users')) return 'admin-users'
    if (pathname.startsWith('/dashboard/admin/games')) return 'admin-games'
    if (pathname.startsWith('/dashboard/admin/reports')) return 'admin-reports'
    return 'dashboard'
  }

  const isAdmin = userRole === 'ADMIN'

  const activeNav = getActiveNav()

  return (
    <div className="space-y-2">
      {/* Navigation Card */}
      <Card className="rounded-3xl bg-[#0d0d15] border-[#1a1a2e]">
        <CardContent className="p-3">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeNav === item.id
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#1a1a2e] text-white"
                      : "text-slate-400 hover:bg-[#1a1a2e]/50 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Admin Section - Only visible to admins */}
      {isAdmin && (
        <Card className="rounded-3xl bg-[#0d0d15] border-[#1a1a2e]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-3 w-3" />
              Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-1">
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = activeNav === item.id
                
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                        : "text-slate-400 hover:bg-[#1a1a2e]/50 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Game Card */}
      <Card className="rounded-3xl bg-[#0d0d15] border-[#1a1a2e]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">Selected Game</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : games.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-2">
              No games yet
            </div>
          ) : (
            <div className="relative">
              <Button 
                variant="outline" 
                className="w-full justify-between rounded-2xl bg-[#1a1a2e] border-[#2a2a3e] text-white hover:bg-[#2a2a3e]" 
                onClick={() => setIsGameSelectorOpen(!isGameSelectorOpen)}
              >
                <span>{games.find(g => g.id === selectedGameId)?.name || 'Select a game'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isGameSelectorOpen ? 'rotate-180' : ''}`} />
              </Button>
              {isGameSelectorOpen && (
                <Card className="absolute z-10 mt-2 w-full rounded-2xl border border-[#2a2a3e] bg-[#0d0d15] shadow-lg">
                  <CardContent className="p-2">
                    {games.map((game) => {
                      const isSelected = game.id === selectedGameId
                      const visibility = game.visibility || 'PRIVATE'
                      const config = VISIBILITY_CONFIG[visibility]
                      const Icon = VISIBILITY_ICONS[visibility]
                      return (
                        <div
                          key={game.id}
                          onClick={() => {
                            handleSelectGame(game.id)
                            setIsGameSelectorOpen(false)
                          }}
                          className="flex cursor-pointer items-center justify-between rounded-xl p-2 text-sm text-white hover:bg-[#1a1a2e]"
                        >
                          <div className="flex flex-col">
                            <span>{game.name}</span>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Icon className="h-3 w-3" />
                              {config.label}
                            </div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-purple-400" />}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
