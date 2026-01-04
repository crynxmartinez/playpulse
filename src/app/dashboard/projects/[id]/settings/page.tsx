'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Settings, Trash2, Globe, Eye, EyeOff, Link as LinkIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'

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
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false)
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

  const confirmDelete = async () => {
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
        setDeleteModalOpen(false)
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave}>
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" /> General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Game Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="rounded-xl"
                    placeholder="My Awesome Game"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL Slug</label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm p-2 bg-muted rounded-l-xl border border-r-0">/g/</span>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="rounded-r-xl rounded-l-none"
                      placeholder="my-game"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">3-50 chars, lowercase, hyphens</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'PRIVATE', label: 'Private', desc: 'Only you can see', icon: EyeOff },
                    { value: 'UNLISTED', label: 'Unlisted', desc: 'Anyone with link', icon: LinkIcon },
                    { value: 'PUBLIC', label: 'Public', desc: 'Listed in discovery', icon: Eye },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, visibility: opt.value as typeof formData.visibility })}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 ${formData.visibility === opt.value ? 'border-primary ring-2 ring-primary/50 bg-primary/5' : 'hover:border-muted-foreground/50'}`}
                    >
                      <opt.icon className={`h-5 w-5 mb-2 ${formData.visibility === opt.value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="rounded-xl" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-3xl border-destructive/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <Trash2 className="h-4 w-4" /> Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Once you delete a game, there is no going back. All campaigns, stats, and responses will be permanently deleted.
              </p>
              <Button
                variant="destructive"
                className="rounded-xl w-full"
                onClick={() => setDeleteModalOpen(true)}
                disabled={deleting}
              >
                Delete Game
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Modal open={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
            <p>Are you sure you want to delete this project? This action is irreversible and will permanently delete all associated data, including forms, stats, and responses.</p>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" className="rounded-xl" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                <Button variant="destructive" className="rounded-xl" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Confirm Delete'}
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  )
}
