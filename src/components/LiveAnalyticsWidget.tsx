'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface LiveAnalyticsWidgetProps {
  projectId: string
  widgetType: string
  title: string
}

interface CategoryScore {
  category: string
  score: number
  statCount: number
}

interface AnalyticsData {
  categoryScores?: CategoryScore[]
  statAverages?: Array<{ id: string; name: string; average: number; category: string | null }>
  overallScore?: number
  totalResponses?: number
}

const CATEGORY_LABELS: Record<string, string> = {
  gameplay: 'Gameplay',
  visuals: 'Visuals & Audio',
  ux: 'User Experience',
  balance: 'Balance',
  progression: 'Progression',
  multiplayer: 'Multiplayer',
  overall: 'Overall',
  uncategorized: 'Other',
}

// Radar Chart Component
function RadarChart({ scores }: { scores: CategoryScore[] }) {
  if (scores.length === 0) return null

  const size = 280
  const center = size / 2
  const maxRadius = size / 2 - 40

  const angleStep = (2 * Math.PI) / scores.length
  const startAngle = -Math.PI / 2

  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep
    const radius = (value / 100) * maxRadius
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  }

  const gridLevels = [25, 50, 75, 100]

  const dataPoints = scores.map((s, i) => getPoint(i, s.score * 10))
  const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid circles */}
        {gridLevels.map((level) => (
          <circle
            key={level}
            cx={center}
            cy={center}
            r={(level / 100) * maxRadius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {scores.map((_, i) => {
          const point = getPoint(i, 100)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          )
        })}

        {/* Data polygon */}
        <path
          d={pathD}
          fill="rgba(139, 92, 246, 0.3)"
          stroke="#8b5cf6"
          strokeWidth="2"
        />

        {/* Data points */}
        {dataPoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#8b5cf6"
          />
        ))}

        {/* Labels */}
        {scores.map((s, i) => {
          const labelPoint = getPoint(i, 120)
          const label = CATEGORY_LABELS[s.category] || s.category
          return (
            <g key={i}>
              <text
                x={labelPoint.x}
                y={labelPoint.y - 8}
                textAnchor="middle"
                className="fill-slate-400 text-[10px]"
              >
                {label}
              </text>
              <text
                x={labelPoint.x}
                y={labelPoint.y + 6}
                textAnchor="middle"
                className="fill-purple-400 text-[11px] font-semibold"
              >
                {Math.round(s.score * 10)}%
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
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
        <CardContent>
          {data.categoryScores.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No category data yet</div>
          ) : (
            <RadarChart scores={data.categoryScores} />
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
