'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MessageSquare, Calendar, Star, Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface Answer {
  id: string
  value: number | null
  textValue: string | null
  question: {
    questionText: string
    type: string
    stat: {
      name: string
      minValue: number
      maxValue: number
    } | null
  }
}

interface Response {
  id: string
  comment: string | null
  respondent: string | null
  respondentEmail: string | null
  createdAt: string
  form: {
    id: string
    title: string
  }
  answers: Answer[]
}

export default function ResponsesPage() {
  const params = useParams()
  const projectId = params.id as string

  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [formFilter, setFormFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [forms, setForms] = useState<{ id: string; title: string }[]>([])
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')

  useEffect(() => {
    fetchResponses()
  }, [projectId])

  const fetchResponses = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/responses`)
      const data = await res.json()
      if (data.responses) {
        setResponses(data.responses)
        const uniqueForms = Array.from(
          new Map(data.responses.map((r: Response) => [r.form.id, r.form])).values()
        ) as { id: string; title: string }[]
        setForms(uniqueForms)
      }
    } catch (error) {
      console.error('Failed to fetch responses:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCards(newExpanded)
  }

  const getAverageRating = (answers: Answer[]) => {
    const validAnswers = answers.filter(a => a.value !== null && a.question.stat)
    if (validAnswers.length === 0) return 0
    const total = validAnswers.reduce((acc, a) => {
      if (!a.question.stat || a.value === null) return acc
      const range = a.question.stat.maxValue - a.question.stat.minValue
      const normalized = (a.value - a.question.stat.minValue) / range
      return acc + normalized
    }, 0)
    return Math.round((total / validAnswers.length) * 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Filter and sort responses
  const filteredResponses = responses
    .filter(r => {
      const matchesForm = formFilter === 'all' || r.form.id === formFilter
      const matchesSearch = searchQuery === '' || 
        (r.respondent?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.comment?.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesForm && matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'highest':
          return getAverageRating(b.answers) - getAverageRating(a.answers)
        case 'lowest':
          return getAverageRating(a.answers) - getAverageRating(b.answers)
        default:
          return 0
      }
    })

  const getTierColor = (score: number) => {
    if (score >= 70) return 'from-green-500 to-emerald-500'
    if (score >= 40) return 'from-yellow-500 to-amber-500'
    return 'from-red-500 to-orange-500'
  }

  const getTierBg = (score: number) => {
    if (score >= 70) return 'bg-green-500/10 border-green-500/30'
    if (score >= 40) return 'bg-yellow-500/10 border-yellow-500/30'
    return 'bg-red-500/10 border-red-500/30'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Responses</div>
          <div className="text-sm text-muted-foreground">
            {filteredResponses.length} of {responses.length} responses
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-[#0d0d15] rounded-xl p-4 border border-[#2a2a3e] mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or comment..."
              className="w-full pl-10 pr-4 py-2.5 border border-[#2a2a3e] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white bg-[#1a1a2e] placeholder-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Form Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            <select
              value={formFilter}
              onChange={(e) => setFormFilter(e.target.value)}
              className="px-3 py-2.5 border border-[#2a2a3e] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-white bg-[#1a1a2e] min-w-[150px]"
            >
              <option value="all">All Forms</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>{form.title}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2.5 border border-[#2a2a3e] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-white bg-[#1a1a2e]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Score</option>
            <option value="lowest">Lowest Score</option>
          </select>
        </div>
      </div>

      {/* Responses */}
      {filteredResponses.length === 0 ? (
        <div className="bg-[#0d0d15] rounded-xl p-12 border border-[#2a2a3e] text-center">
          <MessageSquare className="mx-auto text-slate-500 mb-4" size={48} />
          <h3 className="text-lg font-medium text-white mb-2">
            {searchQuery || formFilter !== 'all' ? 'No matching responses' : 'No responses yet'}
          </h3>
          <p className="text-slate-400">
            {searchQuery || formFilter !== 'all' 
              ? 'Try adjusting your search or filters.' 
              : 'Share your forms to start collecting feedback.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResponses.map((response) => {
            const score = getAverageRating(response.answers)
            const isExpanded = expandedCards.has(response.id)
            
            return (
              <div
                key={response.id}
                className={`bg-[#0d0d15] rounded-xl border border-[#2a2a3e] overflow-hidden transition-all hover:border-[#3a3a4e] ${isExpanded ? 'md:col-span-2 lg:col-span-3' : ''}`}
              >
                {/* Card Header with Score */}
                <div className={`p-4 border-b ${getTierBg(score)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getTierColor(score)} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                        {score}
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {response.respondent || 'Anonymous'}
                        </p>
                        {response.respondentEmail && (
                          <p className="text-xs text-slate-400">{response.respondentEmail}</p>
                        )}
                        <p className="text-xs text-slate-500">{formatShortDate(response.createdAt)}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-[#1a1a2e] rounded-lg text-xs font-medium text-slate-300 border border-[#2a2a3e]">
                      {response.form.title}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  {/* Quick Stats Preview */}
                  {!isExpanded && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {response.answers.slice(0, 3).map((answer) => (
                        answer.question.stat && answer.value !== null && (
                          <span key={answer.id} className="px-2 py-1 bg-[#1a1a2e] rounded text-xs text-slate-300">
                            {answer.question.stat.name}: <strong>{answer.value}</strong>
                          </span>
                        )
                      ))}
                      {response.answers.length > 3 && (
                        <span className="px-2 py-1 bg-[#1a1a2e] rounded text-xs text-slate-500">
                          +{response.answers.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="space-y-4 mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {response.answers.map((answer) => (
                          answer.question.stat && answer.value !== null && (
                            <div key={answer.id} className="p-3 bg-[#1a1a2e] rounded-lg">
                              <p className="text-xs text-slate-500 mb-1 truncate">{answer.question.stat.name}</p>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-white">{answer.value}</span>
                                <span className="text-xs text-slate-500">/{answer.question.stat.maxValue}</span>
                              </div>
                              <div className="mt-2 h-1.5 bg-[#2a2a3e] rounded-full overflow-hidden">
                                <div 
                                  className={`h-full bg-gradient-to-r ${getTierColor(((answer.value - answer.question.stat.minValue) / (answer.question.stat.maxValue - answer.question.stat.minValue)) * 100)} rounded-full`}
                                  style={{ 
                                    width: `${((answer.value - answer.question.stat.minValue) / (answer.question.stat.maxValue - answer.question.stat.minValue)) * 100}%` 
                                  }}
                                />
                              </div>
                            </div>
                          )
                        ))}
                      </div>

                      {/* Text Answers */}
                      {response.answers.some(a => a.textValue) && (
                        <div className="space-y-2">
                          {response.answers.filter(a => a.textValue).map((answer) => (
                            <div key={answer.id} className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                              <p className="text-xs text-blue-400 font-medium mb-1">{answer.question.questionText}</p>
                              <p className="text-sm text-slate-300">{answer.textValue}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar size={14} />
                        {formatDate(response.createdAt)}
                      </div>
                    </div>
                  )}

                  {/* Comment Preview */}
                  {response.comment && (
                    <div className="p-3 bg-[#1a1a2e] rounded-lg mb-3">
                      <p className="text-sm text-slate-400 italic line-clamp-2">
                        &quot;{response.comment}&quot;
                      </p>
                    </div>
                  )}

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpand(response.id)}
                    className="w-full flex items-center justify-center gap-1 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={16} />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} />
                        View Details
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
