import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
