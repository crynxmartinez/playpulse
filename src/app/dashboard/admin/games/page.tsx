'use client'

import { useState, useEffect } from 'react'
import { 
  Gamepad2, 
  Search, 
  Globe,
  Lock,
  Link as LinkIcon,
  User,
  Calendar,
  FileText,
  Users,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface GameData {
  id: string
  name: string
  slug: string | null
  visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC'
  genre: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    name: string | null
    displayName: string | null
  }
  _count: {
    forms: number
    versions: number
    followers: number
  }
}

const VISIBILITY_CONFIG = {
  PRIVATE: { label: 'Private', icon: Lock, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  UNLISTED: { label: 'Unlisted', icon: LinkIcon, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  PUBLIC: { label: 'Public', icon: Globe, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<GameData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchGames()
  }, [])

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/admin/games')
      const data = await res.json()
      if (data.games) {
        setGames(data.games)
      }
    } catch (error) {
      console.error('Failed to fetch games:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateGame = async (gameId: string, visibility: string) => {
    setUpdating(gameId)
    try {
      const res = await fetch('/api/admin/games', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, visibility })
      })
      if (res.ok) {
        fetchGames()
      }
    } catch (error) {
      console.error('Failed to update game:', error)
    } finally {
      setUpdating(null)
    }
  }

  const filteredGames = games.filter(game => 
    game.name.toLowerCase().includes(search.toLowerCase()) ||
    game.user.email.toLowerCase().includes(search.toLowerCase()) ||
    game.user.displayName?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: games.length,
    public: games.filter(g => g.visibility === 'PUBLIC').length,
    private: games.filter(g => g.visibility === 'PRIVATE').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Gamepad2 className="h-7 w-7 text-purple-400" />
          All Games
        </h1>
        <p className="text-slate-400 mt-1">Manage all games on the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Gamepad2 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-slate-400">Total Games</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Globe className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.public}</p>
                <p className="text-xs text-slate-400">Public</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.private}</p>
                <p className="text-xs text-slate-400">Private</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search games by name or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl bg-[#0d0d15] border-[#2a2a3e]"
        />
      </div>

      {/* Games Table */}
      <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a1a2e]">
                  <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Game</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Owner</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Visibility</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Stats</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Created</th>
                  <th className="text-right p-4 text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGames.map((game) => {
                  const visConfig = VISIBILITY_CONFIG[game.visibility]
                  const VisIcon = visConfig.icon
                  return (
                    <tr key={game.id} className="border-b border-[#1a1a2e] hover:bg-[#1a1a2e]/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#2a2a3e] flex items-center justify-center">
                            <Gamepad2 className="h-4 w-4 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{game.name}</p>
                            <p className="text-xs text-slate-400">{game.genre || 'No genre'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm text-white">{game.user.displayName || game.user.name || 'No name'}</p>
                            <p className="text-xs text-slate-400">{game.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={visConfig.color}>
                          <VisIcon className="h-3 w-3 mr-1" />
                          {visConfig.label}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {game._count.forms} forms
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {game._count.followers} followers
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Calendar className="h-4 w-4" />
                          {new Date(game.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {game.slug && (
                            <Link href={`/g/${game.slug}`} target="_blank">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg text-xs border-[#2a2a3e]"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                          <select
                            value={game.visibility}
                            onChange={(e) => updateGame(game.id, e.target.value)}
                            disabled={updating === game.id}
                            className="text-xs bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-2 py-1 text-white"
                          >
                            <option value="PRIVATE">Private</option>
                            <option value="UNLISTED">Unlisted</option>
                            <option value="PUBLIC">Public</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredGames.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No games found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
