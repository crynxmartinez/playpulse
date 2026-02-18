import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/games - List public games with optional sections for discovery
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const genre = searchParams.get('genre') || ''
    const tag = searchParams.get('tag') || ''
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sections = searchParams.get('sections') === 'true'

    const baseSelect = {
      id: true,
      name: true,
      description: true,
      slug: true,
      bannerUrl: true,
      logoUrl: true,
      genre: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          displayName: true,
          username: true,
          studioName: true,
        }
      },
      _count: {
        select: {
          forms: true,
          followers: true,
        }
      },
      forms: {
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          _count: { select: { responses: true } }
        },
        take: 1
      }
    }

    // If sections=true, return curated sections for discovery homepage
    if (sections) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const [trending, recentlyUpdated, lookingForTesters, newGames] = await Promise.all([
        // Trending: Games with most responses in last 30 days
        prisma.project.findMany({
          where: { visibility: 'PUBLIC' },
          select: {
            ...baseSelect,
            forms: {
              select: {
                id: true,
                title: true,
                isActive: true,
                _count: { select: { responses: true } },
                responses: {
                  where: { createdAt: { gte: thirtyDaysAgo } },
                  select: { id: true }
                }
              }
            }
          },
          take: 20,
        }).then(games => {
          // Calculate trending score: recent responses + recency bonus
          return games
            .map(game => {
              const recentResponses = game.forms.reduce((sum, f) => sum + f.responses.length, 0)
              const totalResponses = game.forms.reduce((sum, f) => sum + f._count.responses, 0)
              const daysSinceUpdate = Math.floor((Date.now() - new Date(game.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
              const recencyBonus = Math.max(0, 30 - daysSinceUpdate) / 30
              const score = recentResponses * 2 + totalResponses * 0.5 + recencyBonus * 10 + game._count.followers * 0.3
              return { ...game, trendingScore: score, recentResponses, totalResponses }
            })
            .sort((a, b) => b.trendingScore - a.trendingScore)
            .slice(0, 6)
            .map(({ forms, trendingScore, recentResponses, totalResponses, ...game }) => ({
              ...game,
              _count: { ...game._count, forms: forms.length },
              forms: forms.filter(f => f.isActive).slice(0, 1).map(({ responses, ...f }) => f),
              stats: { recentResponses, totalResponses }
            }))
        }),

        // Recently Updated: Games updated in last 14 days
        prisma.project.findMany({
          where: {
            visibility: 'PUBLIC',
            updatedAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
          },
          select: baseSelect,
          orderBy: { updatedAt: 'desc' },
          take: 6,
        }),

        // Looking for Testers: Games with active forms
        prisma.project.findMany({
          where: {
            visibility: 'PUBLIC',
            forms: { some: { isActive: true } }
          },
          select: baseSelect,
          orderBy: { updatedAt: 'desc' },
          take: 6,
        }),

        // New Games: Recently created
        prisma.project.findMany({
          where: { visibility: 'PUBLIC' },
          select: baseSelect,
          orderBy: { createdAt: 'desc' },
          take: 6,
        }),
      ])

      // Get unique genres and tags for filters
      const [genresData, tagsData] = await Promise.all([
        prisma.project.findMany({
          where: { visibility: 'PUBLIC' },
          select: { genre: true },
          distinct: ['genre'],
        }),
        prisma.project.findMany({
          where: { visibility: 'PUBLIC' },
          select: { tags: true },
        }),
      ])

      const uniqueGenres = genresData
        .map(g => g.genre)
        .filter((g): g is string => g !== null && g !== '')
        .sort()

      const uniqueTags = [...new Set(tagsData.flatMap(g => g.tags || []))]
        .filter(t => t !== '')
        .sort()
        .slice(0, 20)

      return NextResponse.json({
        sections: {
          trending,
          recentlyUpdated,
          lookingForTesters,
          newGames,
        },
        filters: {
          genres: uniqueGenres,
          tags: uniqueTags,
        }
      })
    }

    // Regular paginated search
    const where: Record<string, unknown> = {
      visibility: 'PUBLIC'
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { studioName: { contains: search, mode: 'insensitive' } } },
        { user: { displayName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (genre) {
      where.genre = genre
    }

    if (tag) {
      where.tags = { has: tag }
    }

    let orderBy: Record<string, string> = { createdAt: 'desc' }
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' }
    } else if (sort === 'name') {
      orderBy = { name: 'asc' }
    } else if (sort === 'updated') {
      orderBy = { updatedAt: 'desc' }
    }

    const [games, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: baseSelect,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.project.count({ where })
    ])

    const genres = await prisma.project.findMany({
      where: { visibility: 'PUBLIC' },
      select: { genre: true },
      distinct: ['genre'],
    })

    const uniqueGenres = genres
      .map(g => g.genre)
      .filter((g): g is string => g !== null)
      .sort()

    return NextResponse.json({
      games,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        genres: uniqueGenres
      }
    })
  } catch (error) {
    console.error('Failed to fetch games:', error)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}
