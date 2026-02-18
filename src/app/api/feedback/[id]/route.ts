import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const db = prisma as any

// GET /api/feedback/[id] - Get single feature with comments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const feature = await db.featureRequest.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
          }
        },
        votes: {
          select: { userId: true }
        },
        comments: {
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
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    return NextResponse.json({
      feature: {
        ...feature,
        voteCount: feature.votes.length,
        voterIds: feature.votes.map((v: any) => v.userId),
      }
    })
  } catch (error) {
    console.error('Failed to fetch feature:', error)
    return NextResponse.json({ error: 'Failed to fetch feature' }, { status: 500 })
  }
}

// PATCH /api/feedback/[id] - Update feature (admin only for status)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { status, isPinned } = await request.json()

    // Only admins can change status/pin
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (typeof isPinned === 'boolean') updateData.isPinned = isPinned

    const feature = await db.featureRequest.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ feature })
  } catch (error) {
    console.error('Failed to update feature:', error)
    return NextResponse.json({ error: 'Failed to update feature' }, { status: 500 })
  }
}

// DELETE /api/feedback/[id] - Delete feature (author or admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const feature = await db.featureRequest.findUnique({
      where: { id },
      select: { authorId: true }
    })

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    // Only author or admin can delete
    if (feature.authorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await db.featureRequest.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete feature:', error)
    return NextResponse.json({ error: 'Failed to delete feature' }, { status: 500 })
  }
}
