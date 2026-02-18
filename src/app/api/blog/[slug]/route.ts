import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const db = prisma as any

// GET /api/blog/[slug] - Get single post by slug
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const admin = searchParams.get('admin') === 'true'

    const post = await db.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                name: true,
                avatarUrl: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // If not admin view and post is draft, deny access
    if (!admin && post.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // If admin view, verify admin role
    if (admin) {
      const user = await getCurrentUser()
      if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Failed to fetch post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

// PATCH /api/blog/[slug] - Update post (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { slug } = await params
    const body = await request.json()
    const { title, newSlug, excerpt, content, coverImage, category, tags, status, metaTitle, metaDescription } = body

    const existingPost = await db.blogPost.findUnique({ where: { slug } })
    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // If changing slug, check uniqueness
    if (newSlug && newSlug !== slug) {
      const slugExists = await db.blogPost.findUnique({ where: { slug: newSlug } })
      if (slugExists) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
      }
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (newSlug !== undefined) updateData.slug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (content !== undefined) updateData.content = content
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription
    
    if (status !== undefined) {
      updateData.status = status
      // Set publishedAt when first published
      if (status === 'PUBLISHED' && !existingPost.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }

    const post = await db.blogPost.update({
      where: { slug },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            name: true,
          }
        }
      }
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Failed to update post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

// DELETE /api/blog/[slug] - Delete post (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { slug } = await params

    await db.blogPost.delete({ where: { slug } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
