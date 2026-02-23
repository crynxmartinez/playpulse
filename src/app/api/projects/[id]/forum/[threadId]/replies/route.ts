import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/projects/[id]/forum/[threadId]/replies - Get all replies (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  try {
    const { threadId } = await params

    const replies = await prisma.forumReply.findMany({
      where: { threadId },
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
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ replies })
  } catch (error) {
    console.error('Failed to fetch replies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch replies' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/forum/[threadId]/replies - Create a reply (auth required)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { threadId } = await params
    const { body } = await request.json()

    if (!body?.trim()) {
      return NextResponse.json(
        { error: 'Reply body is required' },
        { status: 400 }
      )
    }

    // Check if thread exists and is not locked
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      select: { isLocked: true },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    if (thread.isLocked) {
      return NextResponse.json(
        { error: 'Thread is locked' },
        { status: 403 }
      )
    }

    const reply = await prisma.forumReply.create({
      data: {
        threadId,
        authorId: user.id,
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
      },
    })

    // Update thread's updatedAt to bump it in the list
    await prisma.forumThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Failed to create reply:', error)
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}
