'use client'

import Link from 'next/link'
import { Bell, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ViewToggle } from '@/components/ui/view-toggle'
import PublicGamePage from '@/components/PublicGamePage'
import StarsBackground from '@/components/ui/stars-background'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Project, User } from '@/types'

interface GamePageViewProps {
  project: Project
  user?: User | null
  isOwner?: boolean
}

export default function GamePageView({ project, user, isOwner = false }: GamePageViewProps) {
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
    <div className="min-h-screen bg-[#0a0a0f] relative">
      <StarsBackground starCount={100} />
      {/* TopBar with Workspace/Game Page toggle */}
      <div className="sticky top-0 z-40 border-b border-[#2a2a3e] bg-[#0a0a0f]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a0f]/60">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          {/* Left Section - Logo */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#2a2a3e] bg-[#1a1a2e]">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold leading-none text-white">PlayPulse</div>
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
            <ViewToggle 
              workspaceUrl={workspaceUrl}
              gamePageUrl={gamePageUrl}
              activeView="gamepage"
            />

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
            {user ? (
              <div className="h-9 w-9 rounded-2xl border bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity">
                {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              </div>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="rounded-xl">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Game Page Content - Full width, no sidebar */}
      <main className="p-4 lg:p-6 relative z-10">
        <PublicGamePage project={project} isOwner={isOwner} />
      </main>
    </div>
  )
}
