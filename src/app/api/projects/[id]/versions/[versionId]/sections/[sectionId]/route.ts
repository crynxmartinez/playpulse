import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/projects/[id]/versions/[versionId]/sections/[sectionId] - Get a specific section
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; sectionId: string }> }
) {
  try {
    const { sectionId } = await params
    
    const section = await prisma.versionSection.findUnique({
      where: { id: sectionId },
      include: {
        blocks: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    return NextResponse.json({ section })
  } catch (error) {
    console.error('Failed to fetch section:', error)
    return NextResponse.json(
      { error: 'Failed to fetch section' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id]/versions/[versionId]/sections/[sectionId] - Update a section
export async function PATCH(
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

    const body = await request.json()
    const { title, order, layout, backgroundColor, accentColor, padding } = body

    const section = await prisma.versionSection.update({
      where: { id: sectionId },
      data: {
        ...(title !== undefined && { title }),
        ...(order !== undefined && { order }),
        ...(layout !== undefined && { layout }),
        ...(backgroundColor !== undefined && { backgroundColor }),
        ...(accentColor !== undefined && { accentColor }),
        ...(padding !== undefined && { padding }),
      },
      include: {
        blocks: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({ section })
  } catch (error) {
    console.error('Failed to update section:', error)
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/versions/[versionId]/sections/[sectionId] - Delete a section
export async function DELETE(
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

    await prisma.versionSection.delete({
      where: { id: sectionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete section:', error)
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    )
  }
}
