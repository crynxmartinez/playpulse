'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  BarChart3, TrendingUp, TrendingDown, Minus, 
  Gamepad2, ExternalLink, Sparkles 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

interface BoardData {
  board: {
    id: string
    name: string
    columns: Array<{ statId: string; label?: string; showDelta?: boolean }>
    showTrend: boolean
    showTable: boolean
    project: {
      name: string
      slug: string | null
      logoUrl: string | null
      bannerUrl: string | null
      developer: string
      stats: Array<{
        id: string
        name: string
        category: string | null
        minValue: number
        maxValue: number
      }>
    }
  }
  statsData: Record<string, { current: number; previous: number; responses: number }>
  trendData: Array<{ date: string; responses: number }>
  totalResponses: number
}

export default function PublicBoardPage() {
  const params = useParams()
  const token = params.token as string

  const [data, setData] = useState<BoardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBoard()
  }, [token])

  const fetchBoard = async () => {
    try {
      const res = await fetch(`/api/board/${token}`)
      if (!res.ok) {
        setError('Board not found')
        return
      }
      const boardData = await res.json()
      setData(boardData)
    } catch (err) {
      setError('Failed to load board')
    } finally {
      setLoading(false)
    }
  }

  const getDeltaIcon = (current: number, previous: number) => {
    const delta = current - previous
    if (Math.abs(delta) < 1) return <Minus className="h-3 w-3 text-slate-400" />
    if (delta > 0) return <TrendingUp className="h-3 w-3 text-green-400" />
    return <TrendingDown className="h-3 w-3 text-red-400" />
  }

  const getDeltaColor = (current: number, previous: number) => {
    const delta = current - previous
    if (Math.abs(delta) < 1) return 'text-slate-400'
    if (delta > 0) return 'text-green-400'
    return 'text-red-400'
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getBarColor = (score: number) => {
    if (score >= 70) return '#22c55e'
    if (score >= 40) return '#eab308'
    return '#ef4444'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Card className="rounded-3xl border-[#1a1a2e] bg-[#0d0d15] max-w-md">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2 text-white">Board Not Found</h2>
            <p className="text-muted-foreground text-sm">
              This progress board doesn't exist or is private.
            </p>
            <Button className="rounded-2xl mt-4" asChild>
              <Link href="/discover">Discover Games</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { board, statsData, trendData, totalResponses } = data
  const chartData = board.columns
    .map(col => {
      const stat = board.project.stats.find(s => s.id === col.statId)
      const statData = statsData[col.statId]
      if (!stat || !statData) return null
      return {
        name: col.label || stat.name,
        score: Math.round(statData.current),
        previous: Math.round(statData.previous),
        delta: Math.round(statData.current - statData.previous),
        responses: statData.responses,
      }
    })
    .filter(Boolean) as Array<{ name: string; score: number; previous: number; delta: number; responses: number }>

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="border-b border-[#1a1a2e] bg-[#0d0d15]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#1a1a2e] border border-[#2a2a3e]">
                {board.project.logoUrl ? (
                  <img src={board.project.logoUrl} alt={board.project.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
                    <Gamepad2 className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">{board.name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{board.project.name}</span>
                  <span>•</span>
                  <span>by {board.project.developer}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="rounded-full bg-primary/20 text-primary border-0">
                {totalResponses} responses
              </Badge>
              {board.project.slug && (
                <Button size="sm" variant="outline" className="rounded-xl border-[#2a2a3e]" asChild>
                  <Link href={`/g/${board.project.slug}`}>
                    <ExternalLink className="h-3 w-3 mr-1" /> View Game
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Stats Grid */}
        {board.showTable && chartData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {chartData.map((stat, i) => (
              <Card key={i} className="rounded-2xl border-[#1a1a2e] bg-[#0d0d15]/50">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 truncate">{stat.name}</div>
                  <div className="flex items-end justify-between">
                    <div className={`text-3xl font-bold ${getScoreColor(stat.score)}`}>
                      {stat.score}%
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${getDeltaColor(stat.score, stat.previous)}`}>
                      {getDeltaIcon(stat.score, stat.previous)}
                      <span>{stat.delta > 0 ? '+' : ''}{stat.delta}%</span>
                    </div>
                  </div>
                  {/* Mini progress bar */}
                  <div className="mt-3 h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${stat.score}%`,
                        backgroundColor: getBarColor(stat.score)
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Stats Comparison */}
          {board.showTable && chartData.length > 0 && (
            <Card className="rounded-3xl border-[#1a1a2e] bg-[#0d0d15]/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Stats Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} stroke="#666" fontSize={12} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="#666" 
                        fontSize={11}
                        width={80}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0d0d15',
                          border: '1px solid #2a2a3e',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                        formatter={(value) => [`${value}%`, 'Score']}
                      />
                      <Bar 
                        dataKey="score" 
                        radius={[0, 4, 4, 0]}
                        fill="#8b5cf6"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trend Chart */}
          {board.showTrend && trendData.length > 0 && (
            <Card className="rounded-3xl border-[#1a1a2e] bg-[#0d0d15]/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Response Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#666" 
                        fontSize={11}
                        tickFormatter={(date) => {
                          const d = new Date(date)
                          return `${d.getMonth() + 1}/${d.getDate()}`
                        }}
                      />
                      <YAxis stroke="#666" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0d0d15',
                          border: '1px solid #2a2a3e',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        formatter={(value) => [value, 'Responses']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="responses" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: '#a78bfa' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-[#1a1a2e]">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Powered by</span>
            <Link href="/" className="text-primary hover:underline font-medium">
              PlayPulse
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
