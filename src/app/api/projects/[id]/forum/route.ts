import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/projects/[id]/forum - List all threads (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    const threads = await prisma.forumThread.findMany({
      where: { projectId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    })

    return NextResponse.json({ threads })
  } catch (error) {
    console.error('Failed to fetch forum threads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/forum - Create a new thread (auth required)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params
    const { title, body } = await request.json()

    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      )
    }

    const thread = await prisma.forumThread.create({
      data: {
        projectId,
        authorId: user.id,
        title: title.trim(),
        body: body.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    })

    return NextResponse.json({ thread })
  } catch (error) {
    console.error('Failed to create forum thread:', error)
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    )
  }
}
