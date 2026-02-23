'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Pin, Lock, Trash2, ExternalLink, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'

interface ForumThread {
  id: string
  title: string
  body: string
  isPinned: boolean
  isLocked: boolean
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string | null
    username: string | null
    displayName: string | null
  }
  _count: {
    replies: number
  }
}

export default function ForumManagementPage() {
  const params = useParams()
  const projectId = params.id as string

  const [threads, setThreads] = useState<ForumThread[]>([])
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      const [threadsRes, projectRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/forum`),
        fetch(`/api/projects/${projectId}`),
      ])
      const threadsData = await threadsRes.json()
      const projectData = await projectRes.json()
      setThreads(threadsData.threads || [])
      setProject(projectData.project)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePin = async (threadId: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/forum/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !currentState }),
      })
      if (res.ok) {
        const data = await res.json()
        setThreads(threads.map(t => t.id === threadId ? data.thread : t))
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  const handleToggleLock = async (threadId: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/forum/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked: !currentState }),
      })
      if (res.ok) {
        const data = await res.json()
        setThreads(threads.map(t => t.id === threadId ? data.thread : t))
      }
    } catch (error) {
      console.error('Failed to toggle lock:', error)
    }
  }

  const handleDelete = async (threadId: string) => {
    if (!confirm('Are you sure you want to delete this thread? This cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/forum/${threadId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setThreads(threads.filter(t => t.id !== threadId))
      }
    } catch (error) {
      console.error('Failed to delete thread:', error)
    }
  }

  const getAuthorName = (author: ForumThread['author']) => {
    return author.displayName || author.name || author.username || 'Anonymous'
  }

  const totalReplies = threads.reduce((sum, t) => sum + t._count.replies, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Forum Management</h1>
        <p className="text-sm text-slate-400">
          Manage discussion threads for your game
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-[#2a2a3e] bg-[#1a1a2e]">
          <CardContent className="pt-6">
            <div className="text-sm text-slate-400 mb-1">Total Threads</div>
            <div className="text-3xl font-bold text-white">{threads.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-[#2a2a3e] bg-[#1a1a2e]">
          <CardContent className="pt-6">
            <div className="text-sm text-slate-400 mb-1">Total Replies</div>
            <div className="text-3xl font-bold text-white">{totalReplies}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-[#2a2a3e] bg-[#1a1a2e]">
          <CardContent className="pt-6">
            <div className="text-sm text-slate-400 mb-1">Pinned</div>
            <div className="text-3xl font-bold text-white">
              {threads.filter(t => t.isPinned).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Thread List */}
      {threads.length === 0 ? (
        <div className="bg-[#1a1a2e] rounded-2xl border border-[#2a2a3e] p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-slate-500 mb-3" />
          <h3 className="text-lg font-medium text-white mb-2">No forum threads yet</h3>
          <p className="text-slate-400">
            Threads will appear here once users start discussions on your game page.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className="bg-[#1a1a2e] rounded-2xl border border-[#2a2a3e] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {thread.isPinned && (
                      <Pin className="h-4 w-4 text-purple-400 flex-shrink-0" />
                    )}
                    {thread.isLocked && (
                      <Lock className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    )}
                    <h3 className="font-semibold text-white truncate">
                      {thread.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <span>by {getAuthorName(thread.author)}</span>
                    <span>•</span>
                    <span>{thread._count.replies} {thread._count.replies === 1 ? 'reply' : 'replies'}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-2">{thread.body}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`/g/${project?.slug || projectId}/forum/${thread.id}`, '_blank')}
                    className="rounded-xl"
                    title="View thread"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePin(thread.id, thread.isPinned)}
                    className={`rounded-xl ${thread.isPinned ? 'text-purple-400' : 'text-slate-400'}`}
                    title={thread.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleLock(thread.id, thread.isLocked)}
                    className={`rounded-xl ${thread.isLocked ? 'text-orange-400' : 'text-slate-400'}`}
                    title={thread.isLocked ? 'Unlock' : 'Lock'}
                  >
                    <Lock className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(thread.id)}
                    className="rounded-xl text-slate-400 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
