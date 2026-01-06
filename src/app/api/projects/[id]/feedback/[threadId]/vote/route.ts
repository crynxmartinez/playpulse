import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/projects/[id]/feedback/[threadId]/vote - Vote on thread
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
    const { value } = body // +1 or -1

    if (value !== 1 && value !== -1) {
      return NextResponse.json({ error: 'Invalid vote value' }, { status: 400 })
    }

    // Get thread
    const thread = await prisma.feedbackThread.findFirst({
      where: {
        id: threadId,
        projectId
      },
      select: {
        id: true,
        authorId: true,
        title: true
      }
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Check existing vote
    const existingVote = await prisma.feedbackVote.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId: user.id
        }
      }
    })

    if (existingVote) {
      if (existingVote.value === value) {
        // Same vote - remove it (toggle off)
        await prisma.feedbackVote.delete({
          where: { id: existingVote.id }
        })
      } else {
        // Different vote - update it
        await prisma.feedbackVote.update({
          where: { id: existingVote.id },
          data: { value }
        })
      }
    } else {
      // New vote
      await prisma.feedbackVote.create({
        data: {
          threadId,
          userId: user.id,
          value
        }
      })
    }

    // Get updated vote counts
    const votes = await prisma.feedbackVote.findMany({
      where: { threadId },
      select: { value: true, userId: true }
    })

    const upvotes = votes.filter(v => v.value === 1).length
    const downvotes = votes.filter(v => v.value === -1).length
    const score = upvotes - downvotes
    const userVote = votes.find(v => v.userId === user.id)?.value || 0

    return NextResponse.json({
      score,
      upvotes,
      downvotes,
      userVote
    })
  } catch (error) {
    console.error('Error voting:', error)
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/feedback/[threadId]/vote - Remove vote
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { threadId } = await params

    // Delete vote if exists
    await prisma.feedbackVote.deleteMany({
      where: {
        threadId,
        userId: user.id
      }
    })

    // Get updated vote counts
    const votes = await prisma.feedbackVote.findMany({
      where: { threadId },
      select: { value: true, userId: true }
    })

    const upvotes = votes.filter(v => v.value === 1).length
    const downvotes = votes.filter(v => v.value === -1).length
    const score = upvotes - downvotes

    return NextResponse.json({
      score,
      upvotes,
      downvotes,
      userVote: 0
    })
  } catch (error) {
    console.error('Error removing vote:', error)
    return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 })
  }
}
