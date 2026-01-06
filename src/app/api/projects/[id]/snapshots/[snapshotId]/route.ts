import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/projects/[id]/snapshots/[snapshotId] - Get a single snapshot
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, snapshotId } = await params

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const snapshot = await prisma.snapshot.findFirst({
      where: { id: snapshotId, projectId },
    })

    if (!snapshot) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
    }

    return NextResponse.json({ snapshot })
  } catch (error) {
    console.error('Failed to fetch snapshot:', error)
    return NextResponse.json({ error: 'Failed to fetch snapshot' }, { status: 500 })
  }
}

// PATCH /api/projects/[id]/snapshots/[snapshotId] - Update a snapshot
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, snapshotId } = await params

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify snapshot exists
    const existingSnapshot = await prisma.snapshot.findFirst({
      where: { id: snapshotId, projectId },
    })

    if (!existingSnapshot) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name } = body

    // Only allow updating the name for now
    const snapshot = await prisma.snapshot.update({
      where: { id: snapshotId },
      data: { name },
    })

    return NextResponse.json({ snapshot })
  } catch (error) {
    console.error('Failed to update snapshot:', error)
    return NextResponse.json({ error: 'Failed to update snapshot' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/snapshots/[snapshotId] - Delete a snapshot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, snapshotId } = await params

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify snapshot exists
    const existingSnapshot = await prisma.snapshot.findFirst({
      where: { id: snapshotId, projectId },
    })

    if (!existingSnapshot) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
    }

    await prisma.snapshot.delete({
      where: { id: snapshotId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete snapshot:', error)
    return NextResponse.json({ error: 'Failed to delete snapshot' }, { status: 500 })
  }
}
