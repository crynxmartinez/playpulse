'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MessageSquare, User, Calendar, Star } from 'lucide-react'

interface Answer {
  id: string
  value: number
  question: {
    stat: {
      name: string
      minValue: number
      maxValue: number
    }
  }
}

interface Response {
  id: string
  comment: string | null
  respondent: string | null
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
  const [filter, setFilter] = useState<string>('all')
  const [forms, setForms] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    fetchResponses()
  }, [projectId])

  const fetchResponses = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/responses`)
      const data = await res.json()
      if (data.responses) {
        setResponses(data.responses)
        // Extract unique forms
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

  const filteredResponses = filter === 'all' 
    ? responses 
    : responses.filter(r => r.form.id === filter)

  const getAverageRating = (answers: Answer[]) => {
    if (answers.length === 0) return 0
    const total = answers.reduce((acc, a) => {
      const range = a.question.stat.maxValue - a.question.stat.minValue
      const normalized = (a.value - a.question.stat.minValue) / range
      return acc + normalized
    }, 0)
    return Math.round((total / answers.length) * 100)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Responses</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Filter by form:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Forms</option>
            {forms.map((form) => (
              <option key={form.id} value={form.id}>{form.title}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-slate-500 mb-6">
        View all feedback responses from your players. Total: {filteredResponses.length} responses
      </p>

      {filteredResponses.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <MessageSquare className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No responses yet</h3>
          <p className="text-slate-500">Share your forms to start collecting feedback from players.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResponses.map((response) => (
            <div
              key={response.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                    {response.respondent?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {response.respondent || 'Anonymous'}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(response.createdAt)}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                        {response.form.title}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-purple-50 rounded-full">
                  <Star className="text-purple-500" size={16} />
                  <span className="font-semibold text-purple-700">
                    {getAverageRating(response.answers)}%
                  </span>
                </div>
              </div>

              {/* Ratings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {response.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className="p-3 bg-slate-50 rounded-lg"
                  >
                    <p className="text-xs text-slate-500 mb-1">{answer.question.stat.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-800">{answer.value}</span>
                      <span className="text-xs text-slate-400">
                        / {answer.question.stat.maxValue}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ 
                          width: `${((answer.value - answer.question.stat.minValue) / (answer.question.stat.maxValue - answer.question.stat.minValue)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment */}
              {response.comment && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 italic">&quot;{response.comment}&quot;</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
