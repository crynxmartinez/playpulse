'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  Calendar,
  Search,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  coverImage: string | null
  category: string
  status: string
  publishedAt: string | null
  createdAt: string
  author: {
    displayName: string | null
    name: string | null
  }
  _count: {
    comments: number
  }
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
  { value: 'GUIDES', label: 'Guides' },
  { value: 'UPDATES', label: 'Updates' },
  { value: 'DEV_BLOG', label: 'Dev Blog' },
  { value: 'TIPS', label: 'Tips' },
  { value: 'COMMUNITY', label: 'Community' },
]

const CATEGORY_COLORS: Record<string, string> = {
  ANNOUNCEMENT: 'bg-red-500/20 text-red-400 border-red-500/30',
  GUIDES: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  UPDATES: 'bg-green-500/20 text-green-400 border-green-500/30',
  DEV_BLOG: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  TIPS: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  COMMUNITY: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
}

export default function AdminBlogPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [statusFilter, categoryFilter])

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams({ admin: 'true' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      
      const res = await fetch(`/api/blog?${params}`)
      const data = await res.json()
      if (data.posts) {
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    setDeleting(slug)
    try {
      const res = await fetch(`/api/blog/${slug}`, { method: 'DELETE' })
      if (res.ok) {
        fetchPosts()
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
    } finally {
      setDeleting(null)
    }
  }

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'PUBLISHED').length,
    drafts: posts.filter(p => p.status === 'DRAFT').length,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="h-7 w-7 text-purple-400" />
            Blog Posts
          </h1>
          <p className="text-slate-400 mt-1">Manage blog posts and announcements</p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/admin/blog/new')}
          className="rounded-xl bg-purple-600 hover:bg-purple-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-slate-400">Total Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.published}</p>
                <p className="text-xs text-slate-400">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.drafts}</p>
                <p className="text-xs text-slate-400">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search posts..."
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
          <option value="all">All Status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
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
      </div>

      {/* Posts Table */}
      <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
        <CardContent className="p-0">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No blog posts yet</p>
              <Button
                onClick={() => router.push('/dashboard/admin/blog/new')}
                className="mt-4 rounded-xl bg-purple-600 hover:bg-purple-500"
              >
                Create your first post
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1a1a2e]">
                    <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Post</th>
                    <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Category</th>
                    <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Status</th>
                    <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Date</th>
                    <th className="text-right p-4 text-xs font-medium text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="border-b border-[#1a1a2e] hover:bg-[#1a1a2e]/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {post.coverImage ? (
                            <img 
                              src={post.coverImage} 
                              alt="" 
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-[#2a2a3e] flex items-center justify-center">
                              <FileText className="h-5 w-5 text-slate-500" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">{post.title}</p>
                            <p className="text-xs text-slate-400">/{post.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={CATEGORY_COLORS[post.category] || 'bg-slate-500/20 text-slate-400'}>
                          {post.category.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {post.status === 'PUBLISHED' ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Published
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            <Clock className="h-3 w-3 mr-1" />
                            Draft
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {post.status === 'PUBLISHED' && (
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg text-xs border-[#2a2a3e]"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/dashboard/admin/blog/${post.slug}/edit`)}
                            className="rounded-lg text-xs border-[#2a2a3e]"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(post.slug)}
                            disabled={deleting === post.slug}
                            className="rounded-lg text-xs border-red-500/30 text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
