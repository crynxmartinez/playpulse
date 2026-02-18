'use client'

import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Plus,
  ChevronUp,
  Search,
  Filter,
  X,
  Send,
  Pin,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  User
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

interface FeatureRequest {
  id: string
  title: string
  description: string | null
  category: string
  status: string
  isPinned: boolean
  author: {
    id: string
    displayName: string | null
    name: string | null
    avatarUrl: string | null
  }
  voteCount: number
  voterIds: string[]
  commentCount: number
  createdAt: string
}

interface Comment {
  id: string
  content: string
  isOfficial: boolean
  createdAt: string
  author: {
    id: string
    displayName: string | null
    name: string | null
    avatarUrl: string | null
    role: string
  }
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'UI', label: 'UI' },
  { value: 'ANALYTICS', label: 'Analytics' },
  { value: 'FORMS', label: 'Forms' },
  { value: 'DEVLOGS', label: 'Devlogs' },
  { value: 'DISCOVERY', label: 'Discovery' },
  { value: 'PROFILE', label: 'Profile' },
  { value: 'OTHER', label: 'Other' },
]

const STATUSES = [
  { value: 'all', label: 'All Status' },
  { value: 'OPEN', label: 'Open' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DECLINED', label: 'Declined' },
]

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  OPEN: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
  PLANNED: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: CheckCircle },
  IN_PROGRESS: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Loader2 },
  COMPLETED: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  DECLINED: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
}

export default function FeedbackPage() {
  const [features, setFeatures] = useState<FeatureRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('votes')
  
  // New request form
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('OTHER')
  const [submitting, setSubmitting] = useState(false)
  
  // Detail view
  const [selectedFeature, setSelectedFeature] = useState<FeatureRequest | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  useEffect(() => {
    fetchFeatures()
    fetchCurrentUser()
  }, [statusFilter, categoryFilter, sortBy])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user) {
        setCurrentUserId(data.user.id)
        setIsAdmin(data.user.role === 'ADMIN')
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }

  const fetchFeatures = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      params.set('sort', sortBy)
      
      const res = await fetch(`/api/feedback?${params}`)
      const data = await res.json()
      if (data.features) {
        setFeatures(data.features)
      }
    } catch (error) {
      console.error('Failed to fetch features:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!newTitle.trim() || newTitle.length < 5) return
    
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          category: newCategory,
        })
      })
      
      if (res.ok) {
        setNewTitle('')
        setNewDescription('')
        setNewCategory('OTHER')
        setShowNewForm(false)
        fetchFeatures()
      }
    } catch (error) {
      console.error('Failed to submit:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (featureId: string) => {
    try {
      const res = await fetch(`/api/feedback/${featureId}/vote`, {
        method: 'POST'
      })
      if (res.ok) {
        fetchFeatures()
      }
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  const openFeatureDetail = async (feature: FeatureRequest) => {
    setSelectedFeature(feature)
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/feedback/${feature.id}`)
      const data = await res.json()
      if (data.feature?.comments) {
        setComments(data.feature.comments)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleAddComment = async () => {
    if (!selectedFeature || !newComment.trim()) return
    
    try {
      const res = await fetch(`/api/feedback/${selectedFeature.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })
      
      if (res.ok) {
        const data = await res.json()
        setComments([...comments, data.comment])
        setNewComment('')
        // Update comment count in list
        setFeatures(features.map(f => 
          f.id === selectedFeature.id 
            ? { ...f, commentCount: f.commentCount + 1 }
            : f
        ))
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const handleStatusChange = async (featureId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/feedback/${featureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        fetchFeatures()
        if (selectedFeature?.id === featureId) {
          setSelectedFeature({ ...selectedFeature, status: newStatus })
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const filteredFeatures = features.filter(f =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.description?.toLowerCase().includes(search.toLowerCase())
  )

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-purple-400" />
            Feature Requests
          </h1>
          <p className="text-slate-400 mt-1">Vote and suggest features for PatchPlay</p>
        </div>
        <Button
          onClick={() => setShowNewForm(true)}
          className="rounded-xl bg-purple-600 hover:bg-purple-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search features..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl bg-[#0d0d15] border-[#2a2a3e]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#0d0d15] border border-[#2a2a3e] text-white text-sm"
        >
          {STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#0d0d15] border border-[#2a2a3e] text-white text-sm"
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#0d0d15] border border-[#2a2a3e] text-white text-sm"
        >
          <option value="votes">Most Voted</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* Feature List */}
      <div className="space-y-3">
        {filteredFeatures.length === 0 ? (
          <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No feature requests yet</p>
              <p className="text-slate-500 text-sm mt-1">Be the first to suggest a feature!</p>
            </CardContent>
          </Card>
        ) : (
          filteredFeatures.map((feature) => {
            const hasVoted = currentUserId && feature.voterIds.includes(currentUserId)
            const statusConfig = STATUS_CONFIG[feature.status] || STATUS_CONFIG.OPEN
            const StatusIcon = statusConfig.icon
            
            return (
              <Card 
                key={feature.id} 
                className={`rounded-2xl bg-[#0d0d15] border-[#1a1a2e] hover:border-[#2a2a3e] transition-colors cursor-pointer ${feature.isPinned ? 'border-purple-500/30' : ''}`}
                onClick={() => openFeatureDetail(feature)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Vote button */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVote(feature.id)
                        }}
                        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-colors ${
                          hasVoted 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-[#1a1a2e] text-slate-400 hover:bg-[#2a2a3e] hover:text-white'
                        }`}
                      >
                        <ChevronUp className="h-5 w-5" />
                        <span className="text-xs font-bold">{feature.voteCount}</span>
                      </button>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {feature.isPinned && (
                            <Pin className="h-4 w-4 text-purple-400" />
                          )}
                          <h3 className="font-semibold text-white">{feature.title}</h3>
                        </div>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {feature.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      {feature.description && (
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                          {feature.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {feature.author.displayName || feature.author.name || 'Anonymous'}
                        </span>
                        <Badge variant="outline" className="text-xs border-[#2a2a3e] text-slate-400">
                          {feature.category}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {feature.commentCount} comments
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* New Request Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">New Feature Request</CardTitle>
              <button onClick={() => setShowNewForm(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Title *</label>
                <Input
                  placeholder="Short, descriptive title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl bg-[#1a1a2e] border-[#2a2a3e]"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Description</label>
                <Textarea
                  placeholder="Describe the feature in detail..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="rounded-xl bg-[#1a1a2e] border-[#2a2a3e] min-h-[100px]"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1a1a2e] border border-[#2a2a3e] text-white"
                >
                  {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewForm(false)}
                  className="rounded-xl border-[#2a2a3e]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || newTitle.length < 5}
                  className="rounded-xl bg-purple-600 hover:bg-purple-500"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-[#0d0d15] border-[#1a1a2e] flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between border-b border-[#1a1a2e]">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {selectedFeature.isPinned && <Pin className="h-4 w-4 text-purple-400" />}
                  <CardTitle className="text-white">{selectedFeature.title}</CardTitle>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Badge className={STATUS_CONFIG[selectedFeature.status]?.color}>
                    {selectedFeature.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className="border-[#2a2a3e] text-slate-400">
                    {selectedFeature.category}
                  </Badge>
                  <span className="text-slate-500">
                    by {selectedFeature.author.displayName || selectedFeature.author.name}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedFeature(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedFeature.description && (
                <p className="text-slate-300 whitespace-pre-wrap">{selectedFeature.description}</p>
              )}
              
              {/* Admin status control */}
              {isAdmin && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-purple-400">Admin:</span>
                  <select
                    value={selectedFeature.status}
                    onChange={(e) => handleStatusChange(selectedFeature.id, e.target.value)}
                    className="px-2 py-1 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e] text-white text-sm"
                  >
                    {STATUSES.filter(s => s.value !== 'all').map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Comments */}
              <div className="border-t border-[#1a1a2e] pt-4">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments ({comments.length})
                </h4>
                
                {loadingComments ? (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No comments yet</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div 
                        key={comment.id} 
                        className={`p-3 rounded-xl ${comment.isOfficial ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-[#1a1a2e]'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">
                            {comment.author.displayName || comment.author.name}
                          </span>
                          {comment.isOfficial && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Official
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Add comment */}
            <div className="p-4 border-t border-[#1a1a2e]">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  className="rounded-xl bg-[#1a1a2e] border-[#2a2a3e]"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="rounded-xl bg-purple-600 hover:bg-purple-500"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
