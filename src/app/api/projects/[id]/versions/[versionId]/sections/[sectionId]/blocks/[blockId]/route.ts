import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/projects/[id]/versions/[versionId]/sections/[sectionId]/blocks/[blockId] - Get a specific block
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; sectionId: string; blockId: string }> }
) {
  try {
    const { blockId } = await params
    
    const block = await prisma.versionBlock.findUnique({
      where: { id: blockId },
    })

    if (!block) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 })
    }

    return NextResponse.json({ block })
  } catch (error) {
    console.error('Failed to fetch block:', error)
    return NextResponse.json(
      { error: 'Failed to fetch block' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id]/versions/[versionId]/sections/[sectionId]/blocks/[blockId] - Update a block
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; sectionId: string; blockId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, blockId } = await params
    
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const { type, order, data } = body

    const block = await prisma.versionBlock.update({
      where: { id: blockId },
      data: {
        ...(type !== undefined && { type }),
        ...(order !== undefined && { order }),
        ...(data !== undefined && { data }),
      },
    })

    return NextResponse.json({ block })
  } catch (error) {
    console.error('Failed to update block:', error)
    return NextResponse.json(
      { error: 'Failed to update block' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/versions/[versionId]/sections/[sectionId]/blocks/[blockId] - Delete a block
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; sectionId: string; blockId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, blockId } = await params
    
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await prisma.versionBlock.delete({
      where: { id: blockId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete block:', error)
    return NextResponse.json(
      { error: 'Failed to delete block' },
      { status: 500 }
    )
  }
}
