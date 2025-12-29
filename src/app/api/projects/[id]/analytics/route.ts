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
    const statAverages: Record<string, { name: string; average: number; count: number; min: number; max: number; category: string | null; weight: number }> = {}
    
    for (const stat of project.stats) {
      statAverages[stat.id] = {
        name: stat.name,
        average: 0,
        count: 0,
        min: stat.minValue,
        max: stat.maxValue,
        category: stat.category,
        weight: stat.weight,
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

    // Calculate category averages
    const categoryAverages: Record<string, { total: number; max: number; count: number }> = {}
    const statAveragesArray = Object.values(statAverages)
    
    for (const stat of statAveragesArray) {
      if (stat.count > 0) {
        const cat = stat.category || 'uncategorized'
        if (!categoryAverages[cat]) {
          categoryAverages[cat] = { total: 0, max: 0, count: 0 }
        }
        // Normalize to percentage
        const percentage = ((stat.average - stat.min) / (stat.max - stat.min)) * 100
        categoryAverages[cat].total += percentage * stat.weight
        categoryAverages[cat].max += 100 * stat.weight
        categoryAverages[cat].count++
      }
    }

    const categoryScores = Object.entries(categoryAverages).map(([category, data]) => ({
      category,
      score: Math.round(data.total / data.count),
      statCount: data.count,
    }))

    // Generate insights
    const insights: string[] = []
    
    if (statAveragesArray.length > 0 && totalResponses > 0) {
      // Find highest and lowest scoring stats
      const statsWithScores = statAveragesArray
        .filter(s => s.count > 0)
        .map(s => ({
          ...s,
          percentage: Math.round(((s.average - s.min) / (s.max - s.min)) * 100)
        }))
        .sort((a, b) => b.percentage - a.percentage)
      
      if (statsWithScores.length > 0) {
        const highest = statsWithScores[0]
        const lowest = statsWithScores[statsWithScores.length - 1]
        
        insights.push(`"${highest.name}" is your highest rated stat at ${highest.percentage}%`)
        
        if (statsWithScores.length > 1 && lowest.percentage < highest.percentage) {
          insights.push(`"${lowest.name}" needs attention - only ${lowest.percentage}%`)
        }
        
        // Category comparison
        if (categoryScores.length > 1) {
          const sortedCats = [...categoryScores].sort((a, b) => b.score - a.score)
          const highCat = sortedCats[0]
          const lowCat = sortedCats[sortedCats.length - 1]
          
          if (highCat.score - lowCat.score > 15) {
            insights.push(`${highCat.category} scores ${highCat.score - lowCat.score}% higher than ${lowCat.category}`)
          }
        }
        
        // Response trend insight
        const recentResponses = Object.entries(dailyResponses).slice(-7)
        const recentTotal = recentResponses.reduce((sum, [, count]) => sum + count, 0)
        const olderResponses = Object.entries(dailyResponses).slice(0, 7)
        const olderTotal = olderResponses.reduce((sum, [, count]) => sum + count, 0)
        
        if (recentTotal > olderTotal * 1.5 && olderTotal > 0) {
          insights.push(`Response rate increased ${Math.round((recentTotal / olderTotal - 1) * 100)}% this week`)
        } else if (recentTotal < olderTotal * 0.5 && recentTotal > 0) {
          insights.push(`Response rate dropped - consider promoting your forms`)
        }
      }
    }

    return NextResponse.json({
      statAverages: statAveragesArray,
      categoryScores,
      insights,
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
