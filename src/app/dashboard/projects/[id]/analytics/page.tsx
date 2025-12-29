'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { LineChart, BarChart2, TrendingUp, FileText, MessageSquare, Lightbulb, PieChart } from 'lucide-react'

interface StatAverage {
  name: string
  average: number
  count: number
  min: number
  max: number
  category: string | null
  weight: number
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

interface AnalyticsData {
  statAverages: StatAverage[]
  categoryScores: CategoryScore[]
  insights: string[]
  dailyResponses: DailyResponse[]
  totalResponses: number
  totalForms: number
  activeForms: number
}

const STAT_CATEGORIES = [
  { value: 'gameplay', label: 'Gameplay', color: 'bg-blue-500', textColor: 'text-blue-600', lightColor: 'bg-blue-100' },
  { value: 'visuals', label: 'Visuals & Audio', color: 'bg-purple-500', textColor: 'text-purple-600', lightColor: 'bg-purple-100' },
  { value: 'ux', label: 'User Experience', color: 'bg-green-500', textColor: 'text-green-600', lightColor: 'bg-green-100' },
  { value: 'balance', label: 'Balance', color: 'bg-orange-500', textColor: 'text-orange-600', lightColor: 'bg-orange-100' },
  { value: 'progression', label: 'Progression', color: 'bg-pink-500', textColor: 'text-pink-600', lightColor: 'bg-pink-100' },
  { value: 'multiplayer', label: 'Multiplayer', color: 'bg-cyan-500', textColor: 'text-cyan-600', lightColor: 'bg-cyan-100' },
  { value: 'overall', label: 'Overall', color: 'bg-slate-500', textColor: 'text-slate-600', lightColor: 'bg-slate-100' },
  { value: 'uncategorized', label: 'Other', color: 'bg-gray-500', textColor: 'text-gray-600', lightColor: 'bg-gray-100' },
]

export default function AnalyticsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [projectId])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/analytics`)
      const analyticsData = await res.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPercentage = (stat: StatAverage) => {
    return Math.round(((stat.average - stat.min) / (stat.max - stat.min)) * 100)
  }

  const getBarColor = (percentage: number) => {
    if (percentage >= 70) return 'from-green-500 to-emerald-500'
    if (percentage >= 40) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-pink-500'
  }

  const getCategoryInfo = (categoryValue: string) => {
    return STAT_CATEGORIES.find(c => c.value === categoryValue) || STAT_CATEGORIES[STAT_CATEGORIES.length - 1]
  }

  // Simple radar chart using CSS
  const RadarChart = ({ scores }: { scores: CategoryScore[] }) => {
    if (scores.length === 0) return null
    
    const size = 200
    const center = size / 2
    const radius = 80
    const angleStep = (2 * Math.PI) / scores.length
    
    // Calculate points for the polygon
    const points = scores.map((score, i) => {
      const angle = angleStep * i - Math.PI / 2
      const r = (score.score / 100) * radius
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        labelX: center + (radius + 25) * Math.cos(angle),
        labelY: center + (radius + 25) * Math.sin(angle),
        score,
      }
    })
    
    const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ')
    
    // Grid lines
    const gridLevels = [25, 50, 75, 100]
    
    return (
      <div className="flex justify-center">
        <svg width={size + 60} height={size + 60} viewBox={`-30 -30 ${size + 60} ${size + 60}`}>
          {/* Grid circles */}
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
          
          {/* Grid lines from center */}
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
          
          {/* Data polygon */}
          <polygon
            points={polygonPoints}
            fill="rgba(147, 51, 234, 0.3)"
            stroke="#9333ea"
            strokeWidth="2"
          />
          
          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#9333ea"
            />
          ))}
          
          {/* Labels */}
          {points.map((p, i) => {
            const catInfo = getCategoryInfo(p.score.category)
            return (
              <text
                key={i}
                x={p.labelX}
                y={p.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-slate-600"
              >
                {catInfo.label}
              </text>
            )
          })}
        </svg>
      </div>
    )
  }

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

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Analytics</h2>

      {/* Insights Panel */}
      {data.insights.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="text-purple-600" size={24} />
            <h3 className="text-lg font-semibold text-slate-800">Key Insights</h3>
          </div>
          <div className="space-y-2">
            {data.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">•</span>
                <p className="text-slate-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <MessageSquare className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{data.totalResponses}</p>
              <p className="text-sm text-slate-500">Total Responses</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{data.totalForms}</p>
              <p className="text-sm text-slate-500">Total Forms</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{data.activeForms}</p>
              <p className="text-sm text-slate-500">Active Forms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Scores with Radar Chart */}
      {data.categoryScores.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Radar Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="text-purple-600" size={24} />
              <h3 className="text-lg font-semibold text-slate-800">Category Overview</h3>
            </div>
            <RadarChart scores={data.categoryScores} />
          </div>

          {/* Category Bars */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="text-purple-600" size={24} />
              <h3 className="text-lg font-semibold text-slate-800">Category Scores</h3>
            </div>
            <div className="space-y-4">
              {data.categoryScores.map((cat) => {
                const catInfo = getCategoryInfo(cat.category)
                return (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${catInfo.color}`} />
                        <span className="font-medium text-slate-700">{catInfo.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-800">{cat.score}%</span>
                        <span className="text-xs text-slate-400">({cat.statCount} stats)</span>
                      </div>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${catInfo.color} rounded-full transition-all duration-500`}
                        style={{ width: `${cat.score}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Stat Averages */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 className="text-purple-600" size={24} />
          <h3 className="text-lg font-semibold text-slate-800">Individual Stat Averages</h3>
        </div>

        {data.statAverages.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No data yet. Create stats and collect responses to see averages.</p>
        ) : (
          <div className="space-y-4">
            {data.statAverages.map((stat) => {
              const percentage = getPercentage(stat)
              const catInfo = stat.category ? getCategoryInfo(stat.category) : null
              return (
                <div key={stat.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">{stat.name}</span>
                      {catInfo && (
                        <span className={`text-xs px-2 py-0.5 rounded ${catInfo.lightColor} ${catInfo.textColor}`}>
                          {catInfo.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-800">{stat.average}</span>
                      <span className="text-sm text-slate-400">/ {stat.max}</span>
                      <span className="text-sm text-slate-500">({stat.count} responses)</span>
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
        )}
      </div>

      {/* Response Trend */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <LineChart className="text-purple-600" size={24} />
          <h3 className="text-lg font-semibold text-slate-800">Response Trend (Last 30 Days)</h3>
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
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {day.count} responses
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
                {index % 5 === 0 && (
                  <span className="text-xs text-slate-400 mt-2 -rotate-45 origin-left">
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
