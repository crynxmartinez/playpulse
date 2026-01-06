'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Compass, Search, Gamepad2, User, Tag, Filter, X, Sparkles, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import StarsBackground from '@/components/ui/stars-background'

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
  user: {
    displayName: string | null
    username: string | null
    studioName: string | null
  }
  _count: {
    forms: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function PublicDiscoverPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [games, setGames] = useState<Game[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [genres, setGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')

  useEffect(() => {
    fetchGames()
  }, [searchParams])

  const fetchGames = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      const searchQuery = searchParams.get('search')
      const genreQuery = searchParams.get('genre')
      const sortQuery = searchParams.get('sort')
      
      if (searchQuery) params.set('search', searchQuery)
      if (genreQuery) params.set('genre', genreQuery)
      if (sortQuery) params.set('sort', sortQuery)

      const res = await fetch(`/api/games?${params.toString()}`)
      const data = await res.json()
      
      if (res.ok) {
        setGames(data.games)
        setPagination(data.pagination)
        setGenres(data.filters.genres)
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
    if (sort !== 'newest') params.set('sort', sort)
    router.push(`/discover?${params.toString()}`)
  }

  const handleGenreFilter = (genre: string) => {
    const newGenre = selectedGenre === genre ? '' : genre
    setSelectedGenre(newGenre)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (newGenre) params.set('genre', newGenre)
    if (sort !== 'newest') params.set('sort', sort)
    router.push(`/discover?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedGenre('')
    setSort('newest')
    router.push('/discover')
  }

  const hasFilters = search || selectedGenre || sort !== 'newest'

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      <StarsBackground starCount={100} />
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#2a2a3e] bg-[#0a0a0f]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#2a2a3e] bg-[#1a1a2e]">
              <Sparkles className="h-4 w-4 text-purple-500" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold leading-none text-white">PlayPulse</div>
              <div className="text-xs text-slate-400">Discover Games</div>
            </div>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm" className="rounded-xl border-[#2a2a3e] text-white hover:bg-[#1a1a2e]">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-xl">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Discover Games</h1>
          <p className="text-slate-400">Find games looking for playtesters and give feedback.</p>
        </div>

        {/* Search & Filters */}
        <Card className="rounded-3xl bg-[#0d0d15] border-[#1a1a2e] mb-6">
          <CardContent className="pt-6 space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search games, studios..."
                className="rounded-2xl bg-[#1a1a2e] border-[#2a2a3e] text-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button type="submit" className="rounded-2xl">
                <Search className="mr-2 h-4 w-4" /> Search
              </Button>
            </form>

            {/* Genre Filters */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-slate-400 flex items-center gap-1">
                  <Filter className="h-4 w-4" /> Genre:
                </span>
                {genres.map(genre => (
                  <Badge
                    key={genre}
                    variant={selectedGenre === genre ? 'default' : 'secondary'}
                    className="rounded-full cursor-pointer"
                    onClick={() => handleGenreFilter(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            {/* Active Filters */}
            {hasFilters && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Active filters:</span>
                {search && (
                  <Badge variant="outline" className="rounded-full border-[#2a2a3e] text-white">
                    Search: {search}
                  </Badge>
                )}
                {selectedGenre && (
                  <Badge variant="outline" className="rounded-full border-[#2a2a3e] text-white">
                    Genre: {selectedGenre}
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="rounded-full h-6 px-2 text-slate-400 hover:text-white" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" /> Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : games.length === 0 ? (
          <Card className="rounded-3xl bg-[#0d0d15] border-[#1a1a2e]">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <Compass className="h-8 w-8 text-purple-500" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-white">No Games Found</h2>
              <p className="text-slate-400 max-w-md mx-auto">
                {hasFilters 
                  ? 'Try adjusting your search or filters to find more games.'
                  : 'No public games are available yet. Check back later!'}
              </p>
              {hasFilters && (
                <Button variant="outline" className="rounded-2xl mt-4 border-[#2a2a3e] text-white hover:bg-[#1a1a2e]" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Results count */}
            <div className="text-sm text-slate-400 mb-4">
              Showing {games.length} of {pagination?.total || 0} games
            </div>

            {/* Games Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map(game => {
                const developerName = game.user.studioName || game.user.displayName || game.user.username || 'Unknown'
                return (
                  <Link key={game.id} href={`/g/${game.slug}`}>
                    <Card className="rounded-3xl overflow-hidden bg-[#0d0d15] border-[#1a1a2e] hover:border-purple-500/50 transition group cursor-pointer h-full">
                      {/* Banner */}
                      <div className="h-32 relative overflow-hidden">
                        {game.bannerUrl ? (
                          <img 
                            src={game.bannerUrl} 
                            alt={game.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-purple-500 to-indigo-600" />
                        )}
                        {/* Logo overlay */}
                        <div className="absolute -bottom-6 left-4">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0d0d15] border-2 border-[#0d0d15] shadow-lg">
                            {game.logoUrl ? (
                              <img src={game.logoUrl} alt={game.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
                                <Gamepad2 className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <CardContent className="pt-8 pb-4">
                        <h3 className="font-semibold text-lg mb-1 text-white group-hover:text-purple-400 transition">{game.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                          <User className="h-3 w-3" /> {developerName}
                        </div>
                        {game.description && (
                          <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                            {game.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {game.genre && (
                            <Badge variant="secondary" className="rounded-full text-xs bg-white/10 text-white/80">
                              {game.genre}
                            </Badge>
                          )}
                          {game.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="rounded-full text-xs border-white/20 text-white/60">
                              <Tag className="h-2 w-2 mr-1" /> {tag}
                            </Badge>
                          ))}
                          {game._count.forms > 0 && (
                            <Badge variant="default" className="rounded-full text-xs bg-green-500">
                              {game._count.forms} form{game._count.forms > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-8">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={page === pagination.page ? 'default' : 'outline'}
                    size="sm"
                    className={`rounded-full w-10 h-10 ${page !== pagination.page ? 'border-[#2a2a3e] text-white hover:bg-[#1a1a2e]' : ''}`}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString())
                      params.set('page', page.toString())
                      router.push(`/discover?${params.toString()}`)
                    }}
                  >
                    {page}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a2e] py-8 text-center text-slate-500 text-sm">
        Powered by <Link href="/" className="text-purple-400 hover:text-purple-300">PlayPulse</Link>
      </footer>
    </div>
  )
}
