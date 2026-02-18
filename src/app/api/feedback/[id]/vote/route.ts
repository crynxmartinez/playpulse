import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const db = prisma as any

// POST /api/feedback/[id]/vote - Toggle vote on feature
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

    // Check if feature exists
    const feature = await db.featureRequest.findUnique({
      where: { id }
    })

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    // Check if user already voted
    const existingVote = await db.featureRequestVote.findUnique({
      where: {
        featureId_userId: {
          featureId: id,
          userId: user.id
        }
      }
    })

    if (existingVote) {
      // Remove vote
      await db.featureRequestVote.delete({
        where: { id: existingVote.id }
      })
      return NextResponse.json({ voted: false })
    } else {
      // Add vote
      await db.featureRequestVote.create({
        data: {
          featureId: id,
          userId: user.id
        }
      })
      return NextResponse.json({ voted: true })
    }
  } catch (error) {
    console.error('Failed to vote:', error)
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }
}
