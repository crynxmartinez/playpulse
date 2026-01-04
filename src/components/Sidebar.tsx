'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  LogOut,
  Plus,
  Gamepad2,
  FolderOpen,
  LayoutDashboard
} from 'lucide-react'

interface Game {
  id: string
  name: string
  description: string | null
}

interface SidebarProps {
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newGameName, setNewGameName] = useState('')
  const [loading, setLoading] = useState(true)

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

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGameName.trim()) return

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGameName }),
      })
      const data = await res.json()
      if (data.project) {
        setGames([data.project, ...games])
        setNewGameName('')
        setIsCreating(false)
        router.push(`/dashboard/projects/${data.project.id}`)
      }
    } catch (error) {
      console.error('Failed to create game:', error)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <Link href="/dashboard">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            PlayPulse
          </h1>
        </Link>
      </div>

      {/* Dashboard Link */}
      <div className="p-4 border-b border-slate-700">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
            pathname === '/dashboard'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
              : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="font-medium text-sm">Dashboard</span>
        </Link>
      </div>

      {/* Games Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Games</span>
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreateGame} className="mb-3">
              <input
                type="text"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                placeholder="Game name..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  className="flex-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setNewGameName('') }}
                  className="px-3 py-1.5 text-slate-400 text-sm hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Games List */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-8 px-4">
              <FolderOpen className="mx-auto text-slate-500 mb-2" size={32} />
              <p className="text-sm text-slate-400">No games yet</p>
              <button
                onClick={() => setIsCreating(true)}
                className="mt-2 text-sm text-purple-400 hover:text-purple-300"
              >
                Create your first game
              </button>
            </div>
          ) : (
            <ul className="space-y-1 ml-3">
              {games.map((game) => {
                const isActive = pathname.startsWith(`/dashboard/projects/${game.id}`)
                
                return (
                  <li key={game.id}>
                    <Link
                      href={`/dashboard/projects/${game.id}`}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-purple-600/20 text-purple-400 border-l-2 border-purple-500'
                          : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      <Gamepad2 size={16} />
                      <span className="font-medium text-sm truncate">{game.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </nav>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user.name || 'User'}
            </p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 text-slate-300 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all duration-200"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  )
}
