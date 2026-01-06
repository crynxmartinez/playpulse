import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all pinned sections for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const pinnedSections = await prisma.pinnedSection.findMany({
      where: { projectId },
      include: {
        snapshot: true,
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ pinnedSections })
  } catch (error) {
    console.error('Failed to fetch pinned sections:', error)
    return NextResponse.json({ error: 'Failed to fetch pinned sections' }, { status: 500 })
  }
}

// POST - Create a new pinned section
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
    const { type, snapshotId, widgetType, widgetConfig, title } = body

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get the highest order value
    const maxOrder = await prisma.pinnedSection.aggregate({
      where: { projectId },
      _max: { order: true },
    })

    const pinnedSection = await prisma.pinnedSection.create({
      data: {
        projectId,
        type,
        title,
        snapshotId: type === 'SNAPSHOT' ? snapshotId : null,
        widgetType: type === 'ANALYTICS' ? widgetType : null,
        widgetConfig: type === 'ANALYTICS' ? widgetConfig : null,
        order: (maxOrder._max.order ?? -1) + 1,
      },
      include: {
        snapshot: true,
      },
    })

    return NextResponse.json({ pinnedSection })
  } catch (error) {
    console.error('Failed to create pinned section:', error)
    return NextResponse.json({ error: 'Failed to create pinned section' }, { status: 500 })
  }
}
