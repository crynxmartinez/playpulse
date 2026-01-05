import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/projects/[id]/versions/[versionId]/sections - List all sections for a version
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params
    
    const sections = await prisma.versionSection.findMany({
      where: { versionId },
      include: {
        blocks: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Failed to fetch sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/versions/[versionId]/sections - Create a new section
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, versionId } = await params
    
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify version exists
    const version = await prisma.projectVersion.findFirst({
      where: { id: versionId, projectId: id },
    })

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, order, layout, backgroundColor, accentColor, padding } = body

    const section = await prisma.versionSection.create({
      data: {
        versionId,
        title: title || null,
        order: order ?? 0,
        layout: layout || 'single',
        backgroundColor: backgroundColor || null,
        accentColor: accentColor || null,
        padding: padding || 'normal',
      },
      include: {
        blocks: true,
      },
    })

    return NextResponse.json({ section }, { status: 201 })
  } catch (error) {
    console.error('Failed to create section:', error)
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    )
  }
}
