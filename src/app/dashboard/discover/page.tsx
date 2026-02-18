'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Compass, Search, Gamepad2, User, Tag, Filter, X, 
  TrendingUp, Clock, Users, Sparkles, ChevronRight, Flame
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { stripHtml } from '@/lib/utils'

interface Game {
  id: string
  name: string
  description: string | null
  slug: string
  bannerUrl: string | null
  logoUrl: string | null
  genre: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
  user: {
    displayName: string | null
    username: string | null
    studioName: string | null
  }
  _count: {
    forms: number
    followers: number
  }
  forms?: {
    id: string
    title: string
    _count: { responses: number }
  }[]
  stats?: {
    recentResponses: number
    totalResponses: number
  }
}

interface Sections {
  trending: Game[]
  recentlyUpdated: Game[]
  lookingForTesters: Game[]
  newGames: Game[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Game Card Component
function GameCard({ game, showBadge }: { game: Game; showBadge?: 'trending' | 'active' | 'new' }) {
  const developerName = game.user.studioName || game.user.displayName || game.user.username || 'Unknown'
  const activeForm = game.forms?.[0]
  
  return (
    <Link href={game.slug ? `/g/${game.slug}` : `/game/${game.id}`}>
      <Card className="rounded-3xl overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group cursor-pointer h-full border-[#1a1a2e] bg-[#0d0d15]/50 hover:border-primary/30">
        {/* Banner */}
        <div className="h-28 relative overflow-hidden">
          {game.bannerUrl ? (
            <img 
              src={game.bannerUrl} 
              alt={game.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600/40 to-indigo-600/40" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d15] via-transparent to-transparent" />
          
          {/* Badge */}
          {showBadge && (
            <div className="absolute top-2 right-2">
              {showBadge === 'trending' && (
                <Badge className="rounded-full text-xs bg-orange-500/90 text-white border-0">
                  <Flame className="h-3 w-3 mr-1" /> Trending
                </Badge>
              )}
              {showBadge === 'active' && (
                <Badge className="rounded-full text-xs bg-green-500/90 text-white border-0">
                  <Users className="h-3 w-3 mr-1" /> Seeking Testers
                </Badge>
              )}
              {showBadge === 'new' && (
                <Badge className="rounded-full text-xs bg-blue-500/90 text-white border-0">
                  <Sparkles className="h-3 w-3 mr-1" /> New
                </Badge>
              )}
            </div>
          )}
          
          {/* Logo overlay */}
          <div className="absolute -bottom-5 left-3 z-10">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#0d0d15] border-2 border-[#1a1a2e] shadow-lg">
              {game.logoUrl ? (
                <img src={game.logoUrl} alt={game.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
                  <Gamepad2 className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        <CardContent className="pt-7 pb-4 px-4">
          <h3 className="font-semibold text-base mb-1 text-white group-hover:text-primary transition line-clamp-1">{game.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <User className="h-3 w-3" /> {developerName}
          </div>
          {game.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {stripHtml(game.description)}
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            {game.genre && (
              <Badge variant="secondary" className="rounded-full text-xs bg-[#1a1a2e] text-muted-foreground border-0">
                {game.genre}
              </Badge>
            )}
            {game.tags?.slice(0, 1).map(tag => (
              <Badge key={tag} variant="outline" className="rounded-full text-xs border-[#2a2a3e] text-muted-foreground">
                {tag}
              </Badge>
            ))}
            {activeForm && (
              <Badge variant="default" className="rounded-full text-xs bg-green-500/20 text-green-400 border-0">
                {activeForm._count.responses} responses
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Section Header Component
function SectionHeader({ 
  icon: Icon, 
  title, 
  subtitle,
  onViewAll 
}: { 
  icon: React.ElementType
  title: string
  subtitle: string
  onViewAll?: () => void 
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {onViewAll && (
        <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-white" onClick={onViewAll}>
          View all <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  )
}

export default function DiscoverPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Section-based view (homepage)
  const [sections, setSections] = useState<Sections | null>(null)
  
  // Search results view
  const [games, setGames] = useState<Game[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  
  const [genres, setGenres] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '')
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')

  const isSearchMode = searchParams.get('search') || searchParams.get('genre') || searchParams.get('tag')

  useEffect(() => {
    if (isSearchMode) {
      fetchSearchResults()
    } else {
      fetchSections()
    }
  }, [searchParams])

  const fetchSections = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/games?sections=true')
      const data = await res.json()
      
      if (res.ok) {
        setSections(data.sections)
        setGenres(data.filters.genres || [])
        setTags(data.filters.tags || [])
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSearchResults = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      const searchQuery = searchParams.get('search')
      const genreQuery = searchParams.get('genre')
      const tagQuery = searchParams.get('tag')
      const sortQuery = searchParams.get('sort')
      const pageQuery = searchParams.get('page')
      
      if (searchQuery) params.set('search', searchQuery)
      if (genreQuery) params.set('genre', genreQuery)
      if (tagQuery) params.set('tag', tagQuery)
      if (sortQuery) params.set('sort', sortQuery)
      if (pageQuery) params.set('page', pageQuery)

      const res = await fetch(`/api/games?${params.toString()}`)
      const data = await res.json()
      
      if (res.ok) {
        setGames(data.games)
        setPagination(data.pagination)
        setGenres(data.filters.genres || [])
      }
    } catch (error) {
      console.error('Failed to fetch games:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (selectedGenre) params.set('genre', selectedGenre)
    if (selectedTag) params.set('tag', selectedTag)
    if (sort !== 'newest') params.set('sort', sort)
    router.push(`/dashboard/discover?${params.toString()}`)
  }

  const handleGenreFilter = (genre: string) => {
    const newGenre = selectedGenre === genre ? '' : genre
    setSelectedGenre(newGenre)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (newGenre) params.set('genre', newGenre)
    if (selectedTag) params.set('tag', selectedTag)
    router.push(`/dashboard/discover?${params.toString()}`)
  }

  const handleTagFilter = (tag: string) => {
    const newTag = selectedTag === tag ? '' : tag
    setSelectedTag(newTag)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (selectedGenre) params.set('genre', selectedGenre)
    if (newTag) params.set('tag', newTag)
    router.push(`/dashboard/discover?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedGenre('')
    setSelectedTag('')
    setSort('newest')
    router.push('/dashboard/discover')
  }

  const hasFilters = search || selectedGenre || selectedTag || sort !== 'newest'

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-bold text-white">Discover</div>
          <div className="text-sm text-muted-foreground">Find games looking for playtesters</div>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="rounded-3xl border-[#1a1a2e] bg-[#0d0d15]/80">
        <CardContent className="pt-5 pb-5 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search games, studios, tags..."
                className="rounded-2xl pl-10 bg-[#1a1a2e] border-[#2a2a3e]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" className="rounded-2xl">
              Search
            </Button>
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            {genres.slice(0, 6).map(genre => (
              <Badge
                key={genre}
                variant={selectedGenre === genre ? 'default' : 'secondary'}
                className={`rounded-full cursor-pointer transition ${
                  selectedGenre === genre 
                    ? 'bg-primary text-white' 
                    : 'bg-[#1a1a2e] text-muted-foreground hover:bg-[#2a2a3e] hover:text-white'
                }`}
                onClick={() => handleGenreFilter(genre)}
              >
                {genre}
              </Badge>
            ))}
            {tags.slice(0, 4).map(tag => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'}
                className={`rounded-full cursor-pointer transition ${
                  selectedTag === tag 
                    ? 'bg-primary text-white border-primary' 
                    : 'border-[#2a2a3e] text-muted-foreground hover:border-primary/50 hover:text-white'
                }`}
                onClick={() => handleTagFilter(tag)}
              >
                <Tag className="h-3 w-3 mr-1" /> {tag}
              </Badge>
            ))}
          </div>

          {/* Active Filters */}
          {hasFilters && (
            <div className="flex items-center gap-2 pt-2 border-t border-[#1a1a2e]">
              <span className="text-xs text-muted-foreground">Filters:</span>
              {search && (
                <Badge variant="outline" className="rounded-full text-xs border-primary/50 text-primary">
                  "{search}"
                </Badge>
              )}
              {selectedGenre && (
                <Badge variant="outline" className="rounded-full text-xs border-primary/50 text-primary">
                  {selectedGenre}
                </Badge>
              )}
              {selectedTag && (
                <Badge variant="outline" className="rounded-full text-xs border-primary/50 text-primary">
                  #{selectedTag}
                </Badge>
              )}
              <Button variant="ghost" size="sm" className="rounded-full h-6 px-2 text-xs text-muted-foreground hover:text-white" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      {isSearchMode ? (
        // Search Results View
        <>
          {games.length === 0 ? (
            <Card className="rounded-3xl border-[#1a1a2e] bg-[#0d0d15]/50">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Compass className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-2 text-white">No Games Found</h2>
                <p className="text-muted-foreground max-w-md mx-auto text-sm">
                  Try adjusting your search or filters to find more games.
                </p>
                <Button variant="outline" className="rounded-2xl mt-4 border-[#2a2a3e]" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Found {pagination?.total || games.length} games
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {games.map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
              
              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={page === pagination.page ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-full w-10 h-10 border-[#2a2a3e]"
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString())
                        params.set('page', page.toString())
                        router.push(`/dashboard/discover?${params.toString()}`)
                      }}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        // Sections View (Homepage)
        sections && (
          <div className="space-y-8">
            {/* Trending Section */}
            {sections.trending.length > 0 && (
              <section>
                <SectionHeader 
                  icon={TrendingUp} 
                  title="Trending" 
                  subtitle="Most active games this month"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sections.trending.slice(0, 4).map(game => (
                    <GameCard key={game.id} game={game} showBadge="trending" />
                  ))}
                </div>
              </section>
            )}

            {/* Looking for Testers Section */}
            {sections.lookingForTesters.length > 0 && (
              <section>
                <SectionHeader 
                  icon={Users} 
                  title="Looking for Testers" 
                  subtitle="Games with active playtest campaigns"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sections.lookingForTesters.slice(0, 4).map(game => (
                    <GameCard key={game.id} game={game} showBadge="active" />
                  ))}
                </div>
              </section>
            )}

            {/* Recently Updated Section */}
            {sections.recentlyUpdated.length > 0 && (
              <section>
                <SectionHeader 
                  icon={Clock} 
                  title="Recently Updated" 
                  subtitle="Fresh updates in the last 2 weeks"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sections.recentlyUpdated.slice(0, 4).map(game => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </section>
            )}

            {/* New Games Section */}
            {sections.newGames.length > 0 && (
              <section>
                <SectionHeader 
                  icon={Sparkles} 
                  title="New on PatchPlay" 
                  subtitle="Recently added games"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sections.newGames.slice(0, 4).map(game => (
                    <GameCard key={game.id} game={game} showBadge="new" />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {!sections.trending.length && !sections.lookingForTesters.length && !sections.recentlyUpdated.length && !sections.newGames.length && (
              <Card className="rounded-3xl border-[#1a1a2e] bg-[#0d0d15]/50">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Compass className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold mb-2 text-white">No Games Yet</h2>
                  <p className="text-muted-foreground max-w-md mx-auto text-sm">
                    Be the first to publish a game on PatchPlay!
                  </p>
                  <Button className="rounded-2xl mt-4" asChild>
                    <Link href="/dashboard/games/new">Create a Game</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )
      )}
    </div>
  )
}
