'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, Plus, Copy, ExternalLink, Trash2, 
  Eye, EyeOff, Link2, Settings, BarChart3 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Board {
  id: string
  name: string
  shareToken: string
  visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC'
  columns: Array<{ statId: string; label?: string; showDelta?: boolean }>
  showTrend: boolean
  showTable: boolean
  createdAt: string
}

interface Stat {
  id: string
  name: string
  category: string | null
}

export default function BoardsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [boards, setBoards] = useState<Board[]>([])
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [newBoardVisibility, setNewBoardVisibility] = useState<'PRIVATE' | 'UNLISTED' | 'PUBLIC'>('UNLISTED')
  const [selectedStats, setSelectedStats] = useState<string[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchBoards()
    fetchStats()
  }, [projectId])

  const fetchBoards = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/boards`)
      const data = await res.json()
      if (res.ok) {
        setBoards(data.boards)
      }
    } catch (error) {
      console.error('Failed to fetch boards:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/stats`)
      const data = await res.json()
      if (res.ok) {
        setStats(data.stats || [])
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const createBoard = async () => {
    try {
      const columns = selectedStats.map(statId => ({
        statId,
        showDelta: true
      }))

      const res = await fetch(`/api/projects/${projectId}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBoardName || 'Progress Board',
          visibility: newBoardVisibility,
          columns,
        })
      })

      if (res.ok) {
        const data = await res.json()
        setBoards([data.board, ...boards])
        setCreateOpen(false)
        setNewBoardName('')
        setSelectedStats([])
      }
    } catch (error) {
      console.error('Failed to create board:', error)
    }
  }

  const deleteBoard = async (boardId: string) => {
    if (!confirm('Are you sure you want to delete this board?')) return

    try {
      const res = await fetch(`/api/projects/${projectId}/boards/${boardId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setBoards(boards.filter(b => b.id !== boardId))
      }
    } catch (error) {
      console.error('Failed to delete board:', error)
    }
  }

  const copyShareLink = (board: Board) => {
    const url = `${window.location.origin}/board/${board.shareToken}`
    navigator.clipboard.writeText(url)
    setCopiedId(board.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC': return <Eye className="h-3 w-3" />
      case 'UNLISTED': return <Link2 className="h-3 w-3" />
      default: return <EyeOff className="h-3 w-3" />
    }
  }

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC': return 'bg-green-500/20 text-green-400'
      case 'UNLISTED': return 'bg-yellow-500/20 text-yellow-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-bold text-white">Progress Boards</div>
          <div className="text-sm text-muted-foreground">
            Create shareable dashboards to track your game's progress
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl">
              <Plus className="mr-2 h-4 w-4" /> New Board
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-[#0d0d15] border-[#2a2a3e]">
            <DialogHeader>
              <DialogTitle className="text-white">Create Progress Board</DialogTitle>
              <DialogDescription>
                Create a shareable dashboard to show your game's progress to investors, press, or your community.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Board Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Public Progress, Investor Dashboard"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="bg-[#1a1a2e] border-[#2a2a3e]"
                />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={newBoardVisibility} onValueChange={(v) => setNewBoardVisibility(v as typeof newBoardVisibility)}>
                  <SelectTrigger className="bg-[#1a1a2e] border-[#2a2a3e]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-[#2a2a3e]">
                    <SelectItem value="PRIVATE">Private - Only you can see</SelectItem>
                    <SelectItem value="UNLISTED">Unlisted - Anyone with link</SelectItem>
                    <SelectItem value="PUBLIC">Public - Listed publicly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stats to Display</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-[#1a1a2e] rounded-xl border border-[#2a2a3e]">
                  {stats.length === 0 ? (
                    <p className="col-span-2 text-sm text-muted-foreground text-center py-4">
                      No stats created yet. Create stats first.
                    </p>
                  ) : (
                    stats.map(stat => (
                      <label
                        key={stat.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${
                          selectedStats.includes(stat.id)
                            ? 'bg-primary/20 border border-primary/50'
                            : 'bg-[#0d0d15] border border-transparent hover:border-[#2a2a3e]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStats.includes(stat.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStats([...selectedStats, stat.id])
                            } else {
                              setSelectedStats(selectedStats.filter(id => id !== stat.id))
                            }
                          }}
                          className="sr-only"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{stat.name}</div>
                          {stat.category && (
                            <div className="text-xs text-muted-foreground">{stat.category}</div>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedStats.length} stats selected
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-[#2a2a3e]">
                Cancel
              </Button>
              <Button onClick={createBoard} disabled={selectedStats.length === 0}>
                Create Board
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Boards List */}
      {boards.length === 0 ? (
        <Card className="rounded-3xl border-[#1a1a2e] bg-[#0d0d15]/50">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <LayoutDashboard className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2 text-white">No Progress Boards Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm mb-4">
              Create a progress board to share your game's analytics with investors, press, or your community.
            </p>
            <Button className="rounded-2xl" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Your First Board
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map(board => (
            <Card key={board.id} className="rounded-3xl border-[#1a1a2e] bg-[#0d0d15]/50 hover:border-primary/30 transition">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-white">{board.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {board.columns.length} stats tracked
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`rounded-full text-xs border-0 ${getVisibilityColor(board.visibility)}`}>
                    {getVisibilityIcon(board.visibility)}
                    <span className="ml-1">{board.visibility}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Share Link */}
                {board.visibility !== 'PRIVATE' && (
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/board/${board.shareToken}`}
                      className="text-xs bg-[#1a1a2e] border-[#2a2a3e] h-8"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 border-[#2a2a3e]"
                      onClick={() => copyShareLink(board)}
                    >
                      {copiedId === board.id ? (
                        <span className="text-green-400 text-xs">Copied!</span>
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-xl border-[#2a2a3e]"
                    asChild
                  >
                    <Link href={`/board/${board.shareToken}`} target="_blank">
                      <ExternalLink className="h-3 w-3 mr-1" /> Preview
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-[#2a2a3e]"
                    asChild
                  >
                    <Link href={`/dashboard/projects/${projectId}/boards/${board.id}`}>
                      <Settings className="h-3 w-3" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => deleteBoard(board.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
