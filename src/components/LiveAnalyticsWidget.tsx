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

interface StatAverage {
  id: string
  name: string
  average: number
  min: number
  max: number
  category: string | null
}

interface AnalyticsData {
  categoryScores?: CategoryScore[]
  statAverages?: StatAverage[]
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
    const radius = (value / 100) * maxRadius // value is 0-100 (percentage)
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  }

  const gridLevels = [25, 50, 75, 100]

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
            r="3"
            fill="#8b5cf6"
          />
        ))}

        {/* Labels */}
        {scores.map((s, i) => {
          const labelPoint = getPoint(i, 130)
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
                {Math.round(s.score)}%
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
            <span className="font-medium text-white">{Math.round(cat.score)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all"
              style={{ 
                width: `${cat.score}%`,
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
            <span className="font-medium text-white ml-auto">{Math.round(cat.score)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Stats Radar Chart Component
function StatsRadarChart({ stats }: { stats: StatAverage[] }) {
  if (stats.length === 0) return null

  // Limit to first 8 stats for radar chart readability
  const displayStats = stats.slice(0, 8)
  
  const size = 200
  const center = size / 2
  const maxRadius = size / 2 - 30

  const angleStep = (2 * Math.PI) / displayStats.length
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

  const dataPoints = displayStats.map((s, i) => {
    const percentage = ((s.average - s.min) / (s.max - s.min)) * 100
    return getPoint(i, percentage)
  })
  const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <div className="flex justify-center py-2">
      <svg width={size} height={size} className="overflow-visible">
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

        {displayStats.map((_, i) => {
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

        <path
          d={pathD}
          fill="rgba(59, 130, 246, 0.3)"
          stroke="#3b82f6"
          strokeWidth="2"
        />

        {dataPoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="#3b82f6"
          />
        ))}

        {displayStats.map((s, i) => {
          const labelPoint = getPoint(i, 130)
          const percentage = Math.round(((s.average - s.min) / (s.max - s.min)) * 100)
          return (
            <g key={i}>
              <text
                x={labelPoint.x}
                y={labelPoint.y - 6}
                textAnchor="middle"
                className="fill-slate-400 text-[8px]"
              >
                {s.name.length > 10 ? s.name.slice(0, 10) + '...' : s.name}
              </text>
              <text
                x={labelPoint.x}
                y={labelPoint.y + 6}
                textAnchor="middle"
                className="fill-blue-400 text-[10px] font-semibold"
              >
                {percentage}%
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// Stats Bar Chart Component
function StatsBarChart({ stats }: { stats: StatAverage[] }) {
  if (stats.length === 0) return null

  return (
    <div className="space-y-2 py-2 max-h-48 overflow-y-auto">
      {stats.map((stat) => {
        const percentage = ((stat.average - stat.min) / (stat.max - stat.min)) * 100
        return (
          <div key={stat.id} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 truncate mr-2">{stat.name}</span>
              <span className="font-medium text-white shrink-0">{Math.round(percentage)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: CATEGORY_COLORS[stat.category || 'uncategorized'] || '#3b82f6'
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Stats List Component (original style)
function StatsList({ stats }: { stats: StatAverage[] }) {
  if (stats.length === 0) return null

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {stats.map((stat) => (
        <div key={stat.id} className="flex justify-between items-center text-sm py-1 border-b border-muted last:border-0">
          <span className="truncate mr-2">{stat.name}</span>
          <span className="font-medium shrink-0">{stat.average.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

// Stats Chart Type Toggle (radar, bar, list)
type StatsChartType = 'radar' | 'bar' | 'list'

function StatsChartToggle({ chartType, setChartType }: { chartType: StatsChartType; setChartType: (t: StatsChartType) => void }) {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => setChartType('radar')}
        className={`p-1.5 rounded-lg transition-colors ${
          chartType === 'radar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-muted'
        }`}
        title="Radar"
      >
        <Target size={14} />
      </button>
      <button
        onClick={() => setChartType('bar')}
        className={`p-1.5 rounded-lg transition-colors ${
          chartType === 'bar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-muted'
        }`}
        title="Bar"
      >
        <BarChart2 size={14} />
      </button>
      <button
        onClick={() => setChartType('list')}
        className={`p-1.5 rounded-lg transition-colors ${
          chartType === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-muted'
        }`}
        title="List"
      >
        <PieChart size={14} />
      </button>
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
  const [statsChartType, setStatsChartType] = useState<StatsChartType>('list')

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
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>All stat averages</CardDescription>
          </div>
          <StatsChartToggle chartType={statsChartType} setChartType={setStatsChartType} />
        </CardHeader>
        <CardContent>
          {data.statAverages.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No stats data yet</div>
          ) : (
            <>
              {statsChartType === 'radar' && <StatsRadarChart stats={data.statAverages} />}
              {statsChartType === 'bar' && <StatsBarChart stats={data.statAverages} />}
              {statsChartType === 'list' && <StatsList stats={data.statAverages} />}
            </>
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
