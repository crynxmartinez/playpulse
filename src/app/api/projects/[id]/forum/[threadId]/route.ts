import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// PATCH /api/projects/[id]/forum/[threadId] - Update thread (pin/lock, owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; threadId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id
    const threadId = params.threadId

    // Check if user owns the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { isPinned, isLocked } = await request.json()

    const thread = await prisma.forumThread.update({
      where: { id: threadId },
      data: {
        ...(typeof isPinned === 'boolean' && { isPinned }),
        ...(typeof isLocked === 'boolean' && { isLocked }),
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
    console.error('Failed to update thread:', error)
    return NextResponse.json(
      { error: 'Failed to update thread' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/forum/[threadId] - Delete thread (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; threadId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id
    const threadId = params.threadId

    // Check if user owns the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.forumThread.delete({
      where: { id: threadId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete thread:', error)
    return NextResponse.json(
      { error: 'Failed to delete thread' },
      { status: 500 }
    )
  }
}
