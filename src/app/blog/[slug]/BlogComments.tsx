'use client'

import { useState } from 'react'
import { Send, User, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    displayName: string | null
    name: string | null
    avatarUrl: string | null
  }
}

interface BlogCommentsProps {
  slug: string
  initialComments: Comment[]
}

export default function BlogComments({ slug, initialComments }: BlogCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Check if user is logged in
  useState(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user?.id) {
          setCurrentUserId(data.user.id)
        }
      })
      .catch(() => {})
  })

  const handleSubmit = async () => {
    if (!newComment.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/blog/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to post comment')
        return
      }

      setComments([...comments, data.comment])
      setNewComment('')
    } catch (err) {
      setError('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/blog/${slug}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId })
      })

      if (res.ok) {
        setComments(comments.filter(c => c.id !== commentId))
      }
    } catch (err) {
      console.error('Failed to delete comment:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-slate-500 text-center py-8">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 rounded-xl bg-[#0d0d15] border border-[#1a1a2e]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {comment.author.avatarUrl ? (
                    <img 
                      src={comment.author.avatarUrl} 
                      alt="" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#2a2a3e] flex items-center justify-center">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">
                      {comment.author.displayName || comment.author.name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(comment.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {currentUserId === comment.author.id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-slate-300 mt-3 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      <div className="p-4 rounded-xl bg-[#0d0d15] border border-[#1a1a2e]">
        {currentUserId ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="rounded-xl bg-[#1a1a2e] border-[#2a2a3e] min-h-[100px]"
            />
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={submitting || !newComment.trim()}
                className="rounded-xl bg-purple-600 hover:bg-purple-500"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-slate-400 mb-3">Log in to leave a comment</p>
            <a 
              href="/login" 
              className="inline-block px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
              Log In
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
