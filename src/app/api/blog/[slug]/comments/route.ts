import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const db = prisma as any

// POST /api/blog/[slug]/comments - Add comment to post (logged-in users only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Please log in to comment' }, { status: 401 })
    }

    const { slug } = await params
    const { content } = await request.json()

    if (!content || content.trim().length < 2) {
      return NextResponse.json({ error: 'Comment too short' }, { status: 400 })
    }

    // Find post by slug
    const post = await db.blogPost.findUnique({
      where: { slug },
      select: { id: true, status: true }
    })

    if (!post || post.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const comment = await db.blogComment.create({
      data: {
        postId: post.id,
        authorId: user.id,
        content: content.trim(),
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

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Failed to add comment:', error)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}

// DELETE /api/blog/[slug]/comments - Delete comment (author or admin)
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { commentId } = await request.json()

    const comment = await db.blogComment.findUnique({
      where: { id: commentId },
      select: { authorId: true }
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Only author or admin can delete
    if (comment.authorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await db.blogComment.delete({ where: { id: commentId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
