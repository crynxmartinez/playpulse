import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/games/[slug] - Get public game by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const user = await getCurrentUser()

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    // First try to find the project
    const project = await prisma.project.findFirst({
      where: {
        slug: slug,
      },
      select: {
        id: true,
        userId: true,
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
            description: true,
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
            followers: true,
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Check access: owner can always view, others need PUBLIC or UNLISTED
    const isOwner = user && project.userId === user.id
    const isPubliclyVisible = project.visibility === 'PUBLIC' || project.visibility === 'UNLISTED'
    
    if (!isOwner && !isPubliclyVisible) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Get total form response count for this project
    const formResponseCount = await prisma.response.count({
      where: {
        form: {
          projectId: project.id
        }
      }
    })

    return NextResponse.json({ 
      game: { 
        ...project, 
        formResponseCount 
      }, 
      isOwner 
    })
  } catch (error) {
    console.error('Failed to fetch game:', error)
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 })
  }
}
