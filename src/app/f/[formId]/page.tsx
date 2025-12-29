'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Gamepad2, Send, CheckCircle, AlertCircle } from 'lucide-react'

interface Stat {
  id: string
  name: string
  description: string | null
  minValue: number
  maxValue: number
  category: string | null
  weight: number
}

interface Question {
  id: string
  stat: Stat
  order: number
}

interface Form {
  id: string
  title: string
  description: string | null
  showCategoryScores: boolean
  showOverallScore: boolean
  project: { 
    name: string
    tierLowMax: number
    tierMediumMax: number
    tierLowLabel: string
    tierMediumLabel: string
    tierHighLabel: string
    tierLowMsg: string | null
    tierMediumMsg: string | null
    tierHighMsg: string | null
  }
  questions: Question[]
}

const STAT_CATEGORIES = [
  { value: 'gameplay', label: 'Gameplay', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400' },
  { value: 'visuals', label: 'Visuals & Audio', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400' },
  { value: 'ux', label: 'User Experience', color: 'from-green-500 to-green-600', bgColor: 'bg-green-500/20', textColor: 'text-green-400' },
  { value: 'balance', label: 'Balance', color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-500/20', textColor: 'text-orange-400' },
  { value: 'progression', label: 'Progression', color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-500/20', textColor: 'text-pink-400' },
  { value: 'multiplayer', label: 'Multiplayer', color: 'from-cyan-500 to-cyan-600', bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-400' },
  { value: 'overall', label: 'Overall', color: 'from-slate-500 to-slate-600', bgColor: 'bg-slate-500/20', textColor: 'text-slate-400' },
]

export default function PublicFormPage() {
  const params = useParams()
  const formId = params.formId as string

  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [respondent, setRespondent] = useState('')
  const [results, setResults] = useState<{
    overall: number
    categories: { [key: string]: number }
    tier: string
    tierLabel: string
    tierMsg: string | null
  } | null>(null)

  useEffect(() => {
    fetchForm()
  }, [formId])

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/forms/${formId}`)
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Form not found')
        return
      }
      
      if (data.form) {
        setForm(data.form)
        // Initialize answers with middle values
        const initialAnswers: Record<string, number> = {}
        data.form.questions.forEach((q: Question) => {
          const mid = Math.floor((q.stat.minValue + q.stat.maxValue) / 2)
          initialAnswers[q.id] = mid
        })
        setAnswers(initialAnswers)
      }
    } catch (err) {
      setError('Failed to load form')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch(`/api/forms/${formId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, comment, respondent }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to submit')
        return
      }

      // Calculate results
      if (form) {
        const categoryScores: { [key: string]: { total: number, max: number, weight: number } } = {}
        let overallTotal = 0
        let overallMax = 0
        
        form.questions.forEach((q) => {
          const value = answers[q.id] || q.stat.minValue
          const normalized = (value - q.stat.minValue) / (q.stat.maxValue - q.stat.minValue)
          const weight = q.stat.weight || 1
          
          overallTotal += normalized * weight
          overallMax += weight
          
          const cat = q.stat.category || 'uncategorized'
          if (!categoryScores[cat]) {
            categoryScores[cat] = { total: 0, max: 0, weight: 0 }
          }
          categoryScores[cat].total += normalized * weight
          categoryScores[cat].max += weight
        })
        
        const overallPercent = Math.round((overallTotal / overallMax) * 100)
        const categoryPercents: { [key: string]: number } = {}
        Object.entries(categoryScores).forEach(([cat, scores]) => {
          categoryPercents[cat] = Math.round((scores.total / scores.max) * 100)
        })
        
        let tier = 'high'
        let tierLabel = form.project.tierHighLabel
        let tierMsg = form.project.tierHighMsg
        
        if (overallPercent <= form.project.tierLowMax) {
          tier = 'low'
          tierLabel = form.project.tierLowLabel
          tierMsg = form.project.tierLowMsg
        } else if (overallPercent <= form.project.tierMediumMax) {
          tier = 'medium'
          tierLabel = form.project.tierMediumLabel
          tierMsg = form.project.tierMediumMsg
        }
        
        setResults({
          overall: overallPercent,
          categories: categoryPercents,
          tier,
          tierLabel,
          tierMsg,
        })
      }

      setSubmitted(true)
    } catch (err) {
      setError('Failed to submit response')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
          <h1 className="text-xl font-bold text-white mb-2">Form Not Available</h1>
          <p className="text-white/70">{error || 'This form is no longer accepting responses.'}</p>
        </div>
      </div>
    )
  }

  const getCategoryInfo = (categoryValue: string | null) => {
    return STAT_CATEGORIES.find(c => c.value === categoryValue) || null
  }

  const groupQuestionsByCategory = () => {
    if (!form) return { grouped: {}, hasCategories: false }
    
    const grouped: { [key: string]: Question[] } = { uncategorized: [] }
    STAT_CATEGORIES.forEach(cat => { grouped[cat.value] = [] })
    
    form.questions.forEach(q => {
      if (q.stat.category && grouped[q.stat.category]) {
        grouped[q.stat.category].push(q)
      } else {
        grouped.uncategorized.push(q)
      }
    })
    
    const hasCategories = Object.entries(grouped).some(([key, items]) => key !== 'uncategorized' && items.length > 0)
    return { grouped, hasCategories }
  }

  const getProgress = () => {
    if (!form) return 0
    const answered = Object.keys(answers).length
    return Math.round((answered / form.questions.length) * 100)
  }

  if (submitted) {
    const tierColors = {
      low: 'from-red-500 to-orange-500',
      medium: 'from-yellow-500 to-amber-500',
      high: 'from-green-500 to-emerald-500',
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
            <CheckCircle className="mx-auto text-green-400 mb-4" size={56} />
            <h1 className="text-2xl font-bold text-white mb-2">Thank You!</h1>
            <p className="text-white/70 mb-6">Your feedback has been submitted successfully.</p>
            
            {results && form?.showOverallScore && (
              <div className="mb-8">
                <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {results.overall}%
                </div>
                <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${tierColors[results.tier as keyof typeof tierColors]} text-white font-semibold`}>
                  {results.tierLabel}
                </div>
                {results.tierMsg && (
                  <p className="text-white/70 mt-4 text-sm">{results.tierMsg}</p>
                )}
              </div>
            )}
            
            {results && form?.showCategoryScores && Object.keys(results.categories).length > 1 && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <h3 className="text-white/80 font-medium mb-4">Category Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(results.categories).map(([cat, score]) => {
                    const catInfo = getCategoryInfo(cat)
                    return (
                      <div key={cat} className="text-left">
                        <div className="flex justify-between text-sm mb-1">
                          <span className={catInfo?.textColor || 'text-white/60'}>
                            {catInfo?.label || 'Other'}
                          </span>
                          <span className="text-white font-medium">{score}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${catInfo?.color || 'from-gray-500 to-gray-600'} transition-all duration-500`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          
          <p className="text-center text-white/40 text-sm mt-8">
            Powered by PlayPulse
          </p>
        </div>
      </div>
    )
  }

  const { grouped, hasCategories } = groupQuestionsByCategory()

  const renderQuestion = (question: Question) => {
    const catInfo = getCategoryInfo(question.stat.category)
    return (
      <div
        key={question.id}
        className="bg-white/10 backdrop-blur-lg rounded-xl p-6"
      >
        <div className="flex items-start justify-between mb-2">
          <label className="block text-white font-medium">
            {question.stat.name}
          </label>
          {catInfo && (
            <span className={`text-xs px-2 py-0.5 rounded ${catInfo.bgColor} ${catInfo.textColor}`}>
              {catInfo.label}
            </span>
          )}
        </div>
        {question.stat.description && (
          <p className="text-white/60 text-sm mb-4">{question.stat.description}</p>
        )}
        
        <div className="space-y-3">
          <input
            type="range"
            min={question.stat.minValue}
            max={question.stat.maxValue}
            value={answers[question.id] || question.stat.minValue}
            onChange={(e) => setAnswers({ ...answers, [question.id]: parseInt(e.target.value) })}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-sm">
            <span className="text-white/50">{question.stat.minValue}</span>
            <span className="text-purple-400 font-bold text-lg">
              {answers[question.id]}
            </span>
            <span className="text-white/50">{question.stat.maxValue}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gamepad2 className="text-purple-400" size={32} />
            <span className="text-white/60 text-sm">{form.project.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{form.title}</h1>
          {form.description && (
            <p className="text-white/70">{form.description}</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-white/60 mb-2">
            <span>Progress</span>
            <span>{getProgress()}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Questions - Grouped or Flat */}
          {hasCategories ? (
            <div className="space-y-8">
              {STAT_CATEGORIES.map((category) => {
                const categoryQuestions = grouped[category.value]
                if (!categoryQuestions || categoryQuestions.length === 0) return null
                
                return (
                  <div key={category.value}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`h-1 flex-1 bg-gradient-to-r ${category.color} rounded-full opacity-50`} />
                      <span className={`text-sm font-medium ${category.textColor}`}>
                        {category.label}
                      </span>
                      <div className={`h-1 flex-1 bg-gradient-to-r ${category.color} rounded-full opacity-50`} />
                    </div>
                    <div className="space-y-4">
                      {categoryQuestions.map(renderQuestion)}
                    </div>
                  </div>
                )
              })}
              
              {/* Uncategorized */}
              {grouped.uncategorized.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-1 flex-1 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full opacity-50" />
                    <span className="text-sm font-medium text-gray-400">Other</span>
                    <div className="h-1 flex-1 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full opacity-50" />
                  </div>
                  <div className="space-y-4">
                    {grouped.uncategorized.map(renderQuestion)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {form.questions.map(renderQuestion)}
            </div>
          )}

          {/* Comment */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <label className="block text-white font-medium mb-2">
              Additional Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Share your thoughts about the game..."
              rows={4}
            />
          </div>

          {/* Respondent Name */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <label className="block text-white font-medium mb-2">
              Your Name (Optional)
            </label>
            <input
              type="text"
              value={respondent}
              onChange={(e) => setRespondent(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Anonymous"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send size={20} />
                Submit Feedback
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-white/40 text-sm mt-8">
          Powered by PlayPulse
        </p>
      </div>
    </div>
  )
}
