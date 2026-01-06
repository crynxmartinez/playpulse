'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronUp, 
  ChevronDown, 
  ArrowLeft,
  MessageSquare, 
  Send,
  Bug,
  Lightbulb,
  Sparkles,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Edit2,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface Comment {
  id: string
  content: string
  isEdited: boolean
  createdAt: string
  updatedAt: string
  author: {
    id: string
    displayName: string | null
    username: string | null
    avatarUrl: string | null
  }
  isAuthor: boolean
  canDelete: boolean
}

interface FeedbackThread {
  id: string
  title: string
  description: string | null
  type: 'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'OTHER'
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'DECLINED'
  isEdited: boolean
  createdAt: string
  updatedAt: string
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
  comments: Comment[]
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

export default function FeedbackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const threadId = params.threadId as string

  const [thread, setThread] = useState<FeedbackThread | null>(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null)

  useEffect(() => {
    fetchThread()
  }, [projectId, threadId])

  const fetchThread = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/feedback/${threadId}`)
      if (res.ok) {
        const data = await res.json()
        setThread(data.thread)
      } else if (res.status === 404) {
        router.push(`/dashboard/projects/${projectId}/feedback`)
      }
    } catch (error) {
      console.error('Failed to fetch thread:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (value: number) => {
    if (!thread) return

    try {
      const res = await fetch(`/api/projects/${projectId}/feedback/${threadId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      })

      if (res.ok) {
        const data = await res.json()
        setThread(prev => prev ? {
          ...prev,
          score: data.score,
          upvotes: data.upvotes,
          downvotes: data.downvotes,
          userVote: data.userVote
        } : null)
      }
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!thread) return

    try {
      const res = await fetch(`/api/projects/${projectId}/feedback/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        setThread(prev => prev ? { ...prev, status: status as FeedbackThread['status'] } : null)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/feedback/${threadId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })

      if (res.ok) {
        const data = await res.json()
        setThread(prev => prev ? {
          ...prev,
          comments: [...prev.comments, data.comment],
          commentCount: prev.commentCount + 1
        } : null)
        setNewComment('')
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/feedback/${threadId}/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setThread(prev => prev ? {
          ...prev,
          comments: prev.comments.filter(c => c.id !== commentId),
          commentCount: prev.commentCount - 1
        } : null)
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
    setDeleteCommentId(null)
  }

  const handleDeleteThread = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/feedback/${threadId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        router.push(`/dashboard/projects/${projectId}/feedback`)
      }
    } catch (error) {
      console.error('Failed to delete thread:', error)
    }
    setDeleteDialogOpen(false)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Thread not found</p>
        <Link href={`/dashboard/projects/${projectId}/feedback`}>
          <Button variant="outline" className="mt-4 rounded-xl">
            Back to Feedback
          </Button>
        </Link>
      </div>
    )
  }

  const typeConfig = TYPE_CONFIG[thread.type]
  const statusConfig = STATUS_CONFIG[thread.status]
  const TypeIcon = typeConfig.icon
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link 
        href={`/dashboard/projects/${projectId}/feedback`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Feedback
      </Link>

      {/* Thread Card */}
      <Card className="rounded-3xl bg-[#0d0d15] border-[#2a2a3e]">
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Vote buttons */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <button
                onClick={() => handleVote(1)}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  thread.userVote === 1 
                    ? "text-purple-400 bg-purple-500/20" 
                    : "text-slate-500 hover:text-purple-400 hover:bg-purple-500/10"
                )}
              >
                <ChevronUp className="h-6 w-6" />
              </button>
              <span className={cn(
                "text-lg font-bold",
                thread.score > 0 ? "text-purple-400" : thread.score < 0 ? "text-red-400" : "text-slate-400"
              )}>
                {thread.score}
              </span>
              <button
                onClick={() => handleVote(-1)}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  thread.userVote === -1 
                    ? "text-red-400 bg-red-500/20" 
                    : "text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                )}
              >
                <ChevronDown className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-xl font-bold text-white">
                  {thread.title}
                  {thread.isEdited && (
                    <span className="text-xs text-slate-500 ml-2 font-normal">(edited)</span>
                  )}
                </h1>
                
                {(thread.isAuthor || thread.isOwner) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-[#2a2a3e]">
                      {thread.isAuthor && (
                        <DropdownMenuItem className="text-slate-300">
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-red-400"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="outline" className={cn("rounded-lg", typeConfig.color)}>
                  <TypeIcon className="h-3 w-3 mr-1" />
                  {typeConfig.label}
                </Badge>
                
                {thread.isOwner ? (
                  <Select value={thread.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className={cn("w-auto h-7 rounded-lg border text-xs gap-1", statusConfig.color)}>
                      <StatusIcon className="h-3 w-3" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-[#2a2a3e]">
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="DECLINED">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={cn("rounded-lg", statusConfig.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                )}
              </div>

              {thread.description && (
                <p className="text-slate-300 mt-4 whitespace-pre-wrap">
                  {thread.description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#2a2a3e]">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={thread.author.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs bg-purple-600">
                    {getInitials(thread.author.displayName || thread.author.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-slate-400">
                  {thread.author.displayName || thread.author.username || 'Anonymous'}
                </span>
                <span className="text-sm text-slate-500">•</span>
                <span className="text-sm text-slate-500">{formatDate(thread.createdAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card className="rounded-3xl bg-[#0d0d15] border-[#2a2a3e]">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments ({thread.commentCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add comment */}
          <div className="flex gap-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="rounded-xl bg-[#1a1a2e] border-[#2a2a3e] min-h-[80px] resize-none"
            />
            <Button 
              onClick={handleAddComment}
              disabled={!newComment.trim() || submitting}
              className="rounded-xl shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Comments list */}
          {thread.comments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4 pt-4 border-t border-[#2a2a3e]">
              {thread.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={comment.author.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs bg-purple-600">
                      {getInitials(comment.author.displayName || comment.author.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {comment.author.displayName || comment.author.username || 'Anonymous'}
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(comment.createdAt)}</span>
                      {comment.isEdited && (
                        <span className="text-xs text-slate-500">(edited)</span>
                      )}
                      {comment.canDelete && (
                        <button
                          onClick={() => setDeleteCommentId(comment.id)}
                          className="ml-auto text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Thread Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0d0d15] border-[#2a2a3e]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this feedback? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteThread}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Comment Dialog */}
      <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent className="bg-[#0d0d15] border-[#2a2a3e]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteCommentId && handleDeleteComment(deleteCommentId)}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
