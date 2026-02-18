import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Cast to any to avoid type errors before prisma generate runs
const db = prisma as any

// Generate a URL-friendly slug from version and title
function generateVersionSlug(version: string, title: string): string {
  const combined = `${version}-${title}`
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

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

    // Generate slug
    const baseSlug = generateVersionSlug(version, title)
    let slug = baseSlug
    let counter = 1
    
    // Ensure unique slug within project
    while (true) {
      const existing = await db.projectVersion.findFirst({
        where: { projectId: id, slug },
      })
      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const newVersion = await db.projectVersion.create({
      data: {
        projectId: id,
        slug,
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
