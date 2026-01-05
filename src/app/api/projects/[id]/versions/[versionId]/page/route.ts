import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/projects/[id]/versions/[versionId]/page - Get page content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { versionId } = await params
    
    const page = await prisma.versionPage.findUnique({
      where: { versionId },
    })

    if (!page) {
      // Return empty content if no page exists yet
      return NextResponse.json({ 
        page: { 
          content: { rows: [] },
          settings: {}
        } 
      })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Failed to fetch page:', error)
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id]/versions/[versionId]/page - Save page content
export async function PUT(
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
    const { content, settings } = body

    // Upsert the page
    const page = await prisma.versionPage.upsert({
      where: { versionId },
      create: {
        versionId,
        content: content || { rows: [] },
        settings: settings || {},
      },
      update: {
        content: content || { rows: [] },
        settings: settings || {},
      },
    })

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Failed to save page:', error)
    return NextResponse.json(
      { error: 'Failed to save page' },
      { status: 500 }
    )
  }
}
