'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Plus, Sparkles, Menu, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TopBarProps {
  user: {
    id: string
    email: string
    name: string | null
  }
  onMenuToggle?: () => void
  isSidebarOpen?: boolean
}

export default function TopBar({ user, onMenuToggle, isSidebarOpen }: TopBarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/discover?q=${encodeURIComponent(searchQuery)}`)
      setIsSearchOpen(false)
    }
  }

  return (
    <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left Section - Logo + Hamburger */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden rounded-xl"
            onClick={onMenuToggle}
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
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

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden rounded-xl"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Create Button - Hidden on small mobile */}
          <Button className="rounded-2xl hidden sm:flex" variant="default" asChild>
            <Link href="/dashboard/games/new">
              <Plus className="mr-2 h-4 w-4" /> Create
            </Link>
          </Button>

          {/* Create Button - Icon only on mobile */}
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

      {/* Mobile Search Bar - Expandable */}
      {isSearchOpen && (
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search games, tags, studios…"
              className="rounded-2xl flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <Button type="submit" size="icon" className="rounded-xl">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
