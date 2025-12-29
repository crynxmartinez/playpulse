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
  project: { name: string }
  questions: Question[]
}

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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
          <h1 className="text-xl font-bold text-white mb-2">Thank You!</h1>
          <p className="text-white/70">Your feedback has been submitted successfully.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gamepad2 className="text-purple-400" size={32} />
            <span className="text-white/60 text-sm">{form.project.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{form.title}</h1>
          {form.description && (
            <p className="text-white/70">{form.description}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Questions */}
          {form.questions.map((question) => (
            <div
              key={question.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6"
            >
              <label className="block text-white font-medium mb-2">
                {question.stat.name}
              </label>
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
          ))}

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
