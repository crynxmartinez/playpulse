'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Users, 
  Gamepad2,
  FileText,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  Clock,
  Globe
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ReportData {
  stats: {
    totalUsers: number
    verifiedUsers: number
    unverifiedUsers: number
    totalGames: number
    publicGames: number
    privateGames: number
    totalForms: number
    totalResponses: number
    recentSignups: number
    recentGames: number
    recentResponses: number
  }
  topGames: Array<{
    id: string
    name: string
    visibility: string
    user: { displayName: string | null; name: string | null }
    _count: { forms: number }
  }>
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  color = 'purple'
}: { 
  icon: React.ElementType
  label: string
  value: number | string
  subValue?: string
  color?: 'purple' | 'blue' | 'green' | 'yellow' | 'red'
}) {
  const colors = {
    purple: 'bg-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/20 text-red-400',
  }

  return (
    <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
            {subValue && <p className="text-xs text-green-400">{subValue}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/reports')
      const result = await res.json()
      if (result.stats) {
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-slate-400">
        Failed to load reports
      </div>
    )
  }

  const { stats, topGames } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-purple-400" />
          Platform Reports
        </h1>
        <p className="text-slate-400 mt-1">Overview of platform activity and growth</p>
      </div>

      {/* Recent Activity (Last 7 Days) */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-400" />
          Last 7 Days
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard 
            icon={Users} 
            label="New Signups" 
            value={stats.recentSignups}
            color="green"
          />
          <StatCard 
            icon={Gamepad2} 
            label="New Games" 
            value={stats.recentGames}
            color="blue"
          />
          <StatCard 
            icon={MessageSquare} 
            label="New Responses" 
            value={stats.recentResponses}
            color="purple"
          />
        </div>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-400" />
          Users
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard 
            icon={Users} 
            label="Total Users" 
            value={stats.totalUsers}
            color="blue"
          />
          <StatCard 
            icon={CheckCircle} 
            label="Verified" 
            value={stats.verifiedUsers}
            subValue={`${Math.round((stats.verifiedUsers / stats.totalUsers) * 100) || 0}%`}
            color="green"
          />
          <StatCard 
            icon={Clock} 
            label="Unverified" 
            value={stats.unverifiedUsers}
            color="yellow"
          />
        </div>
      </div>

      {/* Game Stats */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-purple-400" />
          Games
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard 
            icon={Gamepad2} 
            label="Total Games" 
            value={stats.totalGames}
            color="purple"
          />
          <StatCard 
            icon={Globe} 
            label="Public Games" 
            value={stats.publicGames}
            color="green"
          />
          <StatCard 
            icon={FileText} 
            label="Total Forms" 
            value={stats.totalForms}
            color="blue"
          />
        </div>
      </div>

      {/* Responses */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-green-400" />
          Engagement
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard 
            icon={MessageSquare} 
            label="Total Responses" 
            value={stats.totalResponses}
            color="green"
          />
          <StatCard 
            icon={BarChart3} 
            label="Avg Responses/Form" 
            value={stats.totalForms > 0 ? (stats.totalResponses / stats.totalForms).toFixed(1) : '0'}
            color="purple"
          />
        </div>
      </div>

      {/* Top Games */}
      <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            Top Games by Forms
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topGames.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No games yet</p>
          ) : (
            <div className="space-y-3">
              {topGames.map((game, index) => (
                <div 
                  key={game.id} 
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a2e]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{game.name}</p>
                      <p className="text-xs text-slate-400">
                        by {game.user.displayName || game.user.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{game._count.forms}</p>
                    <p className="text-xs text-slate-400">forms</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
