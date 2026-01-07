import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/projects/[id]/feedback - List all feedback threads
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // FEATURE, BUG, IMPROVEMENT, OTHER
    const status = searchParams.get('status') // OPEN, IN_PROGRESS, COMPLETED, DECLINED
    const sort = searchParams.get('sort') || 'votes' // votes, new

    // Check if project exists and is accessible
    const project = await prisma.project.findFirst({
      where: user
        ? { id: projectId }
        : { id: projectId, visibility: { in: ['PUBLIC', 'UNLISTED'] } },
      select: { id: true, userId: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Build where clause
    const where: any = { projectId }
    if (type) where.type = type
    if (status) where.status = status

    // Get threads with vote counts
    const threads = await prisma.feedbackThread.findMany({
      where,
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
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: sort === 'new' 
        ? { createdAt: 'desc' }
        : { createdAt: 'desc' } // Will sort by votes in JS
    })

    // Calculate vote scores and user's vote
    const threadsWithScores = threads.map(thread => {
      const upvotes = thread.votes.filter((v: { value: number }) => v.value === 1).length
      const downvotes = thread.votes.filter((v: { value: number }) => v.value === -1).length
      const score = upvotes - downvotes
      const userVote = user ? thread.votes.find((v: { userId: string }) => v.userId === user.id)?.value || 0 : 0

      return {
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
        commentCount: thread._count.comments,
        isAuthor: user ? thread.authorId === user.id : false,
        isOwner: user ? project.userId === user.id : false
      }
    })

    // Sort by score if requested
    if (sort === 'votes') {
      threadsWithScores.sort((a, b) => b.score - a.score)
    }

    return NextResponse.json({ threads: threadsWithScores })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}

// POST /api/projects/[id]/feedback - Create new feedback thread
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params
    const body = await request.json()
    const { title, description, type } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create thread
    const thread = await prisma.feedbackThread.create({
      data: {
        projectId,
        authorId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        type: type || 'FEATURE'
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
      thread: {
        ...thread,
        score: 0,
        upvotes: 0,
        downvotes: 0,
        userVote: 0,
        commentCount: 0,
        isAuthor: true
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating feedback:', error)
    return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 })
  }
}
