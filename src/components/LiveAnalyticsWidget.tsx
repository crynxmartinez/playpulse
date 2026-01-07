'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface LiveAnalyticsWidgetProps {
  projectId: string
  widgetType: string
  title: string
}

interface AnalyticsData {
  categoryScores?: Array<{ category: string; score: number; statCount: number }>
  statAverages?: Array<{ id: string; name: string; average: number; category: string | null }>
  overallScore?: number
  totalResponses?: number
}

const CATEGORY_COLORS: Record<string, string> = {
  gameplay: '#3b82f6',
  visuals: '#a855f7',
  ux: '#22c55e',
  balance: '#f97316',
  progression: '#ec4899',
  multiplayer: '#06b6d4',
  overall: '#64748b',
  uncategorized: '#6b7280',
}

export function LiveAnalyticsWidget({ projectId, widgetType, title }: LiveAnalyticsWidgetProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/analytics?timeRange=30`)
        if (res.ok) {
          const analyticsData = await res.json()
          setData(analyticsData)
        } else {
          setError('Failed to load analytics')
        }
      } catch (err) {
        setError('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [projectId])

  if (loading) {
    return (
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{widgetType}</CardDescription>
        </CardHeader>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{widgetType}</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          {error || 'No data available'}
        </CardContent>
      </Card>
    )
  }

  // Render based on widget type
  if (widgetType === 'category-breakdown' && data.categoryScores) {
    return (
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>Score breakdown by category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.categoryScores.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No category data yet</div>
          ) : (
            data.categoryScores.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{cat.category}</span>
                  <span className="font-medium">{cat.score.toFixed(1)}/10</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${(cat.score / 10) * 100}%`,
                      backgroundColor: CATEGORY_COLORS[cat.category] || '#6b7280'
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    )
  }

  if (widgetType === 'all-stats' && data.statAverages) {
    return (
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>All stat averages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 max-h-64 overflow-y-auto">
          {data.statAverages.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No stats data yet</div>
          ) : (
            data.statAverages.map((stat) => (
              <div key={stat.id} className="flex justify-between items-center text-sm py-1 border-b border-muted last:border-0">
                <span className="truncate mr-2">{stat.name}</span>
                <span className="font-medium shrink-0">{stat.average.toFixed(1)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    )
  }

  if (widgetType === 'overall-score') {
    return (
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>Overall game score</CardDescription>
        </CardHeader>
        <CardContent className="py-6 text-center">
          <div className="text-5xl font-bold text-primary">
            {data.overallScore?.toFixed(1) || '—'}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            out of 10
          </div>
          {data.totalResponses !== undefined && (
            <div className="text-xs text-muted-foreground mt-1">
              Based on {data.totalResponses} responses
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Default fallback
  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{widgetType}</CardDescription>
      </CardHeader>
      <CardContent className="py-8 text-center text-muted-foreground text-sm">
        Analytics widget: {widgetType}
      </CardContent>
    </Card>
  )
}
