import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; versionId: string }> }
) {
  try {
    const { projectId, versionId } = await params

    // Fetch the version with project info
    const version = await prisma.projectVersion.findFirst({
      where: {
        id: versionId,
        projectId: projectId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!version) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 })
    }

    // Check if published (allow viewing unpublished for now, can restrict later)
    // if (!version.isPublished) {
    //   return NextResponse.json({ error: 'This update is not published yet' }, { status: 403 })
    // }

    // Fetch the page content
    const page = await prisma.versionPage.findUnique({
      where: { versionId: versionId },
    })

    return NextResponse.json({
      version: {
        id: version.id,
        version: version.version,
        title: version.title,
        description: version.description,
        isPublished: version.isPublished,
        publishedAt: version.publishedAt,
      },
      project: version.project,
      page: page ? { content: page.content } : null,
    })
  } catch (error) {
    console.error('Failed to fetch public update:', error)
    return NextResponse.json({ error: 'Failed to fetch update' }, { status: 500 })
  }
}
