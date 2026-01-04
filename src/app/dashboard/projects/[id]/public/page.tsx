'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  ExternalLink,
  Gamepad2, 
  Globe, 
  Tag,
  User,
  Calendar,
  BookOpen,
  Sparkles,
  Activity,
  Eye,
  Pencil,
  X,
  Save,
  Plus,
  Image,
  Megaphone
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface Update {
  id: string
  type: string
  title: string
  description: string | null
  createdAt: string
}

interface Project {
  id: string
  name: string
  slug: string | null
  description: string | null
  visibility: 'PRIVATE' | 'PUBLIC' | 'UNLISTED'
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
}

interface Game {
  id: string
  name: string
  description: string | null
  slug: string
  visibility: 'PRIVATE' | 'PUBLIC' | 'UNLISTED'
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
  createdAt: string
  user: {
    displayName: string | null
    username: string | null
    studioName: string | null
    avatarUrl: string | null
  }
  updates: Update[]
  _count: {
    forms: number
    stats: number
    versions: number
    updates: number
  }
}

type EditingSection = 'banner' | 'hero' | 'about' | 'rules' | 'updates' | null

export default function GamePageEditor() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingSection, setEditingSection] = useState<EditingSection>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form states for each section
  const [heroForm, setHeroForm] = useState({
    bannerUrl: '',
    logoUrl: '',
    genre: '',
    tags: [] as string[],
    tagInput: '',
    steamUrl: '',
    itchUrl: '',
    websiteUrl: '',
    discordUrl: '',
  })

  const [aboutForm, setAboutForm] = useState({
    description: '',
    features: [] as string[],
    featureInput: '',
  })

  const [rulesForm, setRulesForm] = useState({
    rules: '',
  })

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    description: '',
  })

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      const projectRes = await fetch(`/api/projects/${projectId}`)
      const projectData = await projectRes.json()
      
      if (projectData.project) {
        setProject(projectData.project)
        
        // Initialize form states
        setHeroForm({
          bannerUrl: projectData.project.bannerUrl || '',
          logoUrl: projectData.project.logoUrl || '',
          genre: projectData.project.genre || '',
          tags: projectData.project.tags || [],
          tagInput: '',
          steamUrl: projectData.project.steamUrl || '',
          itchUrl: projectData.project.itchUrl || '',
          websiteUrl: projectData.project.websiteUrl || '',
          discordUrl: projectData.project.discordUrl || '',
        })
        
        setAboutForm({
          description: projectData.project.description || '',
          features: projectData.project.features || [],
          featureInput: '',
        })
        
        setRulesForm({
          rules: projectData.project.rules || '',
        })

        if (projectData.project.slug) {
          try {
            const gameRes = await fetch(`/api/games/${projectData.project.slug}`)
            if (gameRes.ok) {
              const gameData = await gameRes.json()
              if (gameData.game) {
                setGame(gameData.game)
              }
            }
          } catch {
            // Game API may fail if not public yet, that's ok
          }
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (section: EditingSection) => {
    if (!section) return
    setSaving(true)
    setMessage(null)

    try {
      let updateData = {}
      
      if (section === 'banner') {
        updateData = {
          bannerUrl: heroForm.bannerUrl || null,
          logoUrl: heroForm.logoUrl || null,
        }
      } else if (section === 'hero') {
        updateData = {
          genre: heroForm.genre || null,
          tags: heroForm.tags,
          steamUrl: heroForm.steamUrl || null,
          itchUrl: heroForm.itchUrl || null,
          websiteUrl: heroForm.websiteUrl || null,
          discordUrl: heroForm.discordUrl || null,
        }
      } else if (section === 'about') {
        updateData = {
          description: aboutForm.description || null,
          features: aboutForm.features,
        }
      } else if (section === 'rules') {
        updateData = {
          rules: rulesForm.rules || null,
        }
      }

      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Saved!' })
        setEditingSection(null)
        fetchData()
      } else {
        setMessage({ type: 'error', text: 'Failed to save' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save' })
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handlePostAnnouncement = async () => {
    if (!announcementForm.title.trim()) return
    setSaving(true)

    try {
      const res = await fetch(`/api/projects/${projectId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SETTINGS_CHANGED',
          title: announcementForm.title,
          description: announcementForm.description || null,
        }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Announcement posted!' })
        setAnnouncementForm({ title: '', description: '' })
        setEditingSection(null)
        fetchData()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    const tag = heroForm.tagInput.trim()
    if (tag && !heroForm.tags.includes(tag) && heroForm.tags.length < 10) {
      setHeroForm({ ...heroForm, tags: [...heroForm.tags, tag], tagInput: '' })
    }
  }

  const removeTag = (tagToRemove: string) => {
    setHeroForm({ ...heroForm, tags: heroForm.tags.filter(t => t !== tagToRemove) })
  }

  const addFeature = () => {
    const feature = aboutForm.featureInput.trim()
    if (feature && !aboutForm.features.includes(feature) && aboutForm.features.length < 10) {
      setAboutForm({ ...aboutForm, features: [...aboutForm.features, feature], featureInput: '' })
    }
  }

  const removeFeature = (featureToRemove: string) => {
    setAboutForm({ ...aboutForm, features: aboutForm.features.filter(f => f !== featureToRemove) })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <Gamepad2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold mb-2">Project Not Found</h2>
      </div>
    )
  }

  const developerName = game?.user.studioName || game?.user.displayName || game?.user.username || 'You'
  const publicUrl = project.slug ? `/g/${project.slug}` : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Game Page Editor</h2>
          <p className="text-sm text-muted-foreground">
            Click on any section to edit. Changes are saved per section.
            {project.visibility === 'PRIVATE' && (
              <span className="text-yellow-600 ml-1">(Currently private)</span>
            )}
          </p>
        </div>
        {publicUrl && (
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            <Button className="rounded-2xl">
              <Eye className="h-4 w-4 mr-2" /> View Live Page
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </a>
        )}
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Preview with Editable Sections - Light Theme */}
      <div className="rounded-3xl border overflow-hidden bg-card">
        
        {/* SECTION: Banner & Logo */}
        <div className="relative group">
          {editingSection !== 'banner' && (
            <button
              onClick={() => setEditingSection('banner')}
              className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Pencil className="h-3 w-3" /> Edit Banner
            </button>
          )}

          {editingSection === 'banner' ? (
            <Card className="m-4 rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Image className="h-4 w-4" /> Edit Banner & Logo
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => handleSave('banner')} disabled={saving}>
                      <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Banner Image URL</label>
                  <Input
                    value={heroForm.bannerUrl}
                    onChange={(e) => setHeroForm({ ...heroForm, bannerUrl: e.target.value })}
                    className="mt-1 rounded-xl"
                    placeholder="https://example.com/banner.jpg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Recommended: 1200x400px</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Logo Image URL</label>
                  <Input
                    value={heroForm.logoUrl}
                    onChange={(e) => setHeroForm({ ...heroForm, logoUrl: e.target.value })}
                    className="mt-1 rounded-xl"
                    placeholder="https://example.com/logo.jpg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Recommended: 200x200px square</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="relative h-48 overflow-hidden bg-muted">
              {project.bannerUrl ? (
                <img src={project.bannerUrl} alt={project.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-gray-200 to-gray-300">
                  <span className="text-muted-foreground text-sm">Click "Edit Banner" to add a banner image</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Game Info Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted border-2 shadow-lg flex-shrink-0 -mt-12 relative z-10">
              {project.logoUrl ? (
                <img src={project.logoUrl} alt={project.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                  <Gamepad2 className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{project.name}</h1>
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {developerName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Hero Info (Genre, Tags, Links) */}
        <Card className={`mx-4 mt-4 rounded-2xl relative group ${editingSection === 'hero' ? 'ring-2 ring-primary' : ''}`}>
          {editingSection !== 'hero' && (
            <button
              onClick={() => setEditingSection('hero')}
              className="absolute top-3 right-3 z-10 bg-muted hover:bg-muted/80 px-2 py-1 rounded-lg text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
          )}
          
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Tag className="h-4 w-4" /> Game Info & Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editingSection === 'hero' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Genre</label>
                    <Input
                      value={heroForm.genre}
                      onChange={(e) => setHeroForm({ ...heroForm, genre: e.target.value })}
                      className="mt-1 rounded-xl"
                      placeholder="RPG, Action, Puzzle..."
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Tags</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={heroForm.tagInput}
                        onChange={(e) => setHeroForm({ ...heroForm, tagInput: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="rounded-xl"
                        placeholder="Add tag..."
                      />
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={addTag}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {heroForm.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {heroForm.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="cursor-pointer rounded-full" onClick={() => removeTag(tag)}>
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Steam URL</label>
                    <Input
                      value={heroForm.steamUrl}
                      onChange={(e) => setHeroForm({ ...heroForm, steamUrl: e.target.value })}
                      className="mt-1 rounded-xl"
                      placeholder="https://store.steampowered.com/..."
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Itch.io URL</label>
                    <Input
                      value={heroForm.itchUrl}
                      onChange={(e) => setHeroForm({ ...heroForm, itchUrl: e.target.value })}
                      className="mt-1 rounded-xl"
                      placeholder="https://itch.io/..."
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Website URL</label>
                    <Input
                      value={heroForm.websiteUrl}
                      onChange={(e) => setHeroForm({ ...heroForm, websiteUrl: e.target.value })}
                      className="mt-1 rounded-xl"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Discord URL</label>
                    <Input
                      value={heroForm.discordUrl}
                      onChange={(e) => setHeroForm({ ...heroForm, discordUrl: e.target.value })}
                      className="mt-1 rounded-xl"
                      placeholder="https://discord.gg/..."
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSave('hero')} disabled={saving}>
                    <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {project.genre ? (
                    <Badge variant="secondary" className="rounded-full">{project.genre}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm italic">No genre set</span>
                  )}
                  {project.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="rounded-full">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.steamUrl && (
                    <Button size="sm" className="rounded-xl bg-[#1b2838] hover:bg-[#2a475e] h-7 text-xs">Steam</Button>
                  )}
                  {project.itchUrl && (
                    <Button size="sm" className="rounded-xl bg-[#fa5c5c] hover:bg-[#ff7676] h-7 text-xs">Itch.io</Button>
                  )}
                  {project.websiteUrl && (
                    <Button size="sm" variant="outline" className="rounded-xl h-7 text-xs">
                      <Globe className="h-3 w-3 mr-1" /> Website
                    </Button>
                  )}
                  {project.discordUrl && (
                    <Button size="sm" className="rounded-xl bg-[#5865F2] hover:bg-[#6d79f5] h-7 text-xs">Discord</Button>
                  )}
                  {!project.steamUrl && !project.itchUrl && !project.websiteUrl && !project.discordUrl && (
                    <span className="text-muted-foreground text-xs italic">No links added yet</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Sections */}
        <div className="p-4 space-y-4">
          
          {/* SECTION 2: About */}
          <Card className={`rounded-2xl relative group ${editingSection === 'about' ? 'ring-2 ring-primary' : ''}`}>
            {editingSection !== 'about' && (
              <button
                onClick={() => setEditingSection('about')}
                className="absolute top-3 right-3 z-10 bg-muted hover:bg-muted/80 px-2 py-1 rounded-lg text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
            )}
            
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> About & Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingSection === 'about' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Description</label>
                    <textarea
                      value={aboutForm.description}
                      onChange={(e) => setAboutForm({ ...aboutForm, description: e.target.value })}
                      className="w-full mt-1 border rounded-xl px-3 py-2 text-sm resize-none"
                      rows={4}
                      placeholder="Describe your game..."
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Key Features</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={aboutForm.featureInput}
                        onChange={(e) => setAboutForm({ ...aboutForm, featureInput: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                        className="rounded-xl"
                        placeholder="Add feature..."
                      />
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={addFeature}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {aboutForm.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {aboutForm.features.map(f => (
                          <Badge key={f} variant="secondary" className="cursor-pointer rounded-full" onClick={() => removeFeature(f)}>
                            {f} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleSave('about')} disabled={saving}>
                      <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {project.description ? (
                    <p className="text-muted-foreground text-sm mb-3">{project.description}</p>
                  ) : (
                    <p className="text-muted-foreground text-sm mb-3 italic">No description yet. Click Edit to add one.</p>
                  )}
                  {project.features.length > 0 ? (
                    <div className="space-y-1">
                      {project.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {f}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs italic">No features listed</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 3: How to Play */}
          <Card className={`rounded-2xl relative group ${editingSection === 'rules' ? 'ring-2 ring-primary' : ''}`}>
            {editingSection !== 'rules' && (
              <button
                onClick={() => setEditingSection('rules')}
                className="absolute top-3 right-3 z-10 bg-muted hover:bg-muted/80 px-2 py-1 rounded-lg text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
            )}
            
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> How to Play
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingSection === 'rules' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Rules / Instructions (Markdown supported)</label>
                    <textarea
                      value={rulesForm.rules}
                      onChange={(e) => setRulesForm({ ...rulesForm, rules: e.target.value })}
                      className="w-full mt-1 border rounded-xl px-3 py-2 text-sm resize-none font-mono"
                      rows={8}
                      placeholder="# How to Play&#10;&#10;1. First step...&#10;2. Second step..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleSave('rules')} disabled={saving}>
                      <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {project.rules ? (
                    <pre className="text-muted-foreground text-sm whitespace-pre-wrap font-sans">{project.rules}</pre>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">No rules or instructions yet. Click Edit to add them.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 4: Updates Timeline */}
          <Card className={`rounded-2xl relative group ${editingSection === 'updates' ? 'ring-2 ring-primary' : ''}`}>
            {editingSection !== 'updates' && (
              <button
                onClick={() => setEditingSection('updates')}
                className="absolute top-3 right-3 z-10 bg-muted hover:bg-muted/80 px-2 py-1 rounded-lg text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus className="h-3 w-3" /> Post Update
              </button>
            )}
            
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" /> Updates
                <Badge variant="secondary" className="rounded-full text-xs ml-1">
                  {game?._count.updates || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingSection === 'updates' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/50 border">
                    <div className="flex items-center gap-2 mb-3">
                      <Megaphone className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Post an Announcement</span>
                    </div>
                    <Input
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      className="rounded-xl mb-2"
                      placeholder="Announcement title..."
                    />
                    <textarea
                      value={announcementForm.description}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, description: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 text-sm resize-none"
                      rows={2}
                      placeholder="Optional description..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handlePostAnnouncement} disabled={saving || !announcementForm.title.trim()}>
                      <Megaphone className="h-4 w-4 mr-1" /> {saving ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Mini activity graph */}
                  {game && game.updates.length > 0 && (
                    <div className="mb-3 p-2 rounded-lg bg-muted/50">
                      <div className="flex gap-0.5 flex-wrap">
                        {(() => {
                          const today = new Date()
                          const days = []
                          for (let i = 89; i >= 0; i--) {
                            const date = new Date(today)
                            date.setDate(date.getDate() - i)
                            const dateStr = date.toISOString().split('T')[0]
                            const count = game.updates.filter(u => u.createdAt.split('T')[0] === dateStr).length
                            days.push({ date: dateStr, count })
                          }
                          return days.map((day, idx) => (
                            <div
                              key={idx}
                              className={`w-2 h-2 rounded-sm ${
                                day.count === 0 ? 'bg-muted' :
                                day.count === 1 ? 'bg-green-400' :
                                day.count >= 2 ? 'bg-green-600' : 'bg-muted'
                              }`}
                              title={`${day.date}: ${day.count} update${day.count !== 1 ? 's' : ''}`}
                            />
                          ))
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {game && game.updates.length > 0 ? (
                    <div className="space-y-2">
                      {game.updates.slice(0, 5).map((update) => (
                        <div key={update.id} className="flex items-start gap-2 text-sm">
                          <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                            <Activity className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">{update.title}</div>
                            <div className="text-muted-foreground text-xs">{new Date(update.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">No updates yet. Click "Post Update" to share news with your players.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
