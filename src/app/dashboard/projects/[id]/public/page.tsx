'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ExternalLink,
  Gamepad2, 
  Globe, 
  MessageSquare,
  Tag,
  User,
  Calendar,
  BookOpen,
  Sparkles,
  GitBranch,
  Activity,
  Edit,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Version {
  id: string
  version: string
  title: string
  content: string
  changelog: string | null
  imageUrl: string | null
  publishedAt: string | null
}

interface Update {
  id: string
  type: string
  title: string
  description: string | null
  createdAt: string
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
  forms: {
    id: string
    title: string
    slug: string | null
  }[]
  versions: Version[]
  updates: Update[]
  _count: {
    forms: number
    stats: number
    versions: number
    updates: number
  }
}

export default function PublicPageEditor() {
  const params = useParams()
  const projectId = params.id as string

  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGame()
  }, [projectId])

  const fetchGame = async () => {
    try {
      // First get the project to get the slug
      const projectRes = await fetch(`/api/projects/${projectId}`)
      const projectData = await projectRes.json()
      
      if (projectData.project?.slug) {
        const gameRes = await fetch(`/api/games/${projectData.project.slug}`)
        const gameData = await gameRes.json()
        if (gameData.game) {
          setGame(gameData.game)
        }
      }
    } catch (err) {
      console.error('Failed to load game:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <Gamepad2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold mb-2">No Public Page Yet</h2>
        <p className="text-muted-foreground mb-4">Save your project settings to generate a public page.</p>
      </div>
    )
  }

  const developerName = game.user.studioName || game.user.displayName || game.user.username || 'Unknown Developer'
  const publicUrl = `/g/${game.slug}`

  return (
    <div className="space-y-4">
      {/* Header with Preview Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Public Page Preview</h2>
          <p className="text-sm text-muted-foreground">
            This is how your game page looks to visitors.
            {game.visibility === 'PRIVATE' && (
              <span className="text-yellow-600 ml-1">(Currently private - only you can see this)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/projects/${projectId}/profile`}>
            <Button variant="outline" className="rounded-2xl">
              <Edit className="h-4 w-4 mr-2" /> Edit Content
            </Button>
          </Link>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            <Button className="rounded-2xl">
              <Eye className="h-4 w-4 mr-2" /> View Live Page
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </a>
        </div>
      </div>

      {/* Preview Container */}
      <div className="rounded-3xl border overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Banner */}
        <div className="relative h-48 overflow-hidden">
          {game.bannerUrl ? (
            <img 
              src={game.bannerUrl} 
              alt={game.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-purple-600 to-indigo-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="px-6 -mt-16 relative z-10 pb-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-800 border-4 border-slate-900 shadow-xl flex-shrink-0">
              {game.logoUrl ? (
                <img src={game.logoUrl} alt={game.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
                  <Gamepad2 className="h-10 w-10 text-white/80" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pt-2">
              <h1 className="text-2xl font-bold text-white mb-1">{game.name}</h1>
              <div className="flex flex-wrap items-center gap-2 text-white/60 text-sm mb-3">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {developerName}
                </span>
                {game.genre && (
                  <Badge variant="secondary" className="rounded-full bg-white/10 text-white/80 text-xs">
                    {game.genre}
                  </Badge>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {new Date(game.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Tags */}
              {game.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {game.tags.slice(0, 5).map(tag => (
                    <Badge key={tag} variant="outline" className="rounded-full border-white/20 text-white/70 text-xs">
                      <Tag className="h-2 w-2 mr-1" /> {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-2">
                {game.steamUrl && (
                  <Button size="sm" className="rounded-xl bg-[#1b2838] hover:bg-[#2a475e] h-7 text-xs">
                    Steam <ExternalLink className="h-2 w-2 ml-1" />
                  </Button>
                )}
                {game.itchUrl && (
                  <Button size="sm" className="rounded-xl bg-[#fa5c5c] hover:bg-[#ff7676] h-7 text-xs">
                    Itch.io <ExternalLink className="h-2 w-2 ml-1" />
                  </Button>
                )}
                {game.websiteUrl && (
                  <Button size="sm" variant="outline" className="rounded-xl border-white/20 text-white hover:bg-white/10 h-7 text-xs">
                    <Globe className="h-3 w-3 mr-1" /> Website
                  </Button>
                )}
                {game.discordUrl && (
                  <Button size="sm" className="rounded-xl bg-[#5865F2] hover:bg-[#6d79f5] h-7 text-xs">
                    Discord <ExternalLink className="h-2 w-2 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sections Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* About */}
            {game.description && (
              <Card className="rounded-2xl bg-white/5 border-white/10">
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-white/80">About</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-white/70 text-xs line-clamp-3">{game.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            {game.features && game.features.length > 0 && (
              <Card className="rounded-2xl bg-white/5 border-white/10">
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-white/80 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="space-y-1">
                    {game.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-white/70 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        {feature}
                      </div>
                    ))}
                    {game.features.length > 3 && (
                      <div className="text-white/50 text-xs">+{game.features.length - 3} more</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rules */}
            {game.rules && (
              <Card className="rounded-2xl bg-white/5 border-white/10">
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-white/80 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> How to Play
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-white/70 text-xs line-clamp-3">{game.rules}</p>
                </CardContent>
              </Card>
            )}

            {/* Updates */}
            <Card className="rounded-2xl bg-white/5 border-white/10">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-xs text-white/80 flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Updates
                  <Badge variant="secondary" className="rounded-full bg-white/10 text-white/60 text-xs ml-1">
                    {game._count.updates}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                {game.updates.length > 0 ? (
                  <div className="space-y-1">
                    {game.updates.slice(0, 3).map((update) => (
                      <div key={update.id} className="text-white/70 text-xs truncate">
                        {update.title}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/50 text-xs">No updates yet</p>
                )}
              </CardContent>
            </Card>

            {/* Versions */}
            <Card className="rounded-2xl bg-white/5 border-white/10">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-xs text-white/80 flex items-center gap-1">
                  <GitBranch className="h-3 w-3" /> Versions
                  <Badge variant="secondary" className="rounded-full bg-white/10 text-white/60 text-xs ml-1">
                    {game._count.versions}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                {game.versions.length > 0 ? (
                  <div className="space-y-1">
                    {game.versions.slice(0, 2).map((version) => (
                      <div key={version.id} className="flex items-center gap-2 text-xs">
                        <Badge className="rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs">
                          {version.version}
                        </Badge>
                        <span className="text-white/70 truncate">{version.title}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/50 text-xs">No versions yet</p>
                )}
              </CardContent>
            </Card>

            {/* Feedback */}
            <Card className="rounded-2xl bg-white/5 border-white/10">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-xs text-white/80 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Feedback Forms
                  <Badge variant="secondary" className="rounded-full bg-white/10 text-white/60 text-xs ml-1">
                    {game._count.forms}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                {game.forms.length > 0 ? (
                  <div className="space-y-1">
                    {game.forms.slice(0, 2).map((form) => (
                      <div key={form.id} className="text-white/70 text-xs truncate">
                        {form.title}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/50 text-xs">No active forms</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
