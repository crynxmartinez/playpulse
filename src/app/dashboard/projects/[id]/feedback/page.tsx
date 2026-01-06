'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ChevronUp, 
  ChevronDown, 
  MessageSquare, 
  Plus,
  Bug,
  Lightbulb,
  Sparkles,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { cn } from '@/lib/utils'

interface FeedbackThread {
  id: string
  title: string
  description: string | null
  type: 'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'OTHER'
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'DECLINED'
  isEdited: boolean
  createdAt: string
  author: {
    id: string
    displayName: string | null
    username: string | null
    avatarUrl: string | null
  }
  score: number
  upvotes: number
  downvotes: number
  userVote: number
  commentCount: number
  isAuthor: boolean
  isOwner: boolean
}

const TYPE_CONFIG = {
  FEATURE: { label: 'Feature', icon: Lightbulb, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  BUG: { label: 'Bug', icon: Bug, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  IMPROVEMENT: { label: 'Improvement', icon: Sparkles, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  OTHER: { label: 'Other', icon: HelpCircle, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
}

const STATUS_CONFIG = {
  OPEN: { label: 'Open', icon: Clock, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  IN_PROGRESS: { label: 'In Progress', icon: Loader2, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  COMPLETED: { label: 'Completed', icon: CheckCircle2, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  DECLINED: { label: 'Declined', icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

export default function FeedbackPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [threads, setThreads] = useState<FeedbackThread[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('votes')
  
  // New thread dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newType, setNewType] = useState<string>('FEATURE')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchThreads()
  }, [projectId, filterType, filterStatus, sortBy])

  const fetchThreads = async () => {
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') params.set('type', filterType)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      params.set('sort', sortBy)

      const res = await fetch(`/api/projects/${projectId}/feedback?${params}`)
      if (res.ok) {
        const data = await res.json()
        setThreads(data.threads || [])
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (threadId: string, value: number) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/feedback/${threadId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      })

      if (res.ok) {
        const data = await res.json()
        setThreads(prev => prev.map(t => 
          t.id === threadId 
            ? { ...t, score: data.score, upvotes: data.upvotes, downvotes: data.downvotes, userVote: data.userVote }
            : t
        ))
      }
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  const handleCreateThread = async () => {
    if (!newTitle.trim()) return

    setCreating(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          type: newType
        })
      })

      if (res.ok) {
        const data = await res.json()
        setThreads(prev => [data.thread, ...prev])
        setIsDialogOpen(false)
        setNewTitle('')
        setNewDescription('')
        setNewType('FEATURE')
      }
    } catch (error) {
      console.error('Failed to create thread:', error)
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Feedback</h1>
          <p className="text-sm text-slate-400">Feature requests, bug reports, and suggestions</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-2xl">
              <Plus className="h-4 w-4" />
              New Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-[#0d0d15] border-[#2a2a3e]">
            <DialogHeader>
              <DialogTitle className="text-white">Submit Feedback</DialogTitle>
              <DialogDescription>
                Share your ideas, report bugs, or suggest improvements.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Title</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Brief summary of your feedback"
                  className="rounded-xl bg-[#1a1a2e] border-[#2a2a3e]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Type</label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="rounded-xl bg-[#1a1a2e] border-[#2a2a3e]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-[#2a2a3e]">
                    <SelectItem value="FEATURE">🌟 Feature Request</SelectItem>
                    <SelectItem value="BUG">🐛 Bug Report</SelectItem>
                    <SelectItem value="IMPROVEMENT">✨ Improvement</SelectItem>
                    <SelectItem value="OTHER">❓ Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Description (optional)</label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide more details about your feedback..."
                  className="rounded-xl bg-[#1a1a2e] border-[#2a2a3e] min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button 
                onClick={handleCreateThread} 
                disabled={!newTitle.trim() || creating}
                className="rounded-xl"
              >
                {creating ? 'Submitting...' : 'Submit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-400">Filter:</span>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px] rounded-xl bg-[#1a1a2e] border-[#2a2a3e] text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a2e] border-[#2a2a3e]">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="FEATURE">Feature</SelectItem>
            <SelectItem value="BUG">Bug</SelectItem>
            <SelectItem value="IMPROVEMENT">Improvement</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] rounded-xl bg-[#1a1a2e] border-[#2a2a3e] text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a2e] border-[#2a2a3e]">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="DECLINED">Declined</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[120px] rounded-xl bg-[#1a1a2e] border-[#2a2a3e] text-sm">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a2e] border-[#2a2a3e]">
            <SelectItem value="votes">Top Voted</SelectItem>
            <SelectItem value="new">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Thread List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : threads.length === 0 ? (
        <Card className="rounded-3xl bg-[#0d0d15] border-[#2a2a3e]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="h-12 w-12 text-slate-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No feedback yet</h3>
            <p className="text-sm text-slate-400 text-center mb-4">
              Be the first to share your ideas or report issues!
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" />
              Submit Feedback
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => {
            const typeConfig = TYPE_CONFIG[thread.type]
            const statusConfig = STATUS_CONFIG[thread.status]
            const TypeIcon = typeConfig.icon
            const StatusIcon = statusConfig.icon

            return (
              <Card 
                key={thread.id} 
                className="rounded-2xl bg-[#0d0d15] border-[#2a2a3e] hover:border-[#3a3a4e] transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard/projects/${projectId}/feedback/${thread.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Vote buttons */}
                    <div 
                      className="flex flex-col items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleVote(thread.id, 1)}
                        className={cn(
                          "p-1 rounded-lg transition-colors",
                          thread.userVote === 1 
                            ? "text-purple-400 bg-purple-500/20" 
                            : "text-slate-500 hover:text-purple-400 hover:bg-purple-500/10"
                        )}
                      >
                        <ChevronUp className="h-5 w-5" />
                      </button>
                      <span className={cn(
                        "text-sm font-bold",
                        thread.score > 0 ? "text-purple-400" : thread.score < 0 ? "text-red-400" : "text-slate-400"
                      )}>
                        {thread.score}
                      </span>
                      <button
                        onClick={() => handleVote(thread.id, -1)}
                        className={cn(
                          "p-1 rounded-lg transition-colors",
                          thread.userVote === -1 
                            ? "text-red-400 bg-red-500/20" 
                            : "text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                        )}
                      >
                        <ChevronDown className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-semibold text-white line-clamp-1">
                          {thread.title}
                          {thread.isEdited && (
                            <span className="text-xs text-slate-500 ml-2">(edited)</span>
                          )}
                        </h3>
                      </div>
                      
                      {thread.description && (
                        <p className="text-sm text-slate-400 line-clamp-2 mt-1">
                          {thread.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge variant="outline" className={cn("rounded-lg text-xs", typeConfig.color)}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeConfig.label}
                        </Badge>
                        <Badge variant="outline" className={cn("rounded-lg text-xs", statusConfig.color)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MessageSquare className="h-3 w-3" />
                          {thread.commentCount}
                        </div>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-500">
                          {thread.author.displayName || thread.author.username || 'Anonymous'}
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-500">{formatDate(thread.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
