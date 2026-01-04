'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Gamepad2,
  Compass,
  Camera,
  Settings,
  Lock,
  Link as LinkIcon,
  Globe,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Game {
  id: string
  name: string
  description: string | null
  visibility?: 'PRIVATE' | 'UNLISTED' | 'PUBLIC'
}

interface NewSidebarProps {
  selectedGameId?: string | null
  onSelectGame?: (id: string) => void
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'mygames', label: 'My Games', icon: Gamepad2, href: '/dashboard/games' },
  { id: 'discover', label: 'Discover', icon: Compass, href: '/dashboard/discover' },
  { id: 'snapshots', label: 'Snapshots', icon: Camera, href: '/dashboard/snapshots' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
]

const VISIBILITY_META = {
  PRIVATE: { label: 'Private', icon: Lock },
  UNLISTED: { label: 'Unlisted', icon: LinkIcon },
  PUBLIC: { label: 'Public', icon: Globe },
}

export default function NewSidebar({ selectedGameId: propSelectedGameId, onSelectGame }: NewSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  
  // Extract project ID from URL if on a project page
  const urlProjectId = pathname.match(/\/dashboard\/projects\/([^/]+)/)?.[1] || null
  const selectedGameId = urlProjectId || propSelectedGameId

  useEffect(() => {
    fetchGames()
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
  
  const handleSelectGame = (gameId: string) => {
    if (onSelectGame) {
      onSelectGame(gameId)
    }
    // Navigate to the selected game's project page
    router.push(`/dashboard/projects/${gameId}`)
  }

  const getActiveNav = () => {
    if (pathname === '/dashboard') return 'dashboard'
    if (pathname.startsWith('/dashboard/games') || pathname.startsWith('/dashboard/projects')) return 'mygames'
    if (pathname.startsWith('/dashboard/discover')) return 'discover'
    if (pathname.startsWith('/dashboard/snapshots')) return 'snapshots'
    if (pathname.startsWith('/dashboard/settings')) return 'settings'
    return 'dashboard'
  }

  const activeNav = getActiveNav()

  return (
    <div className="space-y-2">
      {/* Navigation Card */}
      <Card className="rounded-3xl">
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
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm transition",
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "" : "opacity-80")} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Game Card */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Selected Game</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : games.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-2">
              No games yet
            </div>
          ) : (
            <>
              <select
                value={selectedGameId || ''}
                onChange={(e) => handleSelectGame(e.target.value)}
                className="w-full rounded-2xl border bg-background px-3 py-2 text-sm"
              >
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>

              {(() => {
                const selectedGame = games.find(g => g.id === selectedGameId)
                const visibility = selectedGame?.visibility || 'PRIVATE'
                const meta = VISIBILITY_META[visibility]
                const Icon = meta.icon
                return (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full inline-flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </Badge>
                  </div>
                )
              })()}

              {selectedGameId && (
                <Button variant="outline" className="w-full rounded-2xl" asChild>
                  <Link href={`/dashboard/projects/${selectedGameId}`}>
                    Open Game Page
                  </Link>
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
