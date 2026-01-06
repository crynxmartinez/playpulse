'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Settings, Trash2, Globe, Eye, EyeOff, Link as LinkIcon, Image, Tag, FileText, Plus, ExternalLink, Upload, X, File } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Toast } from '@/components/ui/toast'

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
  rules: string | null
  features: string[]
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
    rules: '',
    rulesPdfUrl: '',
    features: [] as string[],
  })
  const [tagInput, setTagInput] = useState('')
  const [featureInput, setFeatureInput] = useState('')
  const [rulesMode, setRulesMode] = useState<'text' | 'pdf'>('text')
  const [uploadingPdf, setUploadingPdf] = useState(false)
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
          rules: data.project.rules || '',
          rulesPdfUrl: data.project.rulesPdfUrl || '',
          features: data.project.features || [],
        })
        // Set rules mode based on whether PDF exists
        if (data.project.rulesPdfUrl) {
          setRulesMode('pdf')
        }
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

  const addFeature = () => {
    const feature = featureInput.trim()
    if (feature && !formData.features.includes(feature) && formData.features.length < 10) {
      setFormData({ ...formData, features: [...formData.features, feature] })
      setFeatureInput('')
    }
  }

  const removeFeature = (featureToRemove: string) => {
    setFormData({ ...formData, features: formData.features.filter(f => f !== featureToRemove) })
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
        <Toast
          message={message.text}
          type={message.type}
          onClose={() => setMessage(null)}
        />
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
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] resize-none"
                    placeholder="A short description of your game..."
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">{formData.description.length}/200 characters</p>
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

            {/* Game Profile - Banner, Logo, Genre, Tags */}
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Image className="h-4 w-4" /> Game Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Banner Image URL</label>
                    <Input
                      value={formData.bannerUrl}
                      onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                      className="rounded-xl"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logo Image URL</label>
                    <Input
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      className="rounded-xl"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Genre</label>
                  <select
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full rounded-xl border border-input bg-[#0d0d15] text-white px-3 py-2 text-sm [&>option]:bg-[#0d0d15] [&>option]:text-white"
                  >
                    <option value="">Select a genre...</option>
                    {GENRES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags (max 5)</label>
                  <p className="text-xs text-muted-foreground">Used for discovery and search. e.g. #tcg, #mythology, #indie</p>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="rounded-xl"
                      placeholder="Add a tag..."
                    />
                    <Button type="button" variant="outline" className="rounded-xl" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="rounded-full cursor-pointer py-1 px-3" onClick={() => removeTag(tag)}>
                          #{tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" /> Social Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Website</label>
                    <Input
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      className="rounded-xl"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Discord</label>
                    <Input
                      value={formData.discordUrl}
                      onChange={(e) => setFormData({ ...formData, discordUrl: e.target.value })}
                      className="rounded-xl"
                      placeholder="https://discord.gg/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Steam</label>
                    <Input
                      value={formData.steamUrl}
                      onChange={(e) => setFormData({ ...formData, steamUrl: e.target.value })}
                      className="rounded-xl"
                      placeholder="https://store.steampowered.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Itch.io</label>
                    <Input
                      value={formData.itchUrl}
                      onChange={(e) => setFormData({ ...formData, itchUrl: e.target.value })}
                      className="rounded-xl"
                      placeholder="https://itch.io/..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Rules & Features */}
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Game Rules & Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">How to Play / Rules</label>
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setRulesMode('text')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${rulesMode === 'text' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted-foreground/20'}`}
                      >
                        Text
                      </button>
                      <button
                        type="button"
                        onClick={() => setRulesMode('pdf')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${rulesMode === 'pdf' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted-foreground/20'}`}
                      >
                        PDF
                      </button>
                    </div>
                  </div>
                  
                  {rulesMode === 'text' ? (
                    <>
                      <p className="text-xs text-muted-foreground">Write instructions or rules for your game. Supports markdown.</p>
                      <textarea
                        value={formData.rules}
                        onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono resize-none min-h-[120px]"
                        placeholder="# How to Play&#10;&#10;1. First, do this...&#10;2. Then, do that..."
                      />
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">Upload a PDF rulebook. It will be displayed in an embedded viewer on your game page.</p>
                      {formData.rulesPdfUrl ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-input bg-muted/30">
                          <File className="h-8 w-8 text-red-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Rules PDF</p>
                            <a href={formData.rulesPdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">
                              {formData.rulesPdfUrl}
                            </a>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-lg text-destructive hover:text-destructive"
                            onClick={() => setFormData({ ...formData, rulesPdfUrl: '' })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            value={formData.rulesPdfUrl}
                            onChange={(e) => setFormData({ ...formData, rulesPdfUrl: e.target.value })}
                            className="rounded-xl"
                            placeholder="Paste PDF URL (e.g. from Google Drive, Dropbox, or direct link)"
                          />
                          <p className="text-xs text-muted-foreground">
                            Tip: Upload your PDF to Google Drive, make it public, and paste the sharing link here.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Key Features (max 10)</label>
                  <p className="text-xs text-muted-foreground">Highlight what makes your game special. e.g. "Trading Card Game", "Philippine Mythology"</p>
                  <div className="flex gap-2">
                    <Input
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      className="rounded-xl"
                      placeholder="Add a feature..."
                    />
                    <Button type="button" variant="outline" className="rounded-xl" onClick={addFeature}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.features.map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="rounded-full cursor-pointer py-1 px-3" onClick={() => removeFeature(feature)}>
                          {feature} ×
                        </Badge>
                      ))}
                    </div>
                  )}
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
