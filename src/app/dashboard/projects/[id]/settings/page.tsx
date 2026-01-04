'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Settings, Trash2, Save, Award, Globe, Eye, EyeOff, Link as LinkIcon } from 'lucide-react'
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
  const [tierData, setTierData] = useState({
    tierLowMax: 40,
    tierMediumMax: 70,
    tierLowLabel: 'Needs Improvement',
    tierMediumLabel: 'Good',
    tierHighLabel: 'Excellent',
    tierLowMsg: '',
    tierMediumMsg: '',
    tierHighMsg: '',
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
        setTierData({
          tierLowMax: data.project.tierLowMax || 40,
          tierMediumMax: data.project.tierMediumMax || 70,
          tierLowLabel: data.project.tierLowLabel || 'Needs Improvement',
          tierMediumLabel: data.project.tierMediumLabel || 'Good',
          tierHighLabel: data.project.tierHighLabel || 'Excellent',
          tierLowMsg: data.project.tierLowMsg || '',
          tierMediumMsg: data.project.tierMediumMsg || '',
          tierHighMsg: data.project.tierHighMsg || '',
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
        body: JSON.stringify({ ...formData, ...tierData }),
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

        {/* Links */}
        <Card className="rounded-3xl mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <LinkIcon className="h-4 w-4" /> Links & Media
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Banner Image URL</label>
                <Input
                  value={formData.bannerUrl}
                  onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                  className="rounded-2xl mt-1"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Logo URL</label>
                <Input
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="rounded-2xl mt-1"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Steam URL</label>
                <Input
                  value={formData.steamUrl}
                  onChange={(e) => setFormData({ ...formData, steamUrl: e.target.value })}
                  className="rounded-2xl mt-1"
                  placeholder="https://store.steampowered.com/..."
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Itch.io URL</label>
                <Input
                  value={formData.itchUrl}
                  onChange={(e) => setFormData({ ...formData, itchUrl: e.target.value })}
                  className="rounded-2xl mt-1"
                  placeholder="https://itch.io/..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Website</label>
                <Input
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="rounded-2xl mt-1"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Discord Server</label>
                <Input
                  value={formData.discordUrl}
                  onChange={(e) => setFormData({ ...formData, discordUrl: e.target.value })}
                  className="rounded-2xl mt-1"
                  placeholder="https://discord.gg/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Tiers Configuration */}
        <Card className="rounded-3xl mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4" /> Score Tiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              Configure how scores are categorized and what messages players see after submitting feedback.
        </p>

        {/* Tier Ranges */}
        <div className="mb-6">
          <h4 className="font-medium text-slate-700 mb-3">Tier Ranges</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <label className="block text-sm font-medium text-red-700 mb-2">
                Low Tier (0% - {tierData.tierLowMax}%)
              </label>
              <input
                type="number"
                value={tierData.tierLowMax}
                onChange={(e) => setTierData({ ...tierData, tierLowMax: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-800 bg-white"
                min={1}
                max={tierData.tierMediumMax - 1}
              />
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <label className="block text-sm font-medium text-yellow-700 mb-2">
                Medium Tier ({tierData.tierLowMax + 1}% - {tierData.tierMediumMax}%)
              </label>
              <input
                type="number"
                value={tierData.tierMediumMax}
                onChange={(e) => setTierData({ ...tierData, tierMediumMax: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-yellow-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-800 bg-white"
                min={tierData.tierLowMax + 1}
                max={99}
              />
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <label className="block text-sm font-medium text-green-700 mb-2">
                High Tier ({tierData.tierMediumMax + 1}% - 100%)
              </label>
              <div className="px-3 py-2 bg-green-100 border border-green-200 rounded-lg text-slate-600 text-sm">
                Automatically calculated
              </div>
            </div>
          </div>
        </div>

        {/* Tier Labels */}
        <div className="mb-6">
          <h4 className="font-medium text-slate-700 mb-3">Tier Labels</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Low Tier Label</label>
              <input
                type="text"
                value={tierData.tierLowLabel}
                onChange={(e) => setTierData({ ...tierData, tierLowLabel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                placeholder="Needs Improvement"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Medium Tier Label</label>
              <input
                type="text"
                value={tierData.tierMediumLabel}
                onChange={(e) => setTierData({ ...tierData, tierMediumLabel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                placeholder="Good"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">High Tier Label</label>
              <input
                type="text"
                value={tierData.tierHighLabel}
                onChange={(e) => setTierData({ ...tierData, tierHighLabel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                placeholder="Excellent"
              />
            </div>
          </div>
        </div>

        {/* Tier Messages */}
        <div>
          <h4 className="font-medium text-slate-700 mb-3">Tier Messages (shown to players after submission)</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-red-600 mb-1">Low Tier Message</label>
              <textarea
                value={tierData.tierLowMsg}
                onChange={(e) => setTierData({ ...tierData, tierLowMsg: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                placeholder="Thanks for the honest feedback! We'll work on improving..."
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-600 mb-1">Medium Tier Message</label>
              <textarea
                value={tierData.tierMediumMsg}
                onChange={(e) => setTierData({ ...tierData, tierMediumMsg: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                placeholder="Good foundation! Here's what we're focusing on..."
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-600 mb-1">High Tier Message</label>
              <textarea
                value={tierData.tierHighMsg}
                onChange={(e) => setTierData({ ...tierData, tierHighMsg: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                placeholder="Awesome! Glad you enjoyed it!"
                rows={2}
              />
            </div>
          </div>
        </div>

            {/* Preview */}
            <div className="mt-4 p-4 rounded-2xl border">
              <h4 className="font-medium text-sm mb-3">Preview</h4>
              <div className="flex gap-2">
                <div className="flex-1 text-center p-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white">
                  <div className="text-xs opacity-80">0-{tierData.tierLowMax}%</div>
                  <div className="font-semibold text-sm">{tierData.tierLowLabel || 'Low'}</div>
                </div>
                <div className="flex-1 text-center p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
                  <div className="text-xs opacity-80">{tierData.tierLowMax + 1}-{tierData.tierMediumMax}%</div>
                  <div className="font-semibold text-sm">{tierData.tierMediumLabel || 'Medium'}</div>
                </div>
                <div className="flex-1 text-center p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  <div className="text-xs opacity-80">{tierData.tierMediumMax + 1}-100%</div>
                  <div className="font-semibold text-sm">{tierData.tierHighLabel || 'High'}</div>
                </div>
              </div>
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
