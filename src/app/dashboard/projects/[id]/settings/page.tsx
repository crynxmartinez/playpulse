'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Settings, Trash2, Globe, Eye, EyeOff, Link as LinkIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Project {
  id: string
  name: string
  description: string | null
  slug: string | null
  visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC'
  bannerUrl: string | null
  logoUrl: string | null
  genre: string | null
  tags: string[]
  steamUrl: string | null
  itchUrl: string | null
  websiteUrl: string | null
  discordUrl: string | null
  tierLowMax: number
  tierMediumMax: number
  tierLowLabel: string
  tierMediumLabel: string
  tierHighLabel: string
  tierLowMsg: string | null
  tierMediumMsg: string | null
  tierHighMsg: string | null
}

const GENRES = [
  'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 
  'Puzzle', 'Platformer', 'Shooter', 'Racing', 'Sports',
  'Horror', 'Roguelike', 'Card Game', 'Fighting', 'Other'
]

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    visibility: 'PRIVATE' as 'PRIVATE' | 'UNLISTED' | 'PUBLIC',
    bannerUrl: '',
    logoUrl: '',
    genre: '',
    tags: [] as string[],
    steamUrl: '',
    itchUrl: '',
    websiteUrl: '',
    discordUrl: '',
  })
  const [tagInput, setTagInput] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      if (data.project) {
        setProject(data.project)
        setFormData({
          name: data.project.name,
          description: data.project.description || '',
          slug: data.project.slug || '',
          visibility: data.project.visibility || 'PRIVATE',
          bannerUrl: data.project.bannerUrl || '',
          logoUrl: data.project.logoUrl || '',
          genre: data.project.genre || '',
          tags: data.project.tags || [],
          steamUrl: data.project.steamUrl || '',
          itchUrl: data.project.itchUrl || '',
          websiteUrl: data.project.websiteUrl || '',
          discordUrl: data.project.discordUrl || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (res.ok) {
        setProject(data.project)
        setMessage({ type: 'success', text: 'Game settings updated successfully!' })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update settings' })
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone. All forms, stats, and responses will be permanently deleted.')) {
      return
    }

    setDeleting(true)

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setMessage({ type: 'error', text: 'Failed to delete project' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete project' })
      console.error(error)
    } finally {
      setDeleting(false)
    }
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
      <div>
        <div className="text-lg font-semibold">Settings</div>
        <div className="text-sm text-muted-foreground">
          Configure your game settings and score tiers.
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Game Info */}
        <Card className="rounded-3xl mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" /> Game Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Game Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-2xl mt-1"
                  placeholder="My Awesome Game"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">URL Slug</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground text-sm">/g/</span>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="rounded-2xl"
                    placeholder="my-game"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">3-50 chars, lowercase, hyphens</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-2xl mt-1 px-3 py-2 border bg-background text-sm resize-none"
                placeholder="A brief description of your game..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Genre</label>
                <select
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="w-full rounded-2xl mt-1 px-3 py-2 border bg-background text-sm"
                >
                  <option value="">Select genre...</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Tags (max 5)</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="rounded-2xl"
                    placeholder="Add tag..."
                  />
                  <Button type="button" variant="outline" className="rounded-2xl" onClick={addTag}>Add</Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="rounded-full cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visibility */}
        <Card className="rounded-3xl mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" /> Visibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'PRIVATE', label: 'Private', desc: 'Only you can see', icon: EyeOff },
                { value: 'UNLISTED', label: 'Unlisted', desc: 'Anyone with link', icon: LinkIcon },
                { value: 'PUBLIC', label: 'Public', desc: 'Listed in discovery', icon: Eye },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: opt.value as typeof formData.visibility })}
                  className={`p-4 rounded-2xl border text-left transition ${
                    formData.visibility === opt.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <opt.icon className={`h-5 w-5 mb-2 ${formData.visibility === opt.value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button type="submit" className="rounded-2xl w-full md:w-auto" disabled={saving}>
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </form>

      {/* Danger Zone */}
      <Card className="rounded-3xl border-destructive/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            Once you delete a game, there is no going back. All campaigns, stats, and responses will be permanently deleted.
          </p>
          <Button
            variant="destructive"
            className="rounded-2xl"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Game'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
