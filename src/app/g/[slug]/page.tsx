'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Gamepad2, 
  Globe, 
  ExternalLink, 
  MessageSquare,
  Tag,
  User,
  Calendar,
  ArrowLeft,
  BookOpen,
  Sparkles,
  GitBranch,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import StarsBackground from '@/components/ui/stars-background'

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
  visibility: 'PUBLIC' | 'UNLISTED'
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

export default function PublicGamePage() {
  const params = useParams()
  const slug = params.slug as string

  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      fetchGame()
    }
  }, [slug])

  const fetchGame = async () => {
    try {
      const res = await fetch(`/api/games/${slug}`)
      const data = await res.json()
      
      if (res.ok) {
        setGame(data.game)
      } else {
        setError(data.error || 'Game not found')
      }
    } catch (err) {
      setError('Failed to load game')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative">
        <StarsBackground starCount={100} />
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin relative z-10" />
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center text-white relative">
        <StarsBackground starCount={100} />
        <div className="relative z-10 text-center">
          <Gamepad2 className="h-16 w-16 mb-4 opacity-50 mx-auto" />
          <h1 className="text-2xl font-bold mb-2">Game Not Found</h1>
          <p className="text-white/60 mb-6">{error || 'This game does not exist or is private.'}</p>
          <Link href="/">
            <Button variant="outline" className="rounded-2xl border-[#2a2a3e] text-white hover:bg-[#1a1a2e]">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const developerName = game.user.studioName || game.user.displayName || game.user.username || 'Unknown Developer'

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      <StarsBackground starCount={100} />
      {/* Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {game.bannerUrl ? (
          <img 
            src={game.bannerUrl} 
            alt={game.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-600 to-indigo-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent" />
        
        {/* Back button */}
        <div className="absolute top-4 left-4">
          <Link href="/dashboard/discover">
            <Button variant="outline" size="sm" className="rounded-2xl bg-black/30 border-white/20 text-white hover:bg-black/50 backdrop-blur-sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Discover
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-24 relative z-10 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Logo */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden bg-[#1a1a2e] border-4 border-[#0a0a0f] shadow-xl flex-shrink-0">
            {game.logoUrl ? (
              <img src={game.logoUrl} alt={game.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
                <Gamepad2 className="h-16 w-16 text-white/80" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pt-4 md:pt-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{game.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-white/60 text-sm mb-4">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" /> {developerName}
              </span>
              {game.genre && (
                <Badge variant="secondary" className="rounded-full bg-white/10 text-white/80">
                  {game.genre}
                </Badge>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {new Date(game.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Tags */}
            {game.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {game.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="rounded-full border-white/20 text-white/70">
                    <Tag className="h-3 w-3 mr-1" /> {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-2">
              {game.steamUrl && (
                <a href={game.steamUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="rounded-2xl bg-[#1b2838] hover:bg-[#2a475e]">
                    Steam <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </a>
              )}
              {game.itchUrl && (
                <a href={game.itchUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="rounded-2xl bg-[#fa5c5c] hover:bg-[#ff7676]">
                    Itch.io <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </a>
              )}
              {game.websiteUrl && (
                <a href={game.websiteUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="rounded-2xl border-white/20 text-white hover:bg-white/10">
                    <Globe className="h-4 w-4 mr-1" /> Website
                  </Button>
                </a>
              )}
              {game.discordUrl && (
                <a href={game.discordUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="rounded-2xl bg-[#5865F2] hover:bg-[#6d79f5]">
                    Discord <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {game.description && (
          <Card className="rounded-3xl bg-[#0d0d15] border-[#1a1a2e] mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/80">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70 whitespace-pre-wrap">{game.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Key Features */}
        {game.features && game.features.length > 0 && (
          <Card className="rounded-3xl bg-[#0d0d15] border-[#1a1a2e] mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/80 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Key Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {game.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-white/70">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    {feature}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Game Rules */}
        {game.rules && (
          <Card className="rounded-3xl bg-[#0d0d15] border-[#1a1a2e] mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/80 flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> How to Play
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-white/70 whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                {game.rules}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Updates Timeline (GitHub-style) */}
        {game.updates && game.updates.length > 0 && (
          <Card className="rounded-3xl bg-[#0d0d15] border-[#1a1a2e] mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/80 flex items-center gap-2">
                <Activity className="h-4 w-4" /> Updates
                <Badge variant="secondary" className="rounded-full bg-white/10 text-white/60 ml-2">
                  {game._count.updates} total
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mini contribution graph */}
              <div className="mb-4 p-3 rounded-xl bg-white/5">
                <div className="flex gap-0.5 flex-wrap">
                  {(() => {
                    const today = new Date()
                    const days = []
                    for (let i = 364; i >= 0; i--) {
                      const date = new Date(today)
                      date.setDate(date.getDate() - i)
                      const dateStr = date.toISOString().split('T')[0]
                      const count = game.updates.filter(u => 
                        u.createdAt.split('T')[0] === dateStr
                      ).length
                      days.push({ date: dateStr, count })
                    }
                    // Show last 52 weeks (simplified)
                    return days.slice(-182).map((day, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-sm ${
                          day.count === 0 ? 'bg-white/10' :
                          day.count === 1 ? 'bg-green-700' :
                          day.count === 2 ? 'bg-green-600' :
                          day.count >= 3 ? 'bg-green-500' : 'bg-white/10'
                        }`}
                        title={`${day.date}: ${day.count} update${day.count !== 1 ? 's' : ''}`}
                      />
                    ))
                  })()}
                </div>
                <div className="flex items-center justify-end gap-1 mt-2 text-xs text-white/40">
                  <span>Less</span>
                  <div className="w-2 h-2 rounded-sm bg-white/10" />
                  <div className="w-2 h-2 rounded-sm bg-green-700" />
                  <div className="w-2 h-2 rounded-sm bg-green-600" />
                  <div className="w-2 h-2 rounded-sm bg-green-500" />
                  <span>More</span>
                </div>
              </div>

              {/* Recent updates list */}
              <div className="space-y-3">
                {game.updates.slice(0, 10).map((update) => (
                  <div key={update.id} className="flex items-start gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      {update.type === 'VERSION_RELEASE' ? <GitBranch className="h-4 w-4 text-green-400" /> :
                       update.type === 'RULES_UPDATED' ? <BookOpen className="h-4 w-4 text-blue-400" /> :
                       update.type === 'FORM_CREATED' ? <MessageSquare className="h-4 w-4 text-purple-400" /> :
                       <Activity className="h-4 w-4 text-white/60" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white/80">{update.title}</div>
                      {update.description && (
                        <div className="text-white/50 text-xs truncate">{update.description}</div>
                      )}
                    </div>
                    <div className="text-white/40 text-xs flex-shrink-0">
                      {new Date(update.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Game Versions */}
        {game.versions && game.versions.length > 0 && (
          <Card className="rounded-3xl bg-[#0d0d15] border-[#1a1a2e] mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/80 flex items-center gap-2">
                <GitBranch className="h-4 w-4" /> Versions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {game.versions.map((version, idx) => (
                  <div key={version.id} className={`relative pl-6 ${idx !== game.versions.length - 1 ? 'pb-4 border-l-2 border-white/10 ml-3' : 'ml-3'}`}>
                    {/* Version dot */}
                    <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-500 border-2 border-slate-900" />
                    
                    <div className="bg-white/5 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="rounded-full bg-purple-500/20 text-purple-300 font-mono">
                          {version.version}
                        </Badge>
                        <span className="font-medium text-white">{version.title}</span>
                        {version.publishedAt && (
                          <span className="text-white/40 text-xs ml-auto">
                            {new Date(version.publishedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      {version.content && (
                        <p className="text-white/60 text-sm mb-2">{version.content}</p>
                      )}
                      
                      {version.changelog && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <div className="text-xs text-white/40 mb-1">Changelog:</div>
                          <pre className="text-white/60 text-xs whitespace-pre-wrap font-mono bg-white/5 rounded-lg p-2">
                            {version.changelog}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback Forms */}
        {game.forms.length > 0 && (
          <Card className="rounded-3xl bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/80 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Give Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/60 text-sm mb-4">
                Help improve this game by sharing your feedback!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {game.forms.map(form => (
                  <Link key={form.id} href={`/f/${form.slug || form.id}`}>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition cursor-pointer">
                      <div className="font-medium text-white">{form.title}</div>
                      <div className="text-sm text-white/50">Click to submit feedback</div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No forms message */}
        {game.forms.length === 0 && (
          <Card className="rounded-3xl bg-white/5 border-white/10">
            <CardContent className="py-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-white/30" />
              <p className="text-white/60">No feedback forms available yet.</p>
              <p className="text-white/40 text-sm">Check back later!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 py-6 text-center text-white/40 text-sm">
        Powered by <Link href="/" className="text-purple-400 hover:text-purple-300">PlayPulse</Link>
      </div>
    </div>
  )
}
