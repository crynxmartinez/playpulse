import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/projects/[id]/versions - List all versions for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const versions = await prisma.projectVersion.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Failed to fetch versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/versions - Create a new version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const { version, title, description, imageUrl, isPublished } = body

    if (!version || !title) {
      return NextResponse.json(
        { error: 'Version and title are required' },
        { status: 400 }
      )
    }

    const newVersion = await prisma.projectVersion.create({
      data: {
        projectId: id,
        version,
        title,
        description,
        imageUrl,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
      },
    })

    // Create an update record
    await prisma.projectUpdate.create({
      data: {
        projectId: id,
        type: 'VERSION_RELEASE',
        title: `Released ${version}`,
        description: title,
        metadata: { versionId: newVersion.id, version },
      },
    })

    return NextResponse.json({ version: newVersion }, { status: 201 })
  } catch (error) {
    console.error('Failed to create version:', error)
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    )
  }
}
