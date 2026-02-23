'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, Pin, Send, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Author {
  id: string
  name: string | null
  username: string | null
  displayName: string | null
  avatarUrl: string | null
}

interface Reply {
  id: string
  body: string
  createdAt: string
  author: Author
}

interface Thread {
  id: string
  title: string
  body: string
  isPinned: boolean
  isLocked: boolean
  createdAt: string
  author: Author
  replies: Reply[]
}

interface ForumThreadViewProps {
  project: {
    id: string
    name: string
    slug: string | null
  }
  thread: Thread
  user?: any
  isOwner: boolean
}

export default function ForumThreadView({ project, thread, user, isOwner }: ForumThreadViewProps) {
  const router = useRouter()
  const [replyBody, setReplyBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const getAuthorName = (author: Author) => {
    return author.displayName || author.name || author.username || 'Anonymous'
  }

  const getInitials = (author: Author) => {
    const name = getAuthorName(author)
    return name.slice(0, 2).toUpperCase()
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyBody.trim() || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/forum/${thread.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody }),
      })

      if (res.ok) {
        setReplyBody('')
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to post reply')
      }
    } catch (error) {
      console.error('Failed to post reply:', error)
      alert('Failed to post reply')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push(`/g/${project.slug || project.id}`)}
          className="mb-6 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {project.name}
        </Button>

        {/* Thread */}
        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            {thread.isPinned && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
                <Pin className="h-3 w-3" />
                Pinned
              </span>
            )}
            {thread.isLocked && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-500/20 text-slate-400">
                <Lock className="h-3 w-3" />
                Locked
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">{thread.title}</h1>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/40 flex items-center justify-center text-sm font-semibold text-white">
              {getInitials(thread.author)}
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                {getAuthorName(thread.author)}
              </div>
              <div className="text-xs text-slate-400">
                {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 whitespace-pre-wrap">{thread.body}</p>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-white">
            {thread.replies.length} {thread.replies.length === 1 ? 'Reply' : 'Replies'}
          </h2>

          {thread.replies.map((reply) => (
            <div key={reply.id} className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/40 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                  {getInitials(reply.author)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-white">
                      {getAuthorName(reply.author)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{reply.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply form */}
        {user ? (
          thread.isLocked ? (
            <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-6 text-center">
              <Lock className="mx-auto h-8 w-8 text-slate-500 mb-2" />
              <p className="text-slate-400 text-sm">This thread is locked. No new replies can be posted.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReply} className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-3">Post a Reply</h3>
              <Textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Write your reply..."
                className="mb-3 min-h-[120px] bg-[#0d0d15] border-[#2a2a3e] text-white"
                disabled={submitting}
              />
              <Button
                type="submit"
                disabled={!replyBody.trim() || submitting}
                className="rounded-xl"
              >
                <Send className="mr-2 h-4 w-4" />
                {submitting ? 'Posting...' : 'Post Reply'}
              </Button>
            </form>
          )
        ) : (
          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-6 text-center">
            <LogIn className="mx-auto h-8 w-8 text-slate-500 mb-2" />
            <p className="text-slate-400 text-sm mb-3">You need to be logged in to reply</p>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
