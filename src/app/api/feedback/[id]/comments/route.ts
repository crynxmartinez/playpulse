import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const db = prisma as any

// POST /api/feedback/[id]/comments - Add comment to feature
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { content } = await request.json()

    if (!content || content.trim().length < 2) {
      return NextResponse.json({ error: 'Comment too short' }, { status: 400 })
    }

    // Check if feature exists
    const feature = await db.featureRequest.findUnique({
      where: { id }
    })

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    const comment = await db.featureRequestComment.create({
      data: {
        featureId: id,
        authorId: user.id,
        content: content.trim(),
        isOfficial: user.role === 'ADMIN',
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
            role: true,
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
