'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { LineChart, BarChart2, TrendingUp, FileText, MessageSquare } from 'lucide-react'

interface StatAverage {
  name: string
  average: number
  count: number
  min: number
  max: number
}

interface DailyResponse {
  date: string
  count: number
}

interface AnalyticsData {
  statAverages: StatAverage[]
  dailyResponses: DailyResponse[]
  totalResponses: number
  totalForms: number
  activeForms: number
}

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

      {/* Stat Averages */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 className="text-purple-600" size={24} />
          <h3 className="text-lg font-semibold text-slate-800">Stat Averages</h3>
        </div>

        {data.statAverages.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No data yet. Create stats and collect responses to see averages.</p>
        ) : (
          <div className="space-y-4">
            {data.statAverages.map((stat) => {
              const percentage = getPercentage(stat)
              return (
                <div key={stat.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{stat.name}</span>
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
