import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Follow a project
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

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Can't follow your own project
    if (project.userId === user.id) {
      return NextResponse.json({ error: 'Cannot follow your own project' }, { status: 400 })
    }

    // Check if already following
    const existing = await prisma.projectFollower.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Already following' }, { status: 400 })
    }

    // Create follow
    await prisma.projectFollower.create({
      data: {
        projectId,
        userId: user.id
      }
    })

    // Get updated count
    const followerCount = await prisma.projectFollower.count({
      where: { projectId }
    })

    return NextResponse.json({ 
      success: true, 
      following: true,
      followerCount 
    })
  } catch (error) {
    console.error('Error following project:', error)
    return NextResponse.json({ error: 'Failed to follow project' }, { status: 500 })
  }
}

// DELETE - Unfollow a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params

    // Delete follow if exists
    await prisma.projectFollower.deleteMany({
      where: {
        projectId,
        userId: user.id
      }
    })

    // Get updated count
    const followerCount = await prisma.projectFollower.count({
      where: { projectId }
    })

    return NextResponse.json({ 
      success: true, 
      following: false,
      followerCount 
    })
  } catch (error) {
    console.error('Error unfollowing project:', error)
    return NextResponse.json({ error: 'Failed to unfollow project' }, { status: 500 })
  }
}

// GET - Check if following and get count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id: projectId } = await params

    let isFollowing = false
    if (user) {
      const follow = await prisma.projectFollower.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: user.id
          }
        }
      })
      isFollowing = !!follow
    }

    const followerCount = await prisma.projectFollower.count({
      where: { projectId }
    })

    return NextResponse.json({ 
      following: isFollowing,
      followerCount 
    })
  } catch (error) {
    console.error('Error getting follow status:', error)
    return NextResponse.json({ error: 'Failed to get follow status' }, { status: 500 })
  }
}
