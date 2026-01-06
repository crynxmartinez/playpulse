import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ActivityBreakdown {
  form_response?: number;
  update_published?: number;
  new_follower?: number;
  settings_changed?: number;
  version_released?: number;
}

interface ActivityDay {
  total: number;
  breakdown: ActivityBreakdown;
}

type ActivityData = Record<string, ActivityDay>;

// GET /api/projects/[id]/activity - Get daily activity data for heatmap
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Define date range for the year
    const startDate = new Date(year, 0, 1) // Jan 1
    const endDate = new Date(year, 11, 31, 23, 59, 59) // Dec 31

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get all form IDs for this project
    const forms = await prisma.form.findMany({
      where: { projectId },
      select: { id: true }
    })
    const formIds = forms.map(f => f.id)

    // Query 1: Form responses grouped by date
    const formResponses = formIds.length > 0 ? await prisma.response.groupBy({
      by: ['createdAt'],
      where: {
        formId: { in: formIds },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true
    }) : []

    // Query 2: Project updates grouped by date
    const projectUpdates = await prisma.projectUpdate.groupBy({
      by: ['createdAt'],
      where: {
        projectId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true
    })

    // Query 3: New followers grouped by date
    const newFollowers = await prisma.projectFollower.groupBy({
      by: ['createdAt'],
      where: {
        projectId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true
    })

    // Query 4: Published versions grouped by date
    const publishedVersions = await prisma.projectVersion.groupBy({
      by: ['publishedAt'],
      where: {
        projectId,
        isPublished: true,
        publishedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true
    })

    // Combine all data into activity map
    const activityData: ActivityData = {}

    // Helper to get date string
    const toDateString = (date: Date) => date.toISOString().split('T')[0]

    // Helper to ensure activity day exists
    const ensureDay = (dateStr: string) => {
      if (!activityData[dateStr]) {
        activityData[dateStr] = { total: 0, breakdown: {} }
      }
    }

    // Process form responses
    for (const item of formResponses) {
      const dateStr = toDateString(new Date(item.createdAt))
      ensureDay(dateStr)
      activityData[dateStr].breakdown.form_response = (activityData[dateStr].breakdown.form_response || 0) + item._count
      activityData[dateStr].total += item._count
    }

    // Process project updates
    for (const item of projectUpdates) {
      const dateStr = toDateString(new Date(item.createdAt))
      ensureDay(dateStr)
      activityData[dateStr].breakdown.update_published = (activityData[dateStr].breakdown.update_published || 0) + item._count
      activityData[dateStr].total += item._count
    }

    // Process new followers
    for (const item of newFollowers) {
      const dateStr = toDateString(new Date(item.createdAt))
      ensureDay(dateStr)
      activityData[dateStr].breakdown.new_follower = (activityData[dateStr].breakdown.new_follower || 0) + item._count
      activityData[dateStr].total += item._count
    }

    // Process published versions
    for (const item of publishedVersions) {
      if (item.publishedAt) {
        const dateStr = toDateString(new Date(item.publishedAt))
        ensureDay(dateStr)
        activityData[dateStr].breakdown.version_released = (activityData[dateStr].breakdown.version_released || 0) + item._count
        activityData[dateStr].total += item._count
      }
    }

    return NextResponse.json({ activity: activityData })
  } catch (error) {
    console.error('Error fetching activity data:', error)
    return NextResponse.json({ error: 'Failed to fetch activity data' }, { status: 500 })
  }
}
