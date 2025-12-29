'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { 
  LineChart, BarChart2, TrendingUp, TrendingDown, FileText, MessageSquare, 
  Lightbulb, PieChart, Filter, Calendar, Target, ArrowUp, ArrowDown, Minus
} from 'lucide-react'

interface StatAverage {
  id: string
  name: string
  average: number
  count: number
  min: number
  max: number
  category: string | null
  weight: number
  trend: number
  values: number[]
}

interface CategoryScore {
  category: string
  score: number
  statCount: number
}

interface DailyResponse {
  date: string
  count: number
}

interface FormInfo {
  id: string
  title: string
  isActive: boolean
  responseCount: number
}

interface ScoreDistribution {
  high: number
  medium: number
  low: number
}

interface AnalyticsData {
  statAverages: StatAverage[]
  categoryScores: CategoryScore[]
  insights: string[]
  dailyResponses: DailyResponse[]
  totalResponses: number
  totalForms: number
  activeForms: number
  formsList: FormInfo[]
  overallScore: number
  scoreDistribution: ScoreDistribution
  timeRange: number
  formFilter: string
}

type ChartType = 'bar' | 'donut' | 'radar'

const STAT_CATEGORIES = [
  { value: 'gameplay', label: 'Gameplay', color: 'bg-blue-500', textColor: 'text-blue-600', lightColor: 'bg-blue-100', hex: '#3b82f6' },
  { value: 'visuals', label: 'Visuals & Audio', color: 'bg-purple-500', textColor: 'text-purple-600', lightColor: 'bg-purple-100', hex: '#a855f7' },
  { value: 'ux', label: 'User Experience', color: 'bg-green-500', textColor: 'text-green-600', lightColor: 'bg-green-100', hex: '#22c55e' },
  { value: 'balance', label: 'Balance', color: 'bg-orange-500', textColor: 'text-orange-600', lightColor: 'bg-orange-100', hex: '#f97316' },
  { value: 'progression', label: 'Progression', color: 'bg-pink-500', textColor: 'text-pink-600', lightColor: 'bg-pink-100', hex: '#ec4899' },
  { value: 'multiplayer', label: 'Multiplayer', color: 'bg-cyan-500', textColor: 'text-cyan-600', lightColor: 'bg-cyan-100', hex: '#06b6d4' },
  { value: 'overall', label: 'Overall', color: 'bg-slate-500', textColor: 'text-slate-600', lightColor: 'bg-slate-100', hex: '#64748b' },
  { value: 'uncategorized', label: 'Other', color: 'bg-gray-500', textColor: 'text-gray-600', lightColor: 'bg-gray-100', hex: '#6b7280' },
]

const TIME_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last year' },
]

export default function AnalyticsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [formFilter, setFormFilter] = useState('all')
  const [timeRange, setTimeRange] = useState('30')
  const [categoryChartType, setCategoryChartType] = useState<ChartType>('radar')
  const [statsChartType, setStatsChartType] = useState<ChartType>('bar')

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects/${projectId}/analytics?formId=${formFilter}&timeRange=${timeRange}`)
      const analyticsData = await res.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId, formFilter, timeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const getPercentage = (stat: StatAverage) => {
    return Math.round(((stat.average - stat.min) / (stat.max - stat.min)) * 100)
  }

  const getBarColor = (percentage: number) => {
    if (percentage >= 70) return 'from-green-500 to-emerald-500'
    if (percentage >= 40) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-pink-500'
  }

  const getTierLabel = (percentage: number) => {
    if (percentage >= 70) return { label: 'Excellent', color: 'text-green-600 bg-green-50' }
    if (percentage >= 40) return { label: 'Good', color: 'text-yellow-600 bg-yellow-50' }
    return { label: 'Needs Work', color: 'text-red-600 bg-red-50' }
  }

  const getCategoryInfo = (categoryValue: string) => {
    return STAT_CATEGORIES.find(c => c.value === categoryValue) || STAT_CATEGORIES[STAT_CATEGORIES.length - 1]
  }

  // Radar Chart Component
  const RadarChart = ({ scores }: { scores: CategoryScore[] }) => {
    if (scores.length === 0) return null
    
    const size = 220
    const center = size / 2
    const radius = 85
    const angleStep = (2 * Math.PI) / scores.length
    
    const points = scores.map((score, i) => {
      const angle = angleStep * i - Math.PI / 2
      const r = (score.score / 100) * radius
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        labelX: center + (radius + 30) * Math.cos(angle),
        labelY: center + (radius + 30) * Math.sin(angle),
        score,
      }
    })
    
    const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ')
    const gridLevels = [25, 50, 75, 100]
    
    return (
      <div className="flex justify-center">
        <svg width={size + 80} height={size + 80} viewBox={`-40 -40 ${size + 80} ${size + 80}`}>
          {gridLevels.map(level => (
            <circle
              key={level}
              cx={center}
              cy={center}
              r={(level / 100) * radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          ))}
          
          {scores.map((_, i) => {
            const angle = angleStep * i - Math.PI / 2
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={center + radius * Math.cos(angle)}
                y2={center + radius * Math.sin(angle)}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            )
          })}
          
          <polygon
            points={polygonPoints}
            fill="rgba(147, 51, 234, 0.25)"
            stroke="#9333ea"
            strokeWidth="2.5"
          />
          
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="5" fill="#9333ea" />
          ))}
          
          {points.map((p, i) => {
            const catInfo = getCategoryInfo(p.score.category)
            return (
              <g key={i}>
                <text
                  x={p.labelX}
                  y={p.labelY - 6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium fill-slate-700"
                >
                  {catInfo.label}
                </text>
                <text
                  x={p.labelX}
                  y={p.labelY + 8}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-bold fill-purple-600"
                >
                  {p.score.score}%
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  // Donut Chart Component
  const DonutChart = ({ scores }: { scores: CategoryScore[] }) => {
    if (scores.length === 0) return null
    
    const size = 200
    const strokeWidth = 35
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const total = scores.reduce((sum, s) => sum + s.score, 0)
    
    let currentOffset = 0
    
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />
            {scores.map((score, i) => {
              const catInfo = getCategoryInfo(score.category)
              const percentage = score.score / total
              const dashLength = percentage * circumference
              const offset = currentOffset
              currentOffset += dashLength
              
              return (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={catInfo.hex}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={-offset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  className="transition-all duration-500"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-800">
              {Math.round(total / scores.length)}%
            </span>
            <span className="text-xs text-slate-500">Average</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {scores.map((score) => {
            const catInfo = getCategoryInfo(score.category)
            return (
              <div key={score.category} className="flex items-center gap-1.5 text-xs">
                <span className={`w-2.5 h-2.5 rounded-full ${catInfo.color}`} />
                <span className="text-slate-600">{catInfo.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Bar Chart Component for Categories
  const CategoryBarChart = ({ scores }: { scores: CategoryScore[] }) => {
    const maxScore = Math.max(...scores.map(s => s.score), 100)
    
    return (
      <div className="space-y-3">
        {scores.map((cat) => {
          const catInfo = getCategoryInfo(cat.category)
          return (
            <div key={cat.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${catInfo.color}`} />
                  <span className="font-medium text-slate-700">{catInfo.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{cat.score}%</span>
                  <span className="text-xs text-slate-400">({cat.statCount})</span>
                </div>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${catInfo.color} rounded-full transition-all duration-500`}
                  style={{ width: `${(cat.score / maxScore) * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Score Distribution Donut
  const ScoreDistributionDonut = ({ distribution }: { distribution: ScoreDistribution }) => {
    const total = distribution.high + distribution.medium + distribution.low
    if (total === 0) return null
    
    const size = 120
    const strokeWidth = 20
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    
    const segments = [
      { value: distribution.high, color: '#22c55e', label: 'Excellent' },
      { value: distribution.medium, color: '#f59e0b', label: 'Good' },
      { value: distribution.low, color: '#ef4444', label: 'Needs Work' },
    ]
    
    let currentOffset = 0
    
    return (
      <div className="flex items-center gap-4">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg, i) => {
            if (seg.value === 0) return null
            const percentage = seg.value / total
            const dashLength = percentage * circumference
            const offset = currentOffset
            currentOffset += dashLength
            
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            )
          })}
        </svg>
        <div className="space-y-1">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-slate-600">{seg.label}:</span>
              <span className="font-semibold text-slate-800">{seg.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Chart Type Selector
  const ChartTypeSelector = ({ value, onChange }: { value: ChartType; onChange: (v: ChartType) => void }) => (
    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
      <button
        onClick={() => onChange('bar')}
        className={`p-1.5 rounded ${value === 'bar' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
        title="Bar Chart"
      >
        <BarChart2 size={16} className={value === 'bar' ? 'text-purple-600' : 'text-slate-500'} />
      </button>
      <button
        onClick={() => onChange('donut')}
        className={`p-1.5 rounded ${value === 'donut' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
        title="Donut Chart"
      >
        <PieChart size={16} className={value === 'donut' ? 'text-purple-600' : 'text-slate-500'} />
      </button>
      <button
        onClick={() => onChange('radar')}
        className={`p-1.5 rounded ${value === 'radar' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
        title="Radar Chart"
      >
        <Target size={16} className={value === 'radar' ? 'text-purple-600' : 'text-slate-500'} />
      </button>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Failed to load analytics</p>
      </div>
    )
  }

  const maxDailyCount = Math.max(...data.dailyResponses.map(d => d.count), 1)
  const statsWithData = data.statAverages.filter(s => s.count > 0)

  return (
    <div>
      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Analytics</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Form Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={formFilter}
              onChange={(e) => setFormFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
            >
              <option value="all">All Forms</option>
              {data.formsList.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.title} ({form.responseCount})
                </option>
              ))}
            </select>
          </div>

          {/* Time Range */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
            >
              {TIME_RANGES.map((range) => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overall Score Card */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-purple-200 text-sm mb-1">Overall Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold">{data.overallScore}</span>
              <span className="text-2xl text-purple-200">/ 100</span>
            </div>
            <p className="text-purple-200 text-sm mt-2">
              Based on {data.totalResponses} responses across {data.totalForms} forms
            </p>
          </div>
          <ScoreDistributionDonut distribution={data.scoreDistribution} />
        </div>
      </div>

      {/* Insights Panel */}
      {data.insights.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="text-purple-600" size={20} />
            <h3 className="font-semibold text-slate-800">Key Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 bg-white/60 rounded-lg px-3 py-2">
                <span className="text-purple-500 mt-0.5">•</span>
                <p className="text-sm text-slate-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <MessageSquare className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{data.totalResponses}</p>
              <p className="text-xs text-slate-500">Responses</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{data.totalForms}</p>
              <p className="text-xs text-slate-500">Forms</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{data.activeForms}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <BarChart2 className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{statsWithData.length}</p>
              <p className="text-xs text-slate-500">Stats Tracked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards Row */}
      {statsWithData.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Stat Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {statsWithData.slice(0, 10).map((stat) => {
              const percentage = getPercentage(stat)
              const tier = getTierLabel(percentage)
              const catInfo = stat.category ? getCategoryInfo(stat.category) : null
              
              return (
                <div key={stat.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate text-sm">{stat.name}</p>
                      {catInfo && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${catInfo.lightColor} ${catInfo.textColor}`}>
                          {catInfo.label}
                        </span>
                      )}
                    </div>
                    {stat.trend !== 0 && (
                      <div className={`flex items-center gap-0.5 text-xs ${stat.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.trend > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        {Math.abs(stat.trend)}%
                      </div>
                    )}
                    {stat.trend === 0 && stat.count > 1 && (
                      <div className="flex items-center gap-0.5 text-xs text-slate-400">
                        <Minus size={12} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold text-slate-800">{stat.average}</span>
                    <span className="text-sm text-slate-400">/ {stat.max}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full bg-gradient-to-r ${getBarColor(percentage)} rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tier.color}`}>{tier.label}</span>
                    <span className="text-xs text-slate-400">{stat.count} resp</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Category Scores */}
      {data.categoryScores.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="text-purple-600" size={24} />
              <h3 className="text-lg font-semibold text-slate-800">Category Breakdown</h3>
            </div>
            <ChartTypeSelector value={categoryChartType} onChange={setCategoryChartType} />
          </div>
          
          <div className="flex justify-center">
            {categoryChartType === 'radar' && <RadarChart scores={data.categoryScores} />}
            {categoryChartType === 'donut' && <DonutChart scores={data.categoryScores} />}
            {categoryChartType === 'bar' && (
              <div className="w-full max-w-xl">
                <CategoryBarChart scores={data.categoryScores} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Individual Stats */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="text-purple-600" size={24} />
            <h3 className="text-lg font-semibold text-slate-800">All Stats</h3>
          </div>
          <ChartTypeSelector value={statsChartType} onChange={setStatsChartType} />
        </div>

        {statsWithData.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No data yet. Collect responses to see stats.</p>
        ) : statsChartType === 'bar' ? (
          <div className="space-y-3">
            {data.statAverages.map((stat) => {
              const percentage = getPercentage(stat)
              const catInfo = stat.category ? getCategoryInfo(stat.category) : null
              return (
                <div key={stat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">{stat.name}</span>
                      {catInfo && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${catInfo.lightColor} ${catInfo.textColor}`}>
                          {catInfo.label}
                        </span>
                      )}
                      {stat.trend !== 0 && (
                        <span className={`flex items-center gap-0.5 text-xs ${stat.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {Math.abs(stat.trend)}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{stat.average}</span>
                      <span className="text-slate-400">/ {stat.max}</span>
                      <span className="text-xs text-slate-400">({stat.count})</span>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getBarColor(percentage)} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : statsChartType === 'donut' ? (
          <div className="flex justify-center">
            <DonutChart scores={data.statAverages.filter(s => s.count > 0).map(s => ({
              category: s.name,
              score: getPercentage(s),
              statCount: s.count
            }))} />
          </div>
        ) : (
          <div className="flex justify-center">
            <RadarChart scores={data.statAverages.filter(s => s.count > 0).slice(0, 8).map(s => ({
              category: s.name,
              score: getPercentage(s),
              statCount: s.count
            }))} />
          </div>
        )}
      </div>

      {/* Response Trend */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <LineChart className="text-purple-600" size={24} />
          <h3 className="text-lg font-semibold text-slate-800">
            Response Trend ({TIME_RANGES.find(r => r.value === timeRange)?.label})
          </h3>
        </div>

        {data.totalResponses === 0 ? (
          <p className="text-slate-500 text-center py-8">No responses yet. Share your forms to start collecting data.</p>
        ) : (
          <div className="h-48 flex items-end gap-1">
            {data.dailyResponses.map((day, index) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center justify-end group"
              >
                <div className="relative w-full">
                  {day.count > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {day.count} responses
                      <br />
                      <span className="text-slate-300">{new Date(day.date).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      day.count > 0 
                        ? 'bg-gradient-to-t from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500' 
                        : 'bg-slate-100'
                    }`}
                    style={{ 
                      height: `${Math.max((day.count / maxDailyCount) * 160, day.count > 0 ? 8 : 2)}px` 
                    }}
                  />
                </div>
                {index % Math.ceil(data.dailyResponses.length / 6) === 0 && (
                  <span className="text-xs text-slate-400 mt-2 -rotate-45 origin-left whitespace-nowrap">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
