'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, BarChart2, PieChart, Target } from 'lucide-react'

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

type ChartType = 'radar' | 'bar' | 'donut'

// Radar Chart Component
function RadarChart({ scores }: { scores: CategoryScore[] }) {
  if (scores.length === 0) return null

  const size = 200
  const center = size / 2
  const maxRadius = size / 2 - 30

  const angleStep = (2 * Math.PI) / scores.length
  const startAngle = -Math.PI / 2

  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep
    const radius = (value / 10) * maxRadius // value is 0-10, so divide by 10
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  }

  const gridLevels = [2.5, 5, 7.5, 10]

  const dataPoints = scores.map((s, i) => getPoint(i, s.score))
  const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <div className="flex justify-center py-2">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid circles */}
        {gridLevels.map((level) => (
          <circle
            key={level}
            cx={center}
            cy={center}
            r={(level / 10) * maxRadius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {scores.map((_, i) => {
          const point = getPoint(i, 10)
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
            r="3"
            fill="#8b5cf6"
          />
        ))}

        {/* Labels */}
        {scores.map((s, i) => {
          const labelPoint = getPoint(i, 13)
          const label = CATEGORY_LABELS[s.category] || s.category
          return (
            <g key={i}>
              <text
                x={labelPoint.x}
                y={labelPoint.y - 6}
                textAnchor="middle"
                className="fill-slate-400 text-[9px]"
              >
                {label}
              </text>
              <text
                x={labelPoint.x}
                y={labelPoint.y + 6}
                textAnchor="middle"
                className="fill-purple-400 text-[10px] font-semibold"
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

// Bar Chart Component
function BarChart({ scores }: { scores: CategoryScore[] }) {
  if (scores.length === 0) return null

  return (
    <div className="space-y-2 py-2">
      {scores.map((cat) => (
        <div key={cat.category} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">{CATEGORY_LABELS[cat.category] || cat.category}</span>
            <span className="font-medium text-white">{Math.round(cat.score * 10)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all"
              style={{ 
                width: `${cat.score * 10}%`,
                backgroundColor: CATEGORY_COLORS[cat.category] || '#6b7280'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Donut Chart Component
function DonutChart({ scores }: { scores: CategoryScore[] }) {
  if (scores.length === 0) return null

  const size = 160
  const strokeWidth = 20
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const total = scores.reduce((sum, s) => sum + s.score, 0)

  let currentOffset = 0

  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <svg width={size} height={size} className="transform -rotate-90">
        {scores.map((cat, i) => {
          const percentage = (cat.score / total) * 100
          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
          const strokeDashoffset = -currentOffset
          currentOffset += (percentage / 100) * circumference

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={CATEGORY_COLORS[cat.category] || '#6b7280'}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
            />
          )
        })}
      </svg>
      <div className="space-y-1">
        {scores.map((cat) => (
          <div key={cat.category} className="flex items-center gap-2 text-xs">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#6b7280' }}
            />
            <span className="text-slate-400">{CATEGORY_LABELS[cat.category] || cat.category}</span>
            <span className="font-medium text-white ml-auto">{Math.round(cat.score * 10)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Chart Type Toggle
function ChartToggle({ chartType, setChartType }: { chartType: ChartType; setChartType: (t: ChartType) => void }) {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => setChartType('radar')}
        className={`p-1.5 rounded-lg transition-colors ${
          chartType === 'radar' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-muted'
        }`}
        title="Radar"
      >
        <Target size={14} />
      </button>
      <button
        onClick={() => setChartType('bar')}
        className={`p-1.5 rounded-lg transition-colors ${
          chartType === 'bar' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-muted'
        }`}
        title="Bar"
      >
        <BarChart2 size={14} />
      </button>
      <button
        onClick={() => setChartType('donut')}
        className={`p-1.5 rounded-lg transition-colors ${
          chartType === 'donut' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-muted'
        }`}
        title="Donut"
      >
        <PieChart size={14} />
      </button>
    </div>
  )
}

export function LiveAnalyticsWidget({ projectId, widgetType, title }: LiveAnalyticsWidgetProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState<ChartType>('radar')

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
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>Score breakdown by category</CardDescription>
          </div>
          <ChartToggle chartType={chartType} setChartType={setChartType} />
        </CardHeader>
        <CardContent>
          {data.categoryScores.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No category data yet</div>
          ) : (
            <>
              {chartType === 'radar' && <RadarChart scores={data.categoryScores} />}
              {chartType === 'bar' && <BarChart scores={data.categoryScores} />}
              {chartType === 'donut' && <DonutChart scores={data.categoryScores} />}
            </>
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
