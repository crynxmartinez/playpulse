'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Plus, Sparkles, Menu, Search, X, User as UserIcon, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User } from '@/types'

interface TopBarProps {
  user: User
  onMenuToggle?: () => void
  isSidebarOpen?: boolean
}

export default function TopBar({ user, onMenuToggle, isSidebarOpen }: TopBarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const displayName = user.displayName || user.name || user.email.split('@')[0]
  const initials = (user.displayName || user.name || user.email)[0].toUpperCase()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/discover?q=${encodeURIComponent(searchQuery)}`)
      setIsSearchOpen(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="sticky top-0 z-40 border-b border-[#1a1a2e] bg-[#0a0a0f]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a0f]/60">
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

          {/* Logo - goes to landing page */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#2a2a3e] bg-[#1a1a2e]">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold leading-none">PatchPlay</div>
              <div className="text-xs text-muted-foreground">devlogs • playtests • proof</div>
            </div>
          </Link>
        </div>

        {/* Center Section - Search (Desktop) */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
          <Input
            placeholder="Search games, tags, studios…"
            className="rounded-2xl w-full bg-[#1a1a2e] border-[#2a2a3e] text-white placeholder:text-slate-500"
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

          {/* User Avatar + Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="h-9 w-9 rounded-2xl border border-[#2a2a3e] overflow-hidden hover:border-purple-500/50 transition-all focus:outline-none"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500/40 to-indigo-600/40 flex items-center justify-center text-sm font-semibold text-white">
                  {initials}
                </div>
              )}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-11 w-56 rounded-2xl border border-[#2a2a3e] bg-[#0d0d15] shadow-xl shadow-black/50 overflow-hidden z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-[#1a1a2e]">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl border border-[#2a2a3e] overflow-hidden flex-shrink-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500/40 to-indigo-600/40 flex items-center justify-center text-sm font-semibold text-white">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{displayName}</div>
                      <div className="text-xs text-slate-400 truncate">{user.email}</div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-1">
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-[#1a1a2e] hover:text-white transition-colors"
                  >
                    <UserIcon className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-[#1a1a2e] hover:text-white transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </div>

                <div className="p-1 border-t border-[#1a1a2e]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar - Expandable */}
      {isSearchOpen && (
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search games, tags, studios…"
              className="rounded-2xl flex-1 bg-[#1a1a2e] border-[#2a2a3e] text-white placeholder:text-slate-500"
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
