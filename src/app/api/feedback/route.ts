import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const db = prisma as any

// GET /api/feedback - Get all feature requests
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'votes' // votes, newest, oldest

    const where: any = {}
    if (status && status !== 'all') where.status = status
    if (category && category !== 'all') where.category = category

    const features = await db.featureRequest.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
          }
        },
        votes: {
          select: { userId: true }
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: sort === 'newest' 
        ? { createdAt: 'desc' }
        : sort === 'oldest'
        ? { createdAt: 'asc' }
        : undefined
    })

    // Sort by votes if needed
    let sortedFeatures = features
    if (sort === 'votes') {
      sortedFeatures = features.sort((a: any, b: any) => b.votes.length - a.votes.length)
    }

    // Add vote count and format response
    const formatted = sortedFeatures.map((f: any) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      category: f.category,
      status: f.status,
      isPinned: f.isPinned,
      author: f.author,
      voteCount: f.votes.length,
      voterIds: f.votes.map((v: any) => v.userId),
      commentCount: f._count.comments,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }))

    // Put pinned items first
    formatted.sort((a: any, b: any) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return 0
    })

    return NextResponse.json({ features: formatted })
  } catch (error) {
    console.error('Failed to fetch features:', error)
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 })
  }
}

// POST /api/feedback - Create new feature request
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, category } = await request.json()

    if (!title || title.trim().length < 5) {
      return NextResponse.json({ error: 'Title must be at least 5 characters' }, { status: 400 })
    }

    const feature = await db.featureRequest.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        category: category || 'OTHER',
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
          }
        }
      }
    })

    return NextResponse.json({ feature })
  } catch (error) {
    console.error('Failed to create feature:', error)
    return NextResponse.json({ error: 'Failed to create feature' }, { status: 500 })
  }
}
