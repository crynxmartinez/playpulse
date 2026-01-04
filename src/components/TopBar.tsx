'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TopBarProps {
  user: {
    id: string
    email: string
    name: string | null
  }
  viewMode: 'workspace' | 'public'
  onViewModeChange: (mode: 'workspace' | 'public') => void
}

export default function TopBar({ user, viewMode, onViewModeChange }: TopBarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/discover?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border bg-background">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">PlayPulse</div>
            <div className="text-xs text-muted-foreground">devlogs • playtests • proof</div>
          </div>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="mx-3 hidden flex-1 items-center md:flex">
          <Input
            placeholder="Search games, tags, studios…"
            className="rounded-2xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* View Toggle + Actions */}
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as 'workspace' | 'public')}>
            <TabsList className="rounded-2xl">
              <TabsTrigger value="workspace" className="rounded-2xl">Workspace</TabsTrigger>
              <TabsTrigger value="public" className="rounded-2xl">Public View</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button className="rounded-2xl" variant="default" asChild>
            <Link href="/dashboard/games/new">
              <Plus className="mr-2 h-4 w-4" /> Create
            </Link>
          </Button>

          <Button variant="ghost" className="rounded-2xl" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User Avatar */}
          <div className="h-9 w-9 rounded-2xl border bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-sm font-semibold">
            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  )
}
