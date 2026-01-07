import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/projects/[id]/gallery - Get all gallery images
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    const images = await prisma.galleryImage.findMany({
      where: { projectId },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({ images })
  } catch (error) {
    console.error('Error fetching gallery:', error)
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 })
  }
}

// POST /api/projects/[id]/gallery - Add new gallery image
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

    // Check if user owns the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.userId !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { imageUrl, title, description } = body

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Get the next order number
    const lastImage = await prisma.galleryImage.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' }
    })
    const nextOrder = (lastImage?.order ?? -1) + 1

    const image = await prisma.galleryImage.create({
      data: {
        projectId,
        imageUrl,
        title: title || null,
        description: description || null,
        order: nextOrder
      }
    })

    return NextResponse.json({ image }, { status: 201 })
  } catch (error) {
    console.error('Error adding gallery image:', error)
    return NextResponse.json({ error: 'Failed to add gallery image' }, { status: 500 })
  }
}
