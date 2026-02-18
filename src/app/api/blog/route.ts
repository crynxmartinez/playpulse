import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const db = prisma as any

// GET /api/blog - Get all published posts (public) or all posts (admin)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const admin = searchParams.get('admin') === 'true'

    let where: any = {}

    // If admin view requested, check auth
    if (admin) {
      const user = await getCurrentUser()
      if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      // Admin can see all posts
      if (status && status !== 'all') where.status = status
    } else {
      // Public view - only published posts
      where.status = 'PUBLISHED'
    }

    if (category && category !== 'all') where.category = category

    const posts = await db.blogPost.findMany({
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
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { publishedAt: 'desc' }
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// POST /api/blog - Create new post (admin only)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { title, slug, excerpt, content, coverImage, category, tags, status, metaTitle, metaDescription } = await request.json()

    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 })
    }

    // Check slug uniqueness
    const existing = await db.blogPost.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    const post = await db.blogPost.create({
      data: {
        title,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        excerpt: excerpt || null,
        content: content || '',
        coverImage: coverImage || null,
        category: category || 'ANNOUNCEMENT',
        tags: tags || [],
        status: status || 'DRAFT',
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        authorId: user.id,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
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
    console.error('Failed to create post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
