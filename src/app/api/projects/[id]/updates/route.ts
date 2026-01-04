import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/projects/[id]/updates - List all updates for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    
    const whereClause: Record<string, unknown> = { projectId: id }
    
    if (year) {
      const startDate = new Date(`${year}-01-01`)
      const endDate = new Date(`${parseInt(year) + 1}-01-01`)
      whereClause.createdAt = {
        gte: startDate,
        lt: endDate,
      }
    }
    
    const updates = await prisma.projectUpdate.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    })

    // Get update counts by date for the contribution graph
    const updateCounts = await prisma.projectUpdate.groupBy({
      by: ['createdAt'],
      where: whereClause,
      _count: true,
    })

    // Transform to daily counts
    const dailyCounts: Record<string, number> = {}
    updates.forEach(update => {
      const dateKey = update.createdAt.toISOString().split('T')[0]
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1
    })

    return NextResponse.json({ 
      updates,
      dailyCounts,
      totalUpdates: updates.length,
    })
  } catch (error) {
    console.error('Failed to fetch updates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch updates' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/updates - Create a new update/announcement
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
    const { type, title, description, metadata } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const update = await prisma.projectUpdate.create({
      data: {
        projectId: id,
        type: type || 'SETTINGS_CHANGED',
        title,
        description: description || null,
        metadata: metadata || null,
      },
    })

    return NextResponse.json({ update }, { status: 201 })
  } catch (error) {
    console.error('Failed to create update:', error)
    return NextResponse.json(
      { error: 'Failed to create update' },
      { status: 500 }
    )
  }
}
