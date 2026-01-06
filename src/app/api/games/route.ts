import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/games - List public games
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const genre = searchParams.get('genre') || ''
    const tag = searchParams.get('tag') || ''
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    const where: Record<string, unknown> = {
      visibility: 'PUBLIC'
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Genre filter
    if (genre) {
      where.genre = genre
    }

    // Tag filter
    if (tag) {
      where.tags = { has: tag }
    }

    // Sort order
    let orderBy: Record<string, string> = { createdAt: 'desc' }
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' }
    } else if (sort === 'name') {
      orderBy = { name: 'asc' }
    }

    const [games, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          bannerUrl: true,
          logoUrl: true,
          genre: true,
          tags: true,
          createdAt: true,
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
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.project.count({ where })
    ])

    // Get unique genres for filter
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
