import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
      include: {
        stats: true,
        forms: {
          include: {
            responses: {
              include: {
                answers: {
                  include: {
                    question: {
                      include: { stat: true }
                    }
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Calculate stat averages
    const statAverages: Record<string, { name: string; average: number; count: number; min: number; max: number }> = {}
    
    for (const stat of project.stats) {
      statAverages[stat.id] = {
        name: stat.name,
        average: 0,
        count: 0,
        min: stat.minValue,
        max: stat.maxValue,
      }
    }

    // Collect all responses with timestamps for trend data
    const allResponses: { createdAt: Date; answers: { statId: string; value: number }[] }[] = []

    for (const form of project.forms) {
      for (const response of form.responses) {
        const responseData: { createdAt: Date; answers: { statId: string; value: number }[] } = {
          createdAt: response.createdAt,
          answers: []
        }

        for (const answer of response.answers) {
          const statId = answer.question.stat.id
          if (statAverages[statId]) {
            statAverages[statId].count++
            statAverages[statId].average += answer.value
            responseData.answers.push({ statId, value: answer.value })
          }
        }

        allResponses.push(responseData)
      }
    }

    // Calculate final averages
    for (const statId in statAverages) {
      if (statAverages[statId].count > 0) {
        statAverages[statId].average = 
          Math.round((statAverages[statId].average / statAverages[statId].count) * 10) / 10
      }
    }

    // Calculate daily response counts for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyResponses: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      dailyResponses[key] = 0
    }

    for (const response of allResponses) {
      const key = response.createdAt.toISOString().split('T')[0]
      if (dailyResponses[key] !== undefined) {
        dailyResponses[key]++
      }
    }

    // Total stats
    const totalResponses = allResponses.length
    const totalForms = project.forms.length
    const activeForms = project.forms.filter(f => f.isActive).length

    return NextResponse.json({
      statAverages: Object.values(statAverages),
      dailyResponses: Object.entries(dailyResponses)
        .map(([date, count]) => ({ date, count }))
        .reverse(),
      totalResponses,
      totalForms,
      activeForms,
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
