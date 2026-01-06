import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Remove a pinned section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pinnedId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, pinnedId } = await params

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await prisma.pinnedSection.delete({
      where: { id: pinnedId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete pinned section:', error)
    return NextResponse.json({ error: 'Failed to delete pinned section' }, { status: 500 })
  }
}

// PATCH - Update a pinned section (for reordering)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pinnedId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, pinnedId } = await params
    const body = await request.json()
    const { order, title } = body

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const pinnedSection = await prisma.pinnedSection.update({
      where: { id: pinnedId },
      data: {
        ...(order !== undefined && { order }),
        ...(title !== undefined && { title }),
      },
      include: {
        snapshot: true,
      },
    })

    return NextResponse.json({ pinnedSection })
  } catch (error) {
    console.error('Failed to update pinned section:', error)
    return NextResponse.json({ error: 'Failed to update pinned section' }, { status: 500 })
  }
}
