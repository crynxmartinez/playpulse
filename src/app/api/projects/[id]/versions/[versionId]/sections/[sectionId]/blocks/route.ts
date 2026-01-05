import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/projects/[id]/versions/[versionId]/sections/[sectionId]/blocks - List all blocks for a section
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; sectionId: string }> }
) {
  try {
    const { sectionId } = await params
    
    const blocks = await prisma.versionBlock.findMany({
      where: { sectionId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ blocks })
  } catch (error) {
    console.error('Failed to fetch blocks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blocks' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/versions/[versionId]/sections/[sectionId]/blocks - Create a new block
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; sectionId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, sectionId } = await params
    
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify section exists
    const section = await prisma.versionSection.findUnique({
      where: { id: sectionId },
    })

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    const body = await request.json()
    const { type, order, data } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Block type is required' },
        { status: 400 }
      )
    }

    const block = await prisma.versionBlock.create({
      data: {
        sectionId,
        type,
        order: order ?? 0,
        data: data || {},
      },
    })

    return NextResponse.json({ block }, { status: 201 })
  } catch (error) {
    console.error('Failed to create block:', error)
    return NextResponse.json(
      { error: 'Failed to create block' },
      { status: 500 }
    )
  }
}
