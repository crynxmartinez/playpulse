import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    const url = new URL(request.url)
    const formFilter = url.searchParams.get('formId') || 'all'
    const timeRange = url.searchParams.get('timeRange') || '30' // days

    // For public access, check if project is public or unlisted
    // For owner access, allow full access
    const project = await prisma.project.findFirst({
      where: user 
        ? { id, userId: user.id }
        : { id, visibility: { in: ['PUBLIC', 'UNLISTED'] } },
      include: {
        stats: true,
        forms: {
          select: {
            id: true,
            title: true,
            isActive: true,
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

    // Forms list for filter dropdown
    const formsList = project.forms.map(f => ({
      id: f.id,
      title: f.title,
      isActive: f.isActive,
      responseCount: f.responses.length
    }))

    // Filter forms based on formFilter
    const filteredForms = formFilter === 'all' 
      ? project.forms 
      : project.forms.filter(f => f.id === formFilter)

    // Time range filter
    const daysAgo = parseInt(timeRange) || 30
    const timeRangeDate = new Date()
    timeRangeDate.setDate(timeRangeDate.getDate() - daysAgo)

    // Calculate stat averages
    const statAverages: Record<string, { 
      id: string
      name: string
      average: number
      count: number
      min: number
      max: number
      category: string | null
      weight: number
      trend: number // percentage change from previous period
      values: number[] // for distribution chart
    }> = {}
    
    for (const stat of project.stats) {
      statAverages[stat.id] = {
        id: stat.id,
        name: stat.name,
        average: 0,
        count: 0,
        min: stat.minValue,
        max: stat.maxValue,
        category: stat.category,
        weight: stat.weight,
        trend: 0,
        values: [],
      }
    }

    // For trend calculation - split responses into current and previous period
    const halfPeriodDate = new Date()
    halfPeriodDate.setDate(halfPeriodDate.getDate() - Math.floor(daysAgo / 2))
    
    const currentPeriodStats: Record<string, { total: number; count: number }> = {}
    const previousPeriodStats: Record<string, { total: number; count: number }> = {}

    // Collect all responses with timestamps for trend data
    const allResponses: { createdAt: Date; formId: string; answers: { statId: string; value: number }[] }[] = []

    for (const form of filteredForms) {
      for (const response of form.responses) {
        // Apply time range filter
        if (response.createdAt < timeRangeDate) continue

        const responseData: { createdAt: Date; formId: string; answers: { statId: string; value: number }[] } = {
          createdAt: response.createdAt,
          formId: form.id,
          answers: []
        }

        for (const answer of response.answers) {
          if (!answer.question.stat) continue
          const statId = answer.question.stat.id
          if (statAverages[statId] && answer.value !== null) {
            statAverages[statId].count++
            statAverages[statId].average += answer.value
            statAverages[statId].values.push(answer.value)
            responseData.answers.push({ statId, value: answer.value })

            // Track for trend calculation
            if (response.createdAt >= halfPeriodDate) {
              if (!currentPeriodStats[statId]) currentPeriodStats[statId] = { total: 0, count: 0 }
              currentPeriodStats[statId].total += answer.value
              currentPeriodStats[statId].count++
            } else {
              if (!previousPeriodStats[statId]) previousPeriodStats[statId] = { total: 0, count: 0 }
              previousPeriodStats[statId].total += answer.value
              previousPeriodStats[statId].count++
            }
          }
        }

        allResponses.push(responseData)
      }
    }

    // Calculate final averages and trends
    for (const statId in statAverages) {
      if (statAverages[statId].count > 0) {
        statAverages[statId].average = 
          Math.round((statAverages[statId].average / statAverages[statId].count) * 10) / 10
        
        // Calculate trend
        const current = currentPeriodStats[statId]
        const previous = previousPeriodStats[statId]
        if (current && previous && previous.count > 0) {
          const currentAvg = current.total / current.count
          const previousAvg = previous.total / previous.count
          const range = statAverages[statId].max - statAverages[statId].min
          statAverages[statId].trend = Math.round(((currentAvg - previousAvg) / range) * 100)
        }
      }
    }

    // Calculate daily response counts for the time range
    const dailyResponses: Record<string, number> = {}
    for (let i = 0; i < daysAgo; i++) {
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

    // Calculate overall score
    const overallScore = categoryScores.length > 0
      ? Math.round(categoryScores.reduce((sum, c) => sum + c.score, 0) / categoryScores.length)
      : 0

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

        // Trend insights
        const trendingUp = statsWithScores.filter(s => s.trend > 5)
        const trendingDown = statsWithScores.filter(s => s.trend < -5)
        
        if (trendingUp.length > 0) {
          insights.push(`📈 "${trendingUp[0].name}" improved by ${trendingUp[0].trend}% recently`)
        }
        if (trendingDown.length > 0) {
          insights.push(`📉 "${trendingDown[0].name}" dropped by ${Math.abs(trendingDown[0].trend)}% recently`)
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
        const dailyEntries = Object.entries(dailyResponses)
        const recentResponses = dailyEntries.slice(-7)
        const recentTotal = recentResponses.reduce((sum, [, count]) => sum + count, 0)
        const olderResponses = dailyEntries.slice(0, 7)
        const olderTotal = olderResponses.reduce((sum, [, count]) => sum + count, 0)
        
        if (recentTotal > olderTotal * 1.5 && olderTotal > 0) {
          insights.push(`Response rate increased ${Math.round((recentTotal / olderTotal - 1) * 100)}% this week`)
        } else if (recentTotal < olderTotal * 0.5 && recentTotal > 0) {
          insights.push(`Response rate dropped - consider promoting your forms`)
        }
      }
    }

    // Distribution data for donut chart (score tiers)
    const scoreDistribution = {
      high: 0, // 70-100%
      medium: 0, // 40-69%
      low: 0, // 0-39%
    }
    
    for (const stat of statAveragesArray) {
      if (stat.count > 0) {
        const percentage = ((stat.average - stat.min) / (stat.max - stat.min)) * 100
        if (percentage >= 70) scoreDistribution.high++
        else if (percentage >= 40) scoreDistribution.medium++
        else scoreDistribution.low++
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
      formsList,
      overallScore,
      scoreDistribution,
      timeRange: daysAgo,
      formFilter,
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
