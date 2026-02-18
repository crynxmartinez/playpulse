'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, FileText, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import dynamic from 'next/dynamic'

const TipTapEditor = dynamic(() => import('@/components/TipTapEditor'), { 
  ssr: false,
  loading: () => (
    <div className="rounded-xl bg-[#1a1a2e] border border-[#2a2a3e] p-4 min-h-[500px] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
})

const CATEGORIES = [
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
  { value: 'GUIDES', label: 'Guides' },
  { value: 'UPDATES', label: 'Updates' },
  { value: 'DEV_BLOG', label: 'Dev Blog' },
  { value: 'TIPS', label: 'Tips' },
  { value: 'COMMUNITY', label: 'Community' },
]

export default function EditBlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [title, setTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [category, setCategory] = useState('ANNOUNCEMENT')
  const [tags, setTags] = useState('')
  const [status, setStatus] = useState('DRAFT')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  useEffect(() => {
    fetchPost()
  }, [slug])

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/blog/${slug}?admin=true`)
      const data = await res.json()
      
      if (data.post) {
        const post = data.post
        setTitle(post.title)
        setNewSlug(post.slug)
        setExcerpt(post.excerpt || '')
        setContent(post.content || '')
        setCoverImage(post.coverImage || '')
        setCategory(post.category)
        setTags(post.tags?.join(', ') || '')
        setStatus(post.status)
        setMetaTitle(post.metaTitle || '')
        setMetaDescription(post.metaDescription || '')
      }
    } catch (err) {
      setError('Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleSave = async (newStatus?: string) => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!newSlug.trim()) {
      setError('Slug is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/blog/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          newSlug: newSlug.trim(),
          excerpt: excerpt.trim() || null,
          content,
          coverImage: coverImage.trim() || null,
          category,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          status: newStatus || status,
          metaTitle: metaTitle.trim() || null,
          metaDescription: metaDescription.trim() || null,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save post')
        return
      }

      router.push('/dashboard/admin/blog')
    } catch (err) {
      setError('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const res = await fetch(`/api/blog/${slug}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/admin/blog')
      }
    } catch (err) {
      setError('Failed to delete post')
    }
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FileText className="h-7 w-7 text-purple-400" />
              Edit Post
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDelete}
            className="rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className="rounded-xl border-[#2a2a3e]"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave('PUBLISHED')}
            disabled={saving}
            className="rounded-xl bg-purple-600 hover:bg-purple-500"
          >
            <Eye className="h-4 w-4 mr-2" />
            {status === 'PUBLISHED' ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug */}
          <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Title *</label>
                <Input
                  placeholder="Enter post title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl bg-[#1a1a2e] border-[#2a2a3e] text-lg"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Slug *</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">/blog/</span>
                  <Input
                    placeholder="post-url-slug"
                    value={newSlug}
                    onChange={(e) => setNewSlug(generateSlug(e.target.value))}
                    className="rounded-xl bg-[#1a1a2e] border-[#2a2a3e]"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Excerpt</label>
                <Textarea
                  placeholder="Short preview text for cards and SEO..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="rounded-xl bg-[#1a1a2e] border-[#2a2a3e] min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
            <CardHeader>
              <CardTitle className="text-white">Content</CardTitle>
            </CardHeader>
            <CardContent>
              <TipTapEditor
                content={content}
                onChange={setContent}
                placeholder="Write your blog post content here..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cover Image */}
          <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
            <CardHeader>
              <CardTitle className="text-white text-sm">Cover Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {coverImage && (
                <img 
                  src={coverImage} 
                  alt="Cover preview" 
                  className="w-full h-32 object-cover rounded-xl"
                />
              )}
              <Input
                placeholder="Image URL..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="rounded-xl bg-[#1a1a2e] border-[#2a2a3e]"
              />
            </CardContent>
          </Card>

          {/* Category & Tags */}
          <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
            <CardHeader>
              <CardTitle className="text-white text-sm">Category & Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1a1a2e] border border-[#2a2a3e] text-white"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Tags</label>
                <Input
                  placeholder="tag1, tag2, tag3..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="rounded-xl bg-[#1a1a2e] border-[#2a2a3e]"
                />
                <p className="text-xs text-slate-500 mt-1">Separate with commas</p>
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
            <CardHeader>
              <CardTitle className="text-white text-sm">SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Meta Title</label>
                <Input
                  placeholder="Custom title for search engines..."
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="rounded-xl bg-[#1a1a2e] border-[#2a2a3e]"
                />
                <p className="text-xs text-slate-500 mt-1">Leave empty to use post title</p>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Meta Description</label>
                <Textarea
                  placeholder="Custom description for search engines..."
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="rounded-xl bg-[#1a1a2e] border-[#2a2a3e] min-h-[80px]"
                />
                <p className="text-xs text-slate-500 mt-1">Leave empty to use excerpt</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
