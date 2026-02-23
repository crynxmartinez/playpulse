'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Pin, Lock, Plus, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    avatarUrl: string | null
  }
  _count: {
    replies: number
  }
}

interface ForumSectionProps {
  projectId: string
}

export function ForumSection({ projectId }: ForumSectionProps) {
  const router = useRouter()
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetchThreads()
    checkAuth()
  }, [projectId])

  const fetchThreads = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/forum`)
      const data = await res.json()
      setThreads(data.threads || [])
    } catch (error) {
      console.error('Failed to fetch threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (error) {
      // User not logged in
    }
  }

  const getAuthorName = (author: ForumThread['author']) => {
    return author.displayName || author.name || author.username || 'Anonymous'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold tracking-tight">Discussion Forum</div>
          <div className="text-sm text-muted-foreground">
            Join the conversation about this game
          </div>
        </div>
        {user ? (
          <Button
            onClick={() => router.push(`/g/${projectId}/forum/new`)}
            className="rounded-2xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Thread
          </Button>
        ) : (
          <Button
            onClick={() => router.push('/login')}
            variant="outline"
            className="rounded-2xl"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Login to Post
          </Button>
        )}
      </div>

      {threads.length === 0 ? (
        <div className="rounded-xl bg-[#1a1a2e] border border-[#2a2a3e] p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-slate-500 mb-3" />
          <div className="text-white font-medium mb-1">No discussions yet</div>
          <div className="text-sm text-slate-400">
            {user ? 'Be the first to start a conversation!' : 'Login to start the first discussion.'}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => router.push(`/g/${projectId}/forum/${thread.id}`)}
              className="w-full text-left p-4 rounded-xl border border-[#2a2a3e] bg-[#1a1a2e] hover:border-[#3a3a4e] hover:bg-[#1f1f2e] transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {thread.isPinned && (
                      <Pin className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                    )}
                    {thread.isLocked && (
                      <Lock className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                    )}
                    <h3 className="font-semibold text-white truncate">
                      {thread.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>by {getAuthorName(thread.author)}</span>
                    <span>•</span>
                    <span>{thread._count.replies} {thread._count.replies === 1 ? 'reply' : 'replies'}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
