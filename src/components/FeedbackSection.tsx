'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, ChevronDown, ChevronUp, User, MoreHorizontal } from 'lucide-react'

interface FeedbackThread {
  id: string
  title: string
  description: string | null
  type: string
  status: string
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

interface FeedbackComment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    displayName: string | null
    username: string | null
    avatarUrl: string | null
  }
  isAuthor: boolean
}

interface FeedbackSectionProps {
  projectId: string
  isOwner?: boolean
}

export function FeedbackSection({ projectId, isOwner = false }: FeedbackSectionProps) {
  const [threads, setThreads] = useState<FeedbackThread[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedThread, setExpandedThread] = useState<string | null>(null)
  const [threadComments, setThreadComments] = useState<Record<string, FeedbackComment[]>>({})
  const [replyText, setReplyText] = useState<Record<string, string>>({})

  // Fetch threads
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/feedback`)
        if (res.ok) {
          const data = await res.json()
          setThreads(data.threads || [])
        }
      } catch (error) {
        console.error('Error fetching feedback:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchThreads()
  }, [projectId])

  // Fetch comments for a thread
  const fetchComments = async (threadId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/feedback/${threadId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setThreadComments(prev => ({ ...prev, [threadId]: data.comments || [] }))
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  // Toggle thread expansion
  const toggleThread = (threadId: string) => {
    if (expandedThread === threadId) {
      setExpandedThread(null)
    } else {
      setExpandedThread(threadId)
      if (!threadComments[threadId]) {
        fetchComments(threadId)
      }
    }
  }

  // Submit new thread/comment
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newComment.trim(),
          type: 'OTHER'
        })
      })
      if (res.ok) {
        const data = await res.json()
        setThreads(prev => [data.thread, ...prev])
        setNewComment('')
      } else if (res.status === 401) {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit reply to thread
  const handleSubmitReply = async (threadId: string) => {
    const text = replyText[threadId]?.trim()
    if (!text) return
    
    try {
      const res = await fetch(`/api/projects/${projectId}/feedback/${threadId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      })
      if (res.ok) {
        const data = await res.json()
        setThreadComments(prev => ({
          ...prev,
          [threadId]: [...(prev[threadId] || []), data.comment]
        }))
        setReplyText(prev => ({ ...prev, [threadId]: '' }))
        // Update comment count
        setThreads(prev => prev.map(t => 
          t.id === threadId ? { ...t, commentCount: t.commentCount + 1 } : t
        ))
      } else if (res.status === 401) {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error submitting reply:', error)
    }
  }

  // Vote on thread
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
          t.id === threadId ? { 
            ...t, 
            score: data.score, 
            upvotes: data.upvotes, 
            downvotes: data.downvotes,
            userVote: data.userVote 
          } : t
        ))
      } else if (res.status === 401) {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getAuthorName = (author: FeedbackThread['author']) => {
    return author.displayName || author.username || 'Anonymous'
  }

  if (loading) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading feedback...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* New comment input */}
      <Card className="rounded-3xl">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Share your thoughts, feedback, or suggestions..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] rounded-xl resize-none"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  className="rounded-xl gap-2"
                >
                  <Send className="h-4 w-4" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Threads list */}
      {threads.length === 0 ? (
        <Card className="rounded-3xl">
          <CardContent className="py-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <div className="font-medium">No feedback yet</div>
            <div className="text-sm">Be the first to share your thoughts!</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <Card key={thread.id} className="rounded-2xl">
              <CardContent className="pt-4">
                {/* Thread header */}
                <div className="flex gap-3">
                  {/* Vote buttons */}
                  <div className="flex flex-col items-center gap-1">
                    <button 
                      onClick={() => handleVote(thread.id, thread.userVote === 1 ? 0 : 1)}
                      className={`p-1 rounded hover:bg-muted transition ${thread.userVote === 1 ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      <ChevronUp className="h-5 w-5" />
                    </button>
                    <span className={`text-sm font-semibold ${thread.score > 0 ? 'text-green-500' : thread.score < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {thread.score}
                    </span>
                    <button 
                      onClick={() => handleVote(thread.id, thread.userVote === -1 ? 0 : -1)}
                      className={`p-1 rounded hover:bg-muted transition ${thread.userVote === -1 ? 'text-red-500' : 'text-muted-foreground'}`}
                    >
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Thread content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{thread.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{getAuthorName(thread.author)}</span>
                          <span>•</span>
                          <span>{formatDate(thread.createdAt)}</span>
                          {thread.isAuthor && (
                            <Badge variant="outline" className="text-xs py-0">You</Badge>
                          )}
                          {isOwner && thread.author.id === thread.author.id && (
                            <Badge variant="secondary" className="text-xs py-0">Owner</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {thread.description && (
                      <p className="text-sm text-muted-foreground mt-2">{thread.description}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3">
                      <button 
                        onClick={() => toggleThread(thread.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {thread.commentCount} {thread.commentCount === 1 ? 'reply' : 'replies'}
                      </button>
                    </div>

                    {/* Expanded comments */}
                    {expandedThread === thread.id && (
                      <div className="mt-4 pl-4 border-l-2 border-muted space-y-3">
                        {threadComments[thread.id]?.map((comment) => (
                          <div key={comment.id} className="text-sm">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">{getAuthorName(comment.author)}</span>
                              <span>•</span>
                              <span>{formatDate(comment.createdAt)}</span>
                              {comment.isAuthor && (
                                <Badge variant="outline" className="text-xs py-0">You</Badge>
                              )}
                            </div>
                            <p className="mt-1">{comment.content}</p>
                          </div>
                        ))}

                        {/* Reply input */}
                        <div className="flex gap-2 mt-3">
                          <Input
                            placeholder="Write a reply..."
                            value={replyText[thread.id] || ''}
                            onChange={(e) => setReplyText(prev => ({ ...prev, [thread.id]: e.target.value }))}
                            className="rounded-xl text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmitReply(thread.id)
                              }
                            }}
                          />
                          <Button 
                            size="sm"
                            onClick={() => handleSubmitReply(thread.id)}
                            disabled={!replyText[thread.id]?.trim()}
                            className="rounded-xl"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
