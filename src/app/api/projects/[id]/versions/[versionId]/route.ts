import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/projects/[id]/versions/[versionId] - Get a specific version
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params
    
    const version = await prisma.projectVersion.findFirst({
      where: { id: versionId, projectId: id },
      include: {
        project: { select: { slug: true } }
      }
    })

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    return NextResponse.json({ version })
  } catch (error) {
    console.error('Failed to fetch version:', error)
    return NextResponse.json(
      { error: 'Failed to fetch version' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id]/versions/[versionId] - Update a version
export async function PATCH(
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

    const body = await request.json()
    const { version, title, description, imageUrl, isPublished } = body

    const existingVersion = await prisma.projectVersion.findFirst({
      where: { id: versionId, projectId: id },
    })

    if (!existingVersion) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    const updatedVersion = await prisma.projectVersion.update({
      where: { id: versionId },
      data: {
        ...(version && { version }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isPublished !== undefined && { 
          isPublished,
          publishedAt: isPublished && !existingVersion.isPublished ? new Date() : existingVersion.publishedAt,
        }),
      },
    })

    return NextResponse.json({ version: updatedVersion })
  } catch (error) {
    console.error('Failed to update version:', error)
    return NextResponse.json(
      { error: 'Failed to update version' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/versions/[versionId] - Delete a version
export async function DELETE(
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

    await prisma.projectVersion.delete({
      where: { id: versionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete version:', error)
    return NextResponse.json(
      { error: 'Failed to delete version' },
      { status: 500 }
    )
  }
}
