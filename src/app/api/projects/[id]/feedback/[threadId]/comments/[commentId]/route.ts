import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/projects/[id]/feedback/[threadId]/comments/[commentId] - Delete comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string; commentId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, threadId, commentId } = await params

    // Get comment with thread and project info
    const comment = await prisma.feedbackComment.findFirst({
      where: {
        id: commentId,
        threadId
      },
      include: {
        thread: {
          include: {
            project: {
              select: { userId: true }
            }
          }
        }
      }
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const isAuthor = comment.authorId === user.id
    const isOwner = comment.thread.project.userId === user.id

    if (!isAuthor && !isOwner) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await prisma.feedbackComment.delete({
      where: { id: commentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}

// PATCH /api/projects/[id]/feedback/[threadId]/comments/[commentId] - Edit comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string; commentId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { threadId, commentId } = await params
    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Get comment
    const comment = await prisma.feedbackComment.findFirst({
      where: {
        id: commentId,
        threadId
      }
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Only author can edit
    if (comment.authorId !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const updated = await prisma.feedbackComment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        isEdited: true
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

    return NextResponse.json({
      comment: {
        id: updated.id,
        content: updated.content,
        isEdited: updated.isEdited,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        author: updated.author,
        isAuthor: true,
        canDelete: true
      }
    })
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}
