import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/projects/[id]/feedback/[threadId] - Get single thread with comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, threadId } = await params

    const thread = await prisma.feedbackThread.findFirst({
      where: {
        id: threadId,
        projectId
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true
          }
        },
        votes: {
          select: {
            value: true,
            userId: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                username: true,
                avatarUrl: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        project: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Calculate vote scores
    const upvotes = thread.votes.filter(v => v.value === 1).length
    const downvotes = thread.votes.filter(v => v.value === -1).length
    const score = upvotes - downvotes
    const userVote = thread.votes.find(v => v.userId === user.id)?.value || 0

    // Format comments with author info
    const comments = thread.comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      isEdited: comment.isEdited,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: comment.author,
      isAuthor: comment.authorId === user.id,
      canDelete: comment.authorId === user.id || thread.project.userId === user.id
    }))

    return NextResponse.json({
      thread: {
        id: thread.id,
        title: thread.title,
        description: thread.description,
        type: thread.type,
        status: thread.status,
        isEdited: thread.isEdited,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        author: thread.author,
        score,
        upvotes,
        downvotes,
        userVote,
        comments,
        commentCount: comments.length,
        isAuthor: thread.authorId === user.id,
        isOwner: thread.project.userId === user.id
      }
    })
  } catch (error) {
    console.error('Error fetching thread:', error)
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 })
  }
}

// PATCH /api/projects/[id]/feedback/[threadId] - Update thread
export async function PATCH(
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
    const { title, description, type, status } = body

    // Get thread with project info
    const thread = await prisma.feedbackThread.findFirst({
      where: {
        id: threadId,
        projectId
      },
      include: {
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

    const isAuthor = thread.authorId === user.id
    const isOwner = thread.project.userId === user.id

    // Only author can edit title/description/type
    // Only owner can change status
    if (!isAuthor && !isOwner) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const updateData: any = {}
    
    // Author can edit content
    if (isAuthor) {
      if (title !== undefined) updateData.title = title.trim()
      if (description !== undefined) updateData.description = description?.trim() || null
      if (type !== undefined) updateData.type = type
      if (title !== undefined || description !== undefined) {
        updateData.isEdited = true
      }
    }

    // Owner can change status
    if (isOwner && status !== undefined) {
      updateData.status = status

      // Notify author and voters about status change
      if (thread.authorId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: thread.authorId,
            type: 'FEEDBACK_STATUS',
            title: 'Feedback status updated',
            message: `Your feedback "${thread.title}" status changed to ${status}`,
            link: `/dashboard/projects/${projectId}/feedback/${threadId}`
          }
        })
      }

      // Notify voters
      const voterIds = thread.votes
        .map(v => v.userId)
        .filter(id => id !== user.id && id !== thread.authorId)
      
      if (voterIds.length > 0) {
        await prisma.notification.createMany({
          data: voterIds.map(userId => ({
            userId,
            type: 'FEEDBACK_STATUS',
            title: 'Feedback status updated',
            message: `Feedback "${thread.title}" status changed to ${status}`,
            link: `/dashboard/projects/${projectId}/feedback/${threadId}`
          }))
        })
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await prisma.feedbackThread.update({
      where: { id: threadId },
      data: updateData
    })

    return NextResponse.json({ thread: updated })
  } catch (error) {
    console.error('Error updating thread:', error)
    return NextResponse.json({ error: 'Failed to update thread' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/feedback/[threadId] - Delete thread
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, threadId } = await params

    // Get thread with project info
    const thread = await prisma.feedbackThread.findFirst({
      where: {
        id: threadId,
        projectId
      },
      include: {
        project: {
          select: { userId: true }
        }
      }
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    const isAuthor = thread.authorId === user.id
    const isOwner = thread.project.userId === user.id

    if (!isAuthor && !isOwner) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await prisma.feedbackThread.delete({
      where: { id: threadId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting thread:', error)
    return NextResponse.json({ error: 'Failed to delete thread' }, { status: 500 })
  }
}
