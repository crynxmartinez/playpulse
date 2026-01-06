import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/projects/[id]/snapshots - List all snapshots for a project
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

    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const formId = searchParams.get('formId')

    // Build where clause
    const where: Record<string, unknown> = { projectId }
    if (type) where.type = type
    if (formId) where.formId = formId

    const snapshots = await prisma.snapshot.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        formId: true,
        imageData: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ snapshots })
  } catch (error) {
    console.error('Failed to fetch snapshots:', error)
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 })
  }
}

// POST /api/projects/[id]/snapshots - Create a new snapshot
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

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, type, imageData, formId, metadata } = body

    // Validate required fields
    if (!name || !type || !imageData) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, imageData' },
        { status: 400 }
      )
    }

    // Validate imageData is a valid base64 string (basic check)
    if (!imageData.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image data format. Must be a base64 data URL.' },
        { status: 400 }
      )
    }

    // Create snapshot
    const snapshot = await prisma.snapshot.create({
      data: {
        projectId,
        name,
        type,
        imageData,
        formId: formId || null,
        metadata: metadata || null,
      },
    })

    return NextResponse.json({ snapshot }, { status: 201 })
  } catch (error) {
    console.error('Failed to create snapshot:', error)
    return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 })
  }
}
