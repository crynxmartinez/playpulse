import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/games/[slug] - Get public game by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const project = await prisma.project.findFirst({
      where: {
        slug: slug,
        visibility: {
          in: ['PUBLIC', 'UNLISTED']
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        visibility: true,
        bannerUrl: true,
        logoUrl: true,
        genre: true,
        tags: true,
        steamUrl: true,
        itchUrl: true,
        websiteUrl: true,
        discordUrl: true,
        rules: true,
        features: true,
        createdAt: true,
        user: {
          select: {
            displayName: true,
            username: true,
            studioName: true,
            avatarUrl: true,
          }
        },
        forms: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            title: true,
            slug: true,
          }
        },
        versions: {
          where: {
            isPublished: true
          },
          select: {
            id: true,
            version: true,
            title: true,
            content: true,
            changelog: true,
            imageUrl: true,
            publishedAt: true,
          },
          orderBy: {
            publishedAt: 'desc'
          }
        },
        updates: {
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 50
        },
        _count: {
          select: {
            forms: true,
            stats: true,
            versions: true,
            updates: true,
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    return NextResponse.json({ game: project })
  } catch (error) {
    console.error('Failed to fetch game:', error)
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 })
  }
}
