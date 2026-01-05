'use client'

import Link from 'next/link'
import { Bell, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PublicGamePage from '@/components/PublicGamePage'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface GamePageViewProps {
  project: {
    id: string
    name: string
    slug: string | null
    description: string | null
    visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC'
  }
  user: {
    id: string
    email: string
    name: string | null
  }
}

export default function GamePageView({ project, user }: GamePageViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/discover?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const workspaceUrl = `/dashboard/projects/${project.id}`
  const gamePageUrl = `/game/${project.id}`

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* TopBar with Workspace/Game Page toggle */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          {/* Left Section - Logo */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border bg-background">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold leading-none">PlayPulse</div>
                <div className="text-xs text-muted-foreground">devlogs • playtests • proof</div>
              </div>
            </Link>
          </div>

          {/* Center Section - Search (Desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
            <Input
              placeholder="Search games, tags, studios…"
              className="rounded-2xl w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Right Section - Toggle + Actions */}
          <div className="flex items-center gap-2">
            {/* Workspace / Game Page Toggle */}
            <div className="flex items-center rounded-2xl border bg-muted/50 p-1">
              <Link
                href={workspaceUrl}
                className="px-3 py-1.5 text-xs sm:text-sm sm:px-4 font-medium rounded-xl transition-colors text-muted-foreground hover:text-foreground"
              >
                Workspace
              </Link>
              <Link
                href={gamePageUrl}
                className="px-3 py-1.5 text-xs sm:text-sm sm:px-4 font-medium rounded-xl transition-colors bg-background text-foreground shadow-sm"
              >
                Game Page
              </Link>
            </div>

            {/* Create Button */}
            <Button className="rounded-2xl hidden sm:flex" variant="default" asChild>
              <Link href="/dashboard/games/new">
                <Plus className="mr-2 h-4 w-4" /> Create
              </Link>
            </Button>

            <Button className="rounded-xl sm:hidden" variant="default" size="icon" asChild>
              <Link href="/dashboard/games/new">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>

            <Button variant="ghost" className="rounded-xl" size="icon">
              <Bell className="h-5 w-5" />
            </Button>

            {/* User Avatar */}
            <div className="h-9 w-9 rounded-2xl border bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Game Page Content - Full width, no sidebar */}
      <main className="p-4 lg:p-6">
        <PublicGamePage project={project} />
      </main>
    </div>
  )
}
