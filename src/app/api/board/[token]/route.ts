import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/board/[token] - Get board by share token (public access)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const board = await prisma.progressBoard.findFirst({
      where: { 
        shareToken: token,
        visibility: { in: ['PUBLIC', 'UNLISTED'] }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            bannerUrl: true,
            stats: {
              select: {
                id: true,
                name: true,
                category: true,
                minValue: true,
                maxValue: true,
              }
            },
            forms: {
              where: { isActive: true },
              include: {
                responses: {
                  include: {
                    answers: {
                      include: {
                        question: {
                          select: { statId: true }
                        }
                      }
                    }
                  },
                  orderBy: { createdAt: 'desc' }
                }
              }
            },
            user: {
              select: {
                displayName: true,
                username: true,
                studioName: true,
              }
            }
          }
        }
      }
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Calculate stats data for the board
    const columns = board.columns as Array<{ statId: string; label?: string; showDelta?: boolean }>
    const statsData: Record<string, { current: number; previous: number; responses: number }> = {}

    // Get all responses and calculate averages per stat
    const allResponses = board.project.forms.flatMap(f => f.responses)
    const recentResponses = allResponses.slice(0, Math.ceil(allResponses.length / 2))
    const olderResponses = allResponses.slice(Math.ceil(allResponses.length / 2))

    for (const col of columns) {
      const stat = board.project.stats.find(s => s.id === col.statId)
      if (!stat) continue

      // Calculate current average (recent half)
      const recentValues = recentResponses
        .flatMap(r => r.answers)
        .filter(a => a.question?.statId === col.statId && a.value !== null)
        .map(a => a.value as number)

      // Calculate previous average (older half)
      const olderValues = olderResponses
        .flatMap(r => r.answers)
        .filter(a => a.question?.statId === col.statId && a.value !== null)
        .map(a => a.value as number)

      const currentAvg = recentValues.length > 0 
        ? recentValues.reduce((a, b) => a + b, 0) / recentValues.length 
        : 0
      const previousAvg = olderValues.length > 0 
        ? olderValues.reduce((a, b) => a + b, 0) / olderValues.length 
        : 0

      // Normalize to percentage
      const range = stat.maxValue - stat.minValue
      statsData[col.statId] = {
        current: range > 0 ? ((currentAvg - stat.minValue) / range) * 100 : 0,
        previous: range > 0 ? ((previousAvg - stat.minValue) / range) * 100 : 0,
        responses: recentValues.length + olderValues.length
      }
    }

    // Calculate trend data (responses over time)
    const trendData = calculateTrendData(allResponses)

    return NextResponse.json({ 
      board: {
        id: board.id,
        name: board.name,
        columns: board.columns,
        showTrend: board.showTrend,
        showTable: board.showTable,
        project: {
          name: board.project.name,
          slug: board.project.slug,
          logoUrl: board.project.logoUrl,
          bannerUrl: board.project.bannerUrl,
          developer: board.project.user.studioName || board.project.user.displayName || board.project.user.username,
          stats: board.project.stats,
        }
      },
      statsData,
      trendData,
      totalResponses: allResponses.length
    })
  } catch (error) {
    console.error('Failed to fetch board:', error)
    return NextResponse.json({ error: 'Failed to fetch board' }, { status: 500 })
  }
}

function calculateTrendData(responses: Array<{ createdAt: Date }>) {
  // Group responses by week
  const weeklyData: Record<string, number> = {}
  
  responses.forEach(r => {
    const date = new Date(r.createdAt)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const key = weekStart.toISOString().split('T')[0]
    weeklyData[key] = (weeklyData[key] || 0) + 1
  })

  // Convert to array and sort
  return Object.entries(weeklyData)
    .map(([date, count]) => ({ date, responses: count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-12) // Last 12 weeks
}
