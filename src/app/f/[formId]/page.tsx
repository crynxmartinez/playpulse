'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Gamepad2, CheckCircle, AlertCircle, ChevronRight, ChevronLeft, Send, Star } from 'lucide-react'

interface Stat {
  id: string
  name: string
  description: string | null
  minValue: number
  maxValue: number
  category: string | null
  weight: number
}

interface QuestionOption {
  text: string
  points: number
  imageUrl?: string
}

interface Question {
  id: string
  questionText: string
  type: 'SLIDER' | 'YES_NO' | 'MULTIPLE_SINGLE' | 'MULTIPLE_MULTI' | 'TEXT_RATING' | 'STAR_RATING' | 'NPS'
  stat: Stat | null
  options: QuestionOption[] | null
  minValue: number
  maxValue: number
  order: number
}

interface Form {
  id: string
  title: string
  description: string | null
  landingTitle: string | null
  landingSubtitle: string | null
  landingDescription: string | null
  landingImage: string | null
  ctaText: string
  themeColor: string
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

interface AnswerData {
  value?: number
  textValue?: string
  selectedIndices?: number[]
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
  const [started, setStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerData>>({})
  const [comment, setComment] = useState('')
  const [respondent, setRespondent] = useState('')
  const [respondentEmail, setRespondentEmail] = useState('')
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
        // Initialize answers
        const initialAnswers: Record<string, AnswerData> = {}
        data.form.questions.forEach((q: Question) => {
          if (q.type === 'SLIDER' || q.type === 'TEXT_RATING') {
            const mid = Math.floor((q.minValue + q.maxValue) / 2)
            initialAnswers[q.id] = { value: mid }
          } else if (q.type === 'MULTIPLE_MULTI') {
            initialAnswers[q.id] = { selectedIndices: [] }
          } else {
            initialAnswers[q.id] = {}
          }
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

  const calculateScore = (question: Question, answer: AnswerData): number => {
    if (question.type === 'SLIDER') {
      return answer.value || question.minValue
    } else if (question.type === 'TEXT_RATING') {
      return answer.value || question.minValue
    } else if (['YES_NO', 'MULTIPLE_SINGLE', 'IMAGE_CHOICE'].includes(question.type)) {
      if (answer.value !== undefined && question.options) {
        return question.options[answer.value]?.points || 0
      }
      return 0
    } else if (question.type === 'MULTIPLE_MULTI') {
      if (answer.selectedIndices && question.options) {
        return answer.selectedIndices.reduce((sum, idx) => sum + (question.options?.[idx]?.points || 0), 0)
      }
      return 0
    }
    return 0
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    try {
      // Transform answers for API
      const apiAnswers: Record<string, { value?: number; textValue?: string; selectedIds?: number[] }> = {}
      Object.entries(answers).forEach(([qId, ans]) => {
        apiAnswers[qId] = {
          value: ans.value,
          textValue: ans.textValue,
          selectedIds: ans.selectedIndices,
        }
      })

      const res = await fetch(`/api/forms/${formId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: apiAnswers, comment, respondent, respondentEmail }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to submit')
        return
      }

      const responseData = await res.json()

      // Track XP for logged-in users (fire and forget - don't block on this)
      if (responseData.response?.id && responseData.projectId) {
        fetch('/api/tester/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            responseId: responseData.response.id,
            projectId: responseData.projectId,
          }),
        }).catch(() => {
          // Silently ignore - user might not be logged in
        })
      }

      // Calculate results
      if (form) {
        const categoryScores: { [key: string]: { total: number, max: number } } = {}
        let overallTotal = 0
        let overallMax = 0
        
        form.questions.forEach((q) => {
          const answer = answers[q.id]
          const score = calculateScore(q, answer)
          const maxScore = q.type === 'SLIDER' || q.type === 'TEXT_RATING' 
            ? q.maxValue 
            : (q.options ? Math.max(...q.options.map(o => o.points)) : 10)
          
          const weight = q.stat?.weight || 1
          const normalized = maxScore > 0 ? (score / maxScore) : 0
          
          overallTotal += normalized * weight
          overallMax += weight
          
          const cat = q.stat?.category || 'uncategorized'
          if (!categoryScores[cat]) {
            categoryScores[cat] = { total: 0, max: 0 }
          }
          categoryScores[cat].total += normalized * weight
          categoryScores[cat].max += weight
        })
        
        const overallPercent = overallMax > 0 ? Math.round((overallTotal / overallMax) * 100) : 0
        const categoryPercents: { [key: string]: number } = {}
        Object.entries(categoryScores).forEach(([cat, scores]) => {
          categoryPercents[cat] = scores.max > 0 ? Math.round((scores.total / scores.max) * 100) : 0
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

  const getCategoryInfo = (categoryValue: string | null) => {
    return STAT_CATEGORIES.find(c => c.value === categoryValue) || null
  }

  const goNext = () => {
    if (form && currentQuestion < form.questions.length) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const goPrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const isCurrentAnswered = () => {
    if (!form) return false
    if (currentQuestion >= form.questions.length) return true // On final page
    
    const q = form.questions[currentQuestion]
    const ans = answers[q.id]
    
    if (q.type === 'SLIDER' || q.type === 'TEXT_RATING' || q.type === 'STAR_RATING' || q.type === 'NPS') {
      return ans?.value !== undefined
    } else if (q.type === 'MULTIPLE_MULTI') {
      return (ans?.selectedIndices?.length || 0) > 0
    } else {
      return ans?.value !== undefined
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

  // Landing Page
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${form.themeColor}20 0%, #1e1b4b 50%, ${form.themeColor}10 100%)` }}>
        <div className="max-w-xl w-full text-center">
          {form.landingImage && (
            <img 
              src={form.landingImage} 
              alt="" 
              className="w-full max-h-64 object-cover rounded-2xl mb-8 shadow-2xl"
            />
          )}
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <Gamepad2 className="text-white/60" size={24} />
            <span className="text-white/60 text-sm">{form.project.name}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {form.landingTitle || form.title}
          </h1>
          
          {form.landingSubtitle && (
            <p className="text-xl text-white/80 mb-4">{form.landingSubtitle}</p>
          )}
          
          {form.landingDescription && (
            <p className="text-white/60 mb-8 max-w-md mx-auto">{form.landingDescription}</p>
          )}
          
          <button
            onClick={() => setStarted(true)}
            className="px-8 py-4 text-lg font-semibold text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            style={{ backgroundColor: form.themeColor }}
          >
            {form.ctaText || 'Start Quiz'}
          </button>
          
          <p className="text-white/40 text-sm mt-8">
            {form.questions.length} questions · Takes about {Math.ceil(form.questions.length * 0.5)} min
          </p>
        </div>
      </div>
    )
  }

  // Results Page
  if (submitted) {
    const tierColors = {
      low: 'from-red-500 to-orange-500',
      medium: 'from-yellow-500 to-amber-500',
      high: 'from-green-500 to-emerald-500',
    }
    
    return (
      <div className="min-h-screen py-8 px-4" style={{ background: `linear-gradient(135deg, ${form.themeColor}20 0%, #1e1b4b 50%, ${form.themeColor}10 100%)` }}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
            <CheckCircle className="mx-auto text-green-400 mb-4" size={56} />
            <h1 className="text-2xl font-bold text-white mb-2">Thank You!</h1>
            <p className="text-white/70 mb-6">Your feedback has been submitted successfully.</p>
            
            {results && form.showOverallScore && (
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
            
            {results && form.showCategoryScores && Object.keys(results.categories).length > 1 && (
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
          
          <p className="text-center text-white/40 text-sm mt-8">Powered by PlayPulse</p>
        </div>
      </div>
    )
  }

  // Question Pages (One at a time)
  const totalSteps = form.questions.length + 1 // +1 for final comment page
  const progress = ((currentQuestion + 1) / totalSteps) * 100
  const isOnFinalPage = currentQuestion >= form.questions.length

  const renderQuestionContent = (question: Question) => {
    const ans = answers[question.id] || {}

    switch (question.type) {
      case 'SLIDER':
      case 'TEXT_RATING':
        return (
          <div className="space-y-6">
            <input
              type="range"
              min={question.minValue}
              max={question.maxValue}
              value={ans.value || question.minValue}
              onChange={(e) => setAnswers({ ...answers, [question.id]: { ...ans, value: parseInt(e.target.value) } })}
              className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: form.themeColor }}
            />
            <div className="flex justify-between items-center">
              <span className="text-white/50">{question.minValue}</span>
              <span className="text-4xl font-bold" style={{ color: form.themeColor }}>
                {ans.value || question.minValue}
              </span>
              <span className="text-white/50">{question.maxValue}</span>
            </div>
            {question.type === 'TEXT_RATING' && (
              <textarea
                value={ans.textValue || ''}
                onChange={(e) => setAnswers({ ...answers, [question.id]: { ...ans, textValue: e.target.value } })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 resize-none"
                style={{ '--tw-ring-color': form.themeColor } as React.CSSProperties}
                placeholder="Share your thoughts..."
                rows={3}
              />
            )}
          </div>
        )

      case 'YES_NO':
      case 'MULTIPLE_SINGLE':
        return (
          <div className="grid gap-3 grid-cols-1">
            {question.options?.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAnswers({ ...answers, [question.id]: { value: idx } })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  ans.value === idx 
                    ? 'border-white bg-white/20 text-white' 
                    : 'border-white/20 text-white/80 hover:border-white/40'
                }`}
                style={ans.value === idx ? { borderColor: form.themeColor, backgroundColor: `${form.themeColor}30` } : {}}
              >
                <span className="font-medium">{option.text}</span>
              </button>
            ))}
          </div>
        )

      case 'MULTIPLE_MULTI':
        const selectedIndices = ans.selectedIndices || []
        return (
          <div className="grid gap-3">
            {question.options?.map((option, idx) => {
              const isSelected = selectedIndices.includes(idx)
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const newSelected = isSelected 
                      ? selectedIndices.filter(i => i !== idx)
                      : [...selectedIndices, idx]
                    setAnswers({ ...answers, [question.id]: { selectedIndices: newSelected } })
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                    isSelected 
                      ? 'border-white bg-white/20 text-white' 
                      : 'border-white/20 text-white/80 hover:border-white/40'
                  }`}
                  style={isSelected ? { borderColor: form.themeColor, backgroundColor: `${form.themeColor}30` } : {}}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-white' : 'border-white/40'}`}>
                    {isSelected && <CheckCircle size={14} style={{ color: form.themeColor }} />}
                  </div>
                  <span className="font-medium">{option.text}</span>
                </button>
              )
            })}
          </div>
        )

      case 'STAR_RATING':
        const starValue = ans.value || 0
        return (
          <div className="space-y-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setAnswers({ ...answers, [question.id]: { value: star } })}
                  className="p-2 transition-transform hover:scale-110"
                >
                  <Star 
                    size={48} 
                    className={`transition-colors ${
                      star <= starValue 
                        ? 'fill-amber-400 text-amber-400' 
                        : 'text-white/30 hover:text-amber-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold" style={{ color: starValue > 0 ? form.themeColor : 'rgba(255,255,255,0.3)' }}>
                {starValue > 0 ? `${starValue} / 5` : 'Select a rating'}
              </span>
            </div>
          </div>
        )

      case 'NPS':
        const npsValue = ans.value
        return (
          <div className="space-y-6">
            <div className="flex justify-center gap-1 flex-wrap">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                const isSelected = npsValue === num
                const colorClass = num <= 6 
                  ? 'bg-red-500/20 hover:bg-red-500/40 border-red-500/50' 
                  : num <= 8 
                    ? 'bg-yellow-500/20 hover:bg-yellow-500/40 border-yellow-500/50' 
                    : 'bg-green-500/20 hover:bg-green-500/40 border-green-500/50'
                const selectedColorClass = num <= 6 
                  ? 'bg-red-500 border-red-400' 
                  : num <= 8 
                    ? 'bg-yellow-500 border-yellow-400' 
                    : 'bg-green-500 border-green-400'
                
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setAnswers({ ...answers, [question.id]: { value: num } })}
                    className={`w-10 h-12 md:w-12 md:h-14 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all ${
                      isSelected ? `${selectedColorClass} text-white scale-110` : `${colorClass} text-white/80`
                    }`}
                  >
                    {num}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-white/50 px-2">
              <span>Not likely at all</span>
              <span>Extremely likely</span>
            </div>
            {npsValue !== undefined && (
              <div className="text-center">
                <span className={`text-lg font-medium ${
                  npsValue <= 6 ? 'text-red-400' : npsValue <= 8 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {npsValue <= 6 ? 'Detractor' : npsValue <= 8 ? 'Passive' : 'Promoter'}
                </span>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${form.themeColor}20 0%, #1e1b4b 50%, ${form.themeColor}10 100%)` }}>
      {/* Progress Bar */}
      <div className="h-1 bg-white/10">
        <div 
          className="h-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: form.themeColor }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-xl w-full">
          {!isOnFinalPage ? (
            // Question
            <div className="text-center">
              <p className="text-white/50 text-sm mb-2">
                Question {currentQuestion + 1} of {form.questions.length}
              </p>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
                {form.questions[currentQuestion].questionText}
              </h2>
              
              {renderQuestionContent(form.questions[currentQuestion])}
            </div>
          ) : (
            // Final Page - Comment & Name
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Almost done!</h2>
                <p className="text-white/60">Any final thoughts?</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <label className="block text-white font-medium mb-2">Additional Comments (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 resize-none"
                  style={{ '--tw-ring-color': form.themeColor } as React.CSSProperties}
                  placeholder="Share your thoughts..."
                  rows={4}
                />
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <label className="block text-white font-medium mb-2">Your Name (Optional)</label>
                <input
                  type="text"
                  value={respondent}
                  onChange={(e) => setRespondent(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': form.themeColor } as React.CSSProperties}
                  placeholder="Anonymous"
                />
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <label className="block text-white font-medium mb-2">Your Email (Optional)</label>
                <input
                  type="email"
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': form.themeColor } as React.CSSProperties}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} />
            Back
          </button>

          {isOnFinalPage ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
              style={{ backgroundColor: form.themeColor }}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Submit
                </>
              )}
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!isCurrentAnswered()}
              className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: form.themeColor }}
            >
              Next
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
