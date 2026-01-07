'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { 
  LineChart, BarChart2, TrendingUp, TrendingDown, FileText, MessageSquare, 
  Lightbulb, PieChart, Filter, Calendar, Target, ArrowUp, ArrowDown, Minus,
  Camera, Check, Loader2, Pin, PinOff
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { domToBlob } from 'modern-screenshot'

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
  { value: 'overall', label: 'Overall', color: 'bg-slate-500', textColor: 'text-slate-600', lightColor: 'bg-[#1a1a2e]', hex: '#64748b' },
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
  
  // Snapshot state
  const [snapshotLoading, setSnapshotLoading] = useState<string | null>(null)
  const [snapshotSuccess, setSnapshotSuccess] = useState<string | null>(null)
  const [snapshotModal, setSnapshotModal] = useState<{
    isOpen: boolean
    imageData: string
    type: string
    defaultName: string
  } | null>(null)
  const [snapshotName, setSnapshotName] = useState('')
  
  // Pin analytics widget state
  const [pinLoading, setPinLoading] = useState<string | null>(null)
  const [pinnedWidgets, setPinnedWidgets] = useState<Set<string>>(new Set())
  
  // Refs for snapshot sections
  const overallScoreRef = useRef<HTMLDivElement>(null)
  const insightsRef = useRef<HTMLDivElement>(null)
  const summaryCardsRef = useRef<HTMLDivElement>(null)
  const statPerformanceRef = useRef<HTMLDivElement>(null)
  const categoryBreakdownRef = useRef<HTMLDivElement>(null)
  const allStatsRef = useRef<HTMLDivElement>(null)
  const responseTrendRef = useRef<HTMLDivElement>(null)

  // Capture snapshot function
  const captureSnapshot = async (
    ref: React.RefObject<HTMLDivElement | null>,
    type: string,
    defaultName: string
  ) => {
    if (!ref.current) return
    
    setSnapshotLoading(type)
    setSnapshotSuccess(null)
    
    try {
      // Use modern-screenshot which supports lab() colors
      const blob = await domToBlob(ref.current, {
        backgroundColor: '#0d0d15',
        scale: 2,
        type: 'image/webp',
        quality: 0.9,
      })
      
      if (!blob) {
        throw new Error('Failed to create image blob')
      }
      
      // Convert blob to base64
      const reader = new FileReader()
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      
      // Show custom modal for naming
      setSnapshotName(defaultName)
      setSnapshotModal({
        isOpen: true,
        imageData,
        type,
        defaultName,
      })
    } catch (error) {
      console.error('Failed to capture snapshot:', error)
      alert('Failed to capture snapshot. Please try again.')
      setSnapshotLoading(null)
    }
  }

  // Save snapshot from modal
  const saveSnapshot = async () => {
    if (!snapshotModal) return
    
    try {
      const res = await fetch(`/api/projects/${projectId}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: snapshotName || snapshotModal.defaultName,
          type: snapshotModal.type,
          imageData: snapshotModal.imageData,
          formId: formFilter !== 'all' ? formFilter : null,
          metadata: {
            timeRange,
            formFilter,
            capturedAt: new Date().toISOString(),
          },
        }),
      })
      
      if (res.ok) {
        setSnapshotSuccess(snapshotModal.type)
        setTimeout(() => setSnapshotSuccess(null), 2000)
        setSnapshotModal(null)
        setSnapshotName('')
      } else {
        const error = await res.json()
        alert(`Failed to save snapshot: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to save snapshot:', error)
      alert('Failed to save snapshot. Please try again.')
    } finally {
      setSnapshotLoading(null)
    }
  }

  // Cancel snapshot modal
  const cancelSnapshot = () => {
    setSnapshotModal(null)
    setSnapshotName('')
    setSnapshotLoading(null)
  }

  // Snapshot button component
  const SnapshotButton = ({ 
    sectionRef, 
    type, 
    defaultName 
  }: { 
    sectionRef: React.RefObject<HTMLDivElement | null>
    type: string
    defaultName: string 
  }) => (
    <button
      onClick={() => captureSnapshot(sectionRef, type, defaultName)}
      disabled={snapshotLoading === type}
      className={`p-1.5 rounded-lg transition-colors ${
        snapshotSuccess === type 
          ? 'bg-green-100 text-green-600' 
          : 'hover:bg-[#1a1a2e] text-slate-400 hover:text-slate-600'
      }`}
      title="Save as snapshot"
    >
      {snapshotLoading === type ? (
        <Loader2 size={16} className="animate-spin" />
      ) : snapshotSuccess === type ? (
        <Check size={16} />
      ) : (
        <Camera size={16} />
      )}
    </button>
  )

  // Pin button component for analytics widgets
  const PinButton = ({ 
    widgetType, 
    title 
  }: { 
    widgetType: string
    title: string 
  }) => {
    const isPinned = pinnedWidgets.has(widgetType)
    return (
      <button
        onClick={() => handleTogglePin(widgetType, title)}
        disabled={pinLoading === widgetType}
        className={`p-1.5 rounded-lg transition-colors ${
          isPinned 
            ? 'bg-purple-600 text-white' 
            : 'hover:bg-[#1a1a2e] text-slate-400 hover:text-purple-400'
        }`}
        title={isPinned ? 'Unpin from Game Page' : 'Pin to Game Page'}
      >
        {pinLoading === widgetType ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isPinned ? (
          <PinOff size={16} />
        ) : (
          <Pin size={16} />
        )}
      </button>
    )
  }

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

  // Fetch pinned analytics widgets
  const fetchPinnedWidgets = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/pinned`)
      const data = await res.json()
      if (data.pinnedSections) {
        const pinnedIds = new Set<string>(
          data.pinnedSections
            .filter((p: { type: string; widgetType: string | null }) => p.type === 'ANALYTICS' && p.widgetType)
            .map((p: { widgetType: string }) => p.widgetType)
        )
        setPinnedWidgets(pinnedIds)
      }
    } catch (error) {
      console.error('Failed to fetch pinned widgets:', error)
    }
  }, [projectId])

  // Toggle pin for analytics widget (max 2 allowed)
  const MAX_PINNED_ANALYTICS = 2
  
  const handleTogglePin = async (widgetType: string, title: string) => {
    const isPinned = pinnedWidgets.has(widgetType)
    
    // Check limit before pinning
    if (!isPinned && pinnedWidgets.size >= MAX_PINNED_ANALYTICS) {
      alert(`You can only pin up to ${MAX_PINNED_ANALYTICS} live analytics. Unpin one first.`)
      return
    }
    
    setPinLoading(widgetType)
    
    try {
      if (isPinned) {
        // Find and delete the pinned section
        const res = await fetch(`/api/projects/${projectId}/pinned`)
        const data = await res.json()
        const pinnedSection = data.pinnedSections?.find(
          (p: { type: string; widgetType: string | null }) => p.type === 'ANALYTICS' && p.widgetType === widgetType
        )
        if (pinnedSection) {
          await fetch(`/api/projects/${projectId}/pinned/${pinnedSection.id}`, {
            method: 'DELETE',
          })
          setPinnedWidgets(prev => {
            const next = new Set(prev)
            next.delete(widgetType)
            return next
          })
        }
      } else {
        // Create new pinned section
        const res = await fetch(`/api/projects/${projectId}/pinned`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ANALYTICS',
            widgetType,
            title,
            widgetConfig: { formFilter, timeRange },
          }),
        })
        if (res.ok) {
          setPinnedWidgets(prev => new Set(prev).add(widgetType))
        }
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    } finally {
      setPinLoading(null)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    fetchPinnedWidgets()
  }, [fetchAnalytics, fetchPinnedWidgets])

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
            <span className="text-3xl font-bold text-white">
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
                  <span className="font-bold text-white">{cat.score}%</span>
                  <span className="text-xs text-slate-400">({cat.statCount})</span>
                </div>
              </div>
              <div className="h-4 bg-[#1a1a2e] rounded-full overflow-hidden">
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

  // Score Distribution Donut - for white background card below overall score
  const ScoreDistributionDonut = ({ distribution }: { distribution: ScoreDistribution }) => {
    const total = distribution.high + distribution.medium + distribution.low
    if (total === 0) return null
    
    const size = 100
    const strokeWidth = 16
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    
    const segments = [
      { value: distribution.high, color: '#22c55e', label: 'Excellent', bgColor: 'bg-green-500' },
      { value: distribution.medium, color: '#f59e0b', label: 'Good', bgColor: 'bg-amber-500' },
      { value: distribution.low, color: '#ef4444', label: 'Needs Work', bgColor: 'bg-red-500' },
    ]
    
    let currentOffset = 0
    
    return (
      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
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
          <text
            x={size / 2}
            y={size / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-lg font-bold fill-white"
          >
            {total}
          </text>
        </svg>
        <div className="space-y-1.5">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2 text-sm">
              <span className={`w-3 h-3 rounded-full ${seg.bgColor}`} />
              <span className="text-white/80">{seg.label}:</span>
              <span className="font-bold text-white">{seg.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Chart Type Selector
  const ChartTypeSelector = ({ value, onChange }: { value: ChartType; onChange: (v: ChartType) => void }) => (
    <div className="flex items-center gap-1 bg-[#1a1a2e] rounded-lg p-1">
      <button
        onClick={() => onChange('bar')}
        className={`p-1.5 rounded ${value === 'bar' ? 'bg-purple-600 text-white shadow-sm' : 'hover:bg-[#2a2a3e]'}`}
        title="Bar Chart"
      >
        <BarChart2 size={16} className={value === 'bar' ? 'text-purple-600' : 'text-slate-500'} />
      </button>
      <button
        onClick={() => onChange('donut')}
        className={`p-1.5 rounded ${value === 'donut' ? 'bg-purple-600 text-white shadow-sm' : 'hover:bg-[#2a2a3e]'}`}
        title="Donut Chart"
      >
        <PieChart size={16} className={value === 'donut' ? 'text-purple-600' : 'text-slate-500'} />
      </button>
      <button
        onClick={() => onChange('radar')}
        className={`p-1.5 rounded ${value === 'radar' ? 'bg-purple-600 text-white shadow-sm' : 'hover:bg-[#2a2a3e]'}`}
        title="Radar Chart"
      >
        <Target size={16} className={value === 'radar' ? 'text-purple-600' : 'text-slate-500'} />
      </button>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load analytics</p>
      </div>
    )
  }

  const maxDailyCount = Math.max(...data.dailyResponses.map(d => d.count), 1)
  const statsWithData = data.statAverages.filter(s => s.count > 0)

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">Analytics</div>
          <div className="text-sm text-muted-foreground">
            Track performance across your campaigns.
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Form Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={formFilter}
              onChange={(e) => setFormFilter(e.target.value)}
              className="px-3 py-2 border border-[#2a2a3e] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-white bg-[#1a1a2e]"
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
              className="px-3 py-2 border border-[#2a2a3e] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-white bg-[#1a1a2e]"
            >
              {TIME_RANGES.map((range) => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overall Score Card */}
      <div ref={overallScoreRef} className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 mb-6 text-white relative">
        <div className="absolute top-3 right-3">
          <SnapshotButton sectionRef={overallScoreRef} type="overall-score" defaultName={`Overall Score - ${data.overallScore}/100`} />
        </div>
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
        <div ref={insightsRef} className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-5 border border-purple-500/30 mb-6 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="text-purple-400" size={20} />
              <h3 className="font-semibold text-white">Key Insights</h3>
            </div>
            <div className="flex items-center gap-1">
              <PinButton widgetType="insights" title="Key Insights" />
              <SnapshotButton sectionRef={insightsRef} type="insights" defaultName="Key Insights" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 bg-[#1a1a2e] rounded-lg px-3 py-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <p className="text-sm text-slate-300">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div ref={summaryCardsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative">
        <div className="bg-[#0d0d15] rounded-xl p-4 border border-[#2a2a3e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <MessageSquare className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{data.totalResponses}</p>
              <p className="text-xs text-slate-500">Responses</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0d0d15] rounded-xl p-4 border border-[#2a2a3e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{data.totalForms}</p>
              <p className="text-xs text-slate-500">Forms</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0d0d15] rounded-xl p-4 border border-[#2a2a3e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{data.activeForms}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0d0d15] rounded-xl p-4 border border-[#2a2a3e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <BarChart2 className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statsWithData.length}</p>
              <p className="text-xs text-slate-500">Stats Tracked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards Row */}
      {statsWithData.length > 0 && (
        <div ref={statPerformanceRef} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Stat Performance</h3>
            <div className="flex items-center gap-1">
              <PinButton widgetType="stat-performance" title="Stat Performance" />
              <SnapshotButton sectionRef={statPerformanceRef} type="stat-performance" defaultName="Stat Performance" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {statsWithData.slice(0, 10).map((stat) => {
              const percentage = getPercentage(stat)
              const tier = getTierLabel(percentage)
              const catInfo = stat.category ? getCategoryInfo(stat.category) : null
              
              return (
                <div key={stat.id} className="bg-[#0d0d15] rounded-xl p-4 border border-[#2a2a3e] hover:border-[#3a3a4e] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate text-sm">{stat.name}</p>
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
                    <span className="text-2xl font-bold text-white">{stat.average}</span>
                    <span className="text-sm text-slate-400">/ {stat.max}</span>
                  </div>
                  <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden mb-2">
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
        <div ref={categoryBreakdownRef} className="bg-[#0d0d15] rounded-xl p-6 border border-[#2a2a3e] mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="text-purple-600" size={24} />
              <h3 className="text-lg font-semibold text-white">Category Breakdown</h3>
            </div>
            <div className="flex items-center gap-2">
              <PinButton widgetType="category-breakdown" title="Category Breakdown" />
              <SnapshotButton sectionRef={categoryBreakdownRef} type="category-breakdown" defaultName="Category Breakdown" />
              <ChartTypeSelector value={categoryChartType} onChange={setCategoryChartType} />
            </div>
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
      <div ref={allStatsRef} className="bg-[#0d0d15] rounded-xl p-6 border border-[#2a2a3e] mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="text-purple-600" size={24} />
            <h3 className="text-lg font-semibold text-white">All Stats</h3>
          </div>
          <div className="flex items-center gap-2">
            <PinButton widgetType="all-stats" title="All Stats" />
            <SnapshotButton sectionRef={allStatsRef} type="all-stats" defaultName="All Stats" />
            <ChartTypeSelector value={statsChartType} onChange={setStatsChartType} />
          </div>
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
                      <span className="font-bold text-white">{stat.average}</span>
                      <span className="text-slate-400">/ {stat.max}</span>
                      <span className="text-xs text-slate-400">({stat.count})</span>
                    </div>
                  </div>
                  <div className="h-3 bg-[#1a1a2e] rounded-full overflow-hidden">
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

      {/* Response Trend - Improved Line Chart Style */}
      <div ref={responseTrendRef} className="bg-[#0d0d15] rounded-xl p-6 border border-[#2a2a3e]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <LineChart className="text-purple-600" size={24} />
            <h3 className="text-lg font-semibold text-white">
              Response Trend
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <SnapshotButton sectionRef={responseTrendRef} type="response-trend" defaultName="Response Trend" />
            <span className="text-sm text-slate-500">
              {TIME_RANGES.find(r => r.value === timeRange)?.label}
            </span>
          </div>
        </div>

        {data.totalResponses === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <LineChart className="text-purple-400" size={32} />
            </div>
            <p className="text-slate-500">No responses yet</p>
            <p className="text-sm text-slate-400">Share your forms to start collecting data</p>
          </div>
        ) : (
          <div className="relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-slate-400">
              <span>{maxDailyCount}</span>
              <span>{Math.round(maxDailyCount / 2)}</span>
              <span>0</span>
            </div>
            
            {/* Chart area */}
            <div className="ml-10">
              {/* Grid lines */}
              <div className="absolute left-10 right-0 top-0 h-48 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-slate-100 w-full"></div>
                <div className="border-t border-slate-100 w-full"></div>
                <div className="border-t border-slate-200 w-full"></div>
              </div>
              
              {/* Bars */}
              <div className="h-48 flex items-end gap-0.5 relative">
                {data.dailyResponses.map((day, index) => {
                  const barHeight = day.count > 0 ? Math.max((day.count / maxDailyCount) * 100, 3) : 0
                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center justify-end group relative"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg">
                        <div className="font-semibold">{day.count} response{day.count !== 1 ? 's' : ''}</div>
                        <div className="text-slate-300">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-800"></div>
                      </div>
                      
                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-sm transition-all duration-300 cursor-pointer ${
                          day.count > 0 
                            ? 'bg-gradient-to-t from-purple-600 to-purple-400 hover:from-purple-500 hover:to-purple-300 shadow-sm' 
                            : 'bg-slate-50'
                        }`}
                        style={{ height: `${barHeight}%`, minHeight: day.count > 0 ? '4px' : '1px' }}
                      />
                    </div>
                  )
                })}
              </div>
              
              {/* X-axis labels */}
              <div className="flex justify-between mt-3 text-xs text-slate-400">
                {data.dailyResponses.filter((_, i) => i % Math.ceil(data.dailyResponses.length / 7) === 0).map((day) => (
                  <span key={day.date}>
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Summary stats */}
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{data.totalResponses}</p>
                <p className="text-xs text-slate-500">Total Responses</p>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {(data.totalResponses / parseInt(timeRange)).toFixed(1)}
                </p>
                <p className="text-xs text-slate-500">Avg per Day</p>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{maxDailyCount}</p>
                <p className="text-xs text-slate-500">Peak Day</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Snapshot Naming Modal */}
      {snapshotModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d15] rounded-2xl max-w-md w-full shadow-xl border border-[#2a2a3e]">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Save Snapshot</h3>
              
              {/* Preview */}
              <div className="mb-4 rounded-lg overflow-hidden border border-[#2a2a3e]">
                <img 
                  src={snapshotModal.imageData} 
                  alt="Snapshot preview" 
                  className="w-full"
                />
              </div>
              
              {/* Name Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Snapshot Name
                </label>
                <input
                  type="text"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  placeholder={snapshotModal.defaultName}
                  className="w-full px-3 py-2 border border-[#2a2a3e] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-[#1a1a2e] text-white placeholder-slate-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveSnapshot()
                    if (e.key === 'Escape') cancelSnapshot()
                  }}
                />
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={cancelSnapshot}
                  className="px-4 py-2 text-slate-600 hover:text-white font-medium rounded-lg hover:bg-[#1a1a2e] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSnapshot}
                  className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Save Snapshot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
