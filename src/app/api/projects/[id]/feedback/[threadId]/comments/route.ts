import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/projects/[id]/feedback/[threadId]/comments - Add comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, threadId } = await params
    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Get thread with project and votes info
    const thread = await prisma.feedbackThread.findFirst({
      where: {
        id: threadId,
        projectId
      },
      select: {
        id: true,
        authorId: true,
        title: true,
        project: {
          select: { userId: true }
        },
        votes: {
          select: { userId: true }
        }
      }
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Create comment
    const comment = await prisma.feedbackComment.create({
      data: {
        threadId,
        authorId: user.id,
        content: content.trim()
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    })

    // Notify thread author (if not the commenter)
    if (thread.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: thread.authorId,
          type: 'FEEDBACK_COMMENT',
          title: 'New comment on your feedback',
          message: `Someone commented on "${thread.title}"`,
          link: `/dashboard/projects/${projectId}/feedback/${threadId}`
        }
      })
    }

    // Notify voters who are subscribed (if not the commenter or author)
    const voterIds = thread.votes
      .map(v => v.userId)
      .filter(id => id !== user.id && id !== thread.authorId)

    if (voterIds.length > 0) {
      await prisma.notification.createMany({
        data: voterIds.map(userId => ({
          userId,
          type: 'FEEDBACK_REPLY',
          title: 'New comment on feedback you voted',
          message: `New comment on "${thread.title}"`,
          link: `/dashboard/projects/${projectId}/feedback/${threadId}`
        }))
      })
    }

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        isEdited: comment.isEdited,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: comment.author,
        isAuthor: true,
        canDelete: true
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
