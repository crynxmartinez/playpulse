'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, FileText, Eye, EyeOff, Trash2, Link as LinkIcon, Check, X, ChevronRight, Type, List, ToggleLeft, SlidersHorizontal, MessageSquare, Pencil, Star, ThumbsUp, ArrowUp, ArrowDown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/ui/confirm-modal'

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
  statId?: string
  imageUrl?: string
}

interface Question {
  id: string
  questionText: string
  type: 'SLIDER' | 'YES_NO' | 'MULTIPLE_SINGLE' | 'MULTIPLE_MULTI' | 'TEXT_RATING' | 'STAR_RATING' | 'NPS'
  statId: string | null
  stat: Stat | null
  options: QuestionOption[] | null
  minValue: number
  maxValue: number
  order: number
}

interface Form {
  id: string
  slug: string | null
  title: string
  description: string | null
  isActive: boolean
  landingTitle: string | null
  landingSubtitle: string | null
  landingDescription: string | null
  landingImage: string | null
  ctaText: string
  themeColor: string
  questions: Question[]
  _count: { responses: number }
}

const STAT_CATEGORIES = [
  { value: 'gameplay', label: 'Gameplay', color: 'bg-blue-100 text-blue-700' },
  { value: 'visuals', label: 'Visuals & Audio', color: 'bg-purple-100 text-purple-700' },
  { value: 'ux', label: 'User Experience', color: 'bg-green-100 text-green-700' },
  { value: 'balance', label: 'Balance', color: 'bg-orange-100 text-orange-700' },
  { value: 'progression', label: 'Progression', color: 'bg-pink-100 text-pink-700' },
  { value: 'multiplayer', label: 'Multiplayer', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'overall', label: 'Overall', color: 'bg-slate-100 text-slate-700' },
]

const QUESTION_TYPES = [
  { value: 'SLIDER', label: 'Slider Scale', icon: SlidersHorizontal, description: 'Rate on a scale (1-10)' },
  { value: 'STAR_RATING', label: 'Star Rating', icon: Star, description: 'Rate with 1-5 stars' },
  { value: 'NPS', label: 'NPS Score', icon: ThumbsUp, description: 'Net Promoter Score (0-10)' },
  { value: 'YES_NO', label: 'Yes / No', icon: ToggleLeft, description: 'Simple yes/no/maybe choice' },
  { value: 'MULTIPLE_SINGLE', label: 'Multiple Choice', icon: List, description: 'Pick one answer' },
  { value: 'MULTIPLE_MULTI', label: 'Checkboxes', icon: Check, description: 'Pick multiple answers' },
  { value: 'TEXT_RATING', label: 'Text + Rating', icon: MessageSquare, description: 'Open text with rating' },
]

const QUESTION_TEMPLATES = [
  { label: 'Overall Experience', question: 'How would you rate your overall experience with the game?', type: 'STAR_RATING' as const },
  { label: 'Recommend to Friend', question: 'How likely are you to recommend this game to a friend?', type: 'NPS' as const },
  { label: 'Graphics Quality', question: 'How would you rate the graphics and visual quality?', type: 'SLIDER' as const },
  { label: 'Gameplay Fun', question: 'How fun and engaging was the gameplay?', type: 'SLIDER' as const },
  { label: 'Controls', question: 'Were the controls intuitive and responsive?', type: 'YES_NO' as const },
  { label: 'Difficulty', question: 'How would you describe the difficulty level?', type: 'MULTIPLE_SINGLE' as const, options: [
    { text: 'Too Easy', points: 3 },
    { text: 'Just Right', points: 10 },
    { text: 'Too Hard', points: 3 },
  ]},
  { label: 'Bugs Encountered', question: 'Did you encounter any bugs or issues?', type: 'YES_NO' as const },
  { label: 'What You Liked', question: 'What did you like most about the game?', type: 'TEXT_RATING' as const },
]

const WIZARD_STEPS = [
  { id: 1, name: 'Landing Page', description: 'Design your form intro' },
  { id: 2, name: 'Select Stats', description: 'Choose what to measure' },
  { id: 3, name: 'Questions', description: 'Build your questionnaire' },
]

interface WizardData {
  // Step 1: Landing Page
  title: string
  landingTitle: string
  landingSubtitle: string
  landingDescription: string
  landingImage: string
  ctaText: string
  themeColor: string
  // Step 2: Selected Stats
  selectedStatIds: string[]
  // Step 3: Questions
  questions: {
    questionText: string
    type: 'SLIDER' | 'YES_NO' | 'MULTIPLE_SINGLE' | 'MULTIPLE_MULTI' | 'TEXT_RATING' | 'STAR_RATING' | 'NPS'
    statId: string
    options: QuestionOption[]
    minValue: number
    maxValue: number
  }[]
}

export default function FormsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [forms, setForms] = useState<Form[]>([])
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [wizardStep, setWizardStep] = useState(1)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [slugInput, setSlugInput] = useState('')
  
  const [wizardData, setWizardData] = useState<WizardData>({
    title: '',
    landingTitle: '',
    landingSubtitle: '',
    landingDescription: '',
    landingImage: '',
    ctaText: 'Start Quiz',
    themeColor: '#8b5cf6',
    selectedStatIds: [],
    questions: [],
  })

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      const [formsRes, statsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/forms`),
        fetch(`/api/projects/${projectId}/stats`),
      ])
      const formsData = await formsRes.json()
      const statsData = await statsRes.json()
      
      if (formsData.forms) setForms(formsData.forms)
      if (statsData.stats) setStats(statsData.stats)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryInfo = (categoryValue: string | null) => {
    return STAT_CATEGORIES.find(c => c.value === categoryValue) || null
  }

  const groupStatsByCategory = () => {
    const grouped: { [key: string]: Stat[] } = { uncategorized: [] }
    STAT_CATEGORIES.forEach(cat => { grouped[cat.value] = [] })
    
    stats.forEach(stat => {
      if (stat.category && grouped[stat.category]) {
        grouped[stat.category].push(stat)
      } else {
        grouped.uncategorized.push(stat)
      }
    })
    
    return grouped
  }

  const handleStatToggle = (statId: string) => {
    if (wizardData.selectedStatIds.includes(statId)) {
      setWizardData({ 
        ...wizardData, 
        selectedStatIds: wizardData.selectedStatIds.filter(id => id !== statId) 
      })
    } else {
      setWizardData({ 
        ...wizardData, 
        selectedStatIds: [...wizardData.selectedStatIds, statId] 
      })
    }
  }

  const selectAllInCategory = (categoryValue: string) => {
    const grouped = groupStatsByCategory()
    const categoryStats = grouped[categoryValue] || []
    const categoryStatIds = categoryStats.map(s => s.id)
    const allSelected = categoryStatIds.every(id => wizardData.selectedStatIds.includes(id))
    
    if (allSelected) {
      setWizardData({ 
        ...wizardData, 
        selectedStatIds: wizardData.selectedStatIds.filter(id => !categoryStatIds.includes(id)) 
      })
    } else {
      const newIds = [...new Set([...wizardData.selectedStatIds, ...categoryStatIds])]
      setWizardData({ ...wizardData, selectedStatIds: newIds })
    }
  }

  const addQuestion = (type: typeof wizardData.questions[0]['type'] = 'SLIDER') => {
    const newQuestion = {
      questionText: '',
      type,
      statId: wizardData.selectedStatIds[0] || '',
      options: type === 'YES_NO' ? [{ text: 'Yes', points: 10 }, { text: 'No', points: 0 }] : [],
      minValue: type === 'STAR_RATING' ? 1 : type === 'NPS' ? 0 : 1,
      maxValue: type === 'STAR_RATING' ? 5 : type === 'NPS' ? 10 : 10,
    }
    setWizardData({ ...wizardData, questions: [...wizardData.questions, newQuestion] })
  }

  const updateQuestion = (index: number, updates: Partial<typeof wizardData.questions[0]>) => {
    const newQuestions = [...wizardData.questions]
    newQuestions[index] = { ...newQuestions[index], ...updates }
    setWizardData({ ...wizardData, questions: newQuestions })
  }

  const removeQuestion = (index: number) => {
    const newQuestions = wizardData.questions.filter((_, i) => i !== index)
    setWizardData({ ...wizardData, questions: newQuestions })
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...wizardData.questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return
    ;[newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]]
    setWizardData({ ...wizardData, questions: newQuestions })
  }

  const addTemplateQuestion = (template: typeof QUESTION_TEMPLATES[0]) => {
    const newQuestion = {
      questionText: template.question,
      type: template.type,
      statId: wizardData.selectedStatIds[0] || '',
      options: template.type === 'YES_NO' 
        ? [{ text: 'Yes', points: 10 }, { text: 'No', points: 0 }]
        : 'options' in template && template.options 
          ? template.options 
          : [],
      minValue: template.type === 'STAR_RATING' ? 1 : template.type === 'NPS' ? 0 : 1,
      maxValue: template.type === 'STAR_RATING' ? 5 : template.type === 'NPS' ? 10 : 10,
    }
    setWizardData({ ...wizardData, questions: [...wizardData.questions, newQuestion] })
  }

  const addOption = (questionIndex: number) => {
    const newQuestions = [...wizardData.questions]
    newQuestions[questionIndex].options.push({ text: '', points: 0 })
    setWizardData({ ...wizardData, questions: newQuestions })
  }

  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<QuestionOption>) => {
    const newQuestions = [...wizardData.questions]
    newQuestions[questionIndex].options[optionIndex] = { 
      ...newQuestions[questionIndex].options[optionIndex], 
      ...updates 
    }
    setWizardData({ ...wizardData, questions: newQuestions })
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...wizardData.questions]
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex)
    setWizardData({ ...wizardData, questions: newQuestions })
  }

  const handleCreateForm = async () => {
    if (!wizardData.title.trim()) {
      alert('Please enter a form title')
      return
    }
    if (wizardData.questions.length === 0) {
      alert('Please add at least one question')
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wizardData),
      })
      const data = await res.json()
      if (data.form) {
        setForms([data.form, ...forms])
        resetWizard()
      }
    } catch (error) {
      console.error('Failed to create form:', error)
    }
  }

  const handleToggleActive = async (form: Form) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/forms/${form.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !form.isActive }),
      })
      const data = await res.json()
      if (data.form) {
        setForms(forms.map(f => f.id === form.id ? data.form : f))
      }
    } catch (error) {
      console.error('Failed to toggle form:', error)
    }
  }

  const handleDeleteForm = async (formId: string) => {
    setDeleteConfirm(null)
    try {
      await fetch(`/api/projects/${projectId}/forms/${formId}`, {
        method: 'DELETE',
      })
      setForms(forms.filter(f => f.id !== formId))
    } catch (error) {
      console.error('Failed to delete form:', error)
    }
  }

  const copyShareLink = (form: Form) => {
    const urlPath = form.slug || form.id
    const url = `${window.location.origin}/f/${urlPath}`
    navigator.clipboard.writeText(url)
    setCopiedId(form.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const startEditSlug = (form: Form) => {
    setEditingSlug(form.id)
    setSlugInput(form.slug || '')
  }

  const cancelEditSlug = () => {
    setEditingSlug(null)
    setSlugInput('')
  }

  const saveSlug = async (formId: string) => {
    const slug = slugInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    
    try {
      const res = await fetch(`/api/projects/${projectId}/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug || null }),
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
        return
      }
      if (data.form) {
        setForms(forms.map(f => f.id === formId ? data.form : f))
      }
      setEditingSlug(null)
      setSlugInput('')
    } catch (error) {
      console.error('Failed to update slug:', error)
    }
  }

  const resetWizard = () => {
    setShowWizard(false)
    setWizardStep(1)
    setWizardData({
      title: '',
      landingTitle: '',
      landingSubtitle: '',
      landingDescription: '',
      landingImage: '',
      ctaText: 'Start Quiz',
      themeColor: '#8b5cf6',
      selectedStatIds: [],
      questions: [],
    })
  }

  const canProceedToStep2 = wizardData.title.trim() !== ''
  const canProceedToStep3 = wizardData.selectedStatIds.length > 0
  const canCreateForm = wizardData.questions.length > 0 && wizardData.questions.every(q => q.questionText.trim() !== '')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Campaigns</div>
          <div className="text-sm text-muted-foreground">
            Create feedback forms to collect player responses.
          </div>
        </div>
        <Button
          className="rounded-2xl"
          onClick={() => setShowWizard(true)}
          disabled={stats.length === 0}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {stats.length === 0 && (
        <Card className="rounded-2xl border-yellow-500/30 bg-yellow-500/10">
          <CardContent className="pt-4">
            <p className="text-yellow-300 text-sm">
              You need to create stats before creating campaigns. Go to the Stats tab first.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Forms List */}
      {forms.length === 0 ? (
        <div className="bg-[#0d0d15] rounded-xl p-12 border border-[#2a2a3e] text-center">
          <FileText className="mx-auto text-slate-500 mb-4" size={48} />
          <h3 className="text-lg font-medium text-white mb-2">No forms yet</h3>
          <p className="text-slate-400 mb-4">Create forms to start collecting player feedback.</p>
          {stats.length > 0 && (
            <button
              onClick={() => setShowWizard(true)}
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              Create your first form
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {forms.map((form) => (
            <div key={form.id} className="bg-[#0d0d15] rounded-xl p-5 border border-[#2a2a3e]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${form.isActive ? 'bg-green-500/20' : 'bg-[#1a1a2e]'}`}>
                    <FileText className={form.isActive ? 'text-green-400' : 'text-slate-500'} size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{form.title}</h4>
                    <p className="text-sm text-slate-400">
                      {form.questions.length} questions · {form._count.responses} responses
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${form.isActive ? 'bg-green-500/20 text-green-400' : 'bg-[#1a1a2e] text-slate-400'}`}>
                  {form.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* URL Slug Display/Edit */}
              <div className="mb-3 text-xs">
                {editingSlug === form.id ? (
                  <div className="flex items-center gap-2 bg-[#1a1a2e] p-2 rounded-lg">
                    <span className="text-slate-500 text-xs">playpulse.vercel.app/f/</span>
                    <input
                      type="text"
                      value={slugInput}
                      onChange={(e) => setSlugInput(e.target.value)}
                      placeholder="custom-url-slug"
                      className="flex-1 px-2 py-1 border border-[#2a2a3e] rounded text-sm text-white bg-[#0d0d15] focus:outline-none focus:ring-2 focus:ring-purple-500"
                      autoFocus
                    />
                    <button
                      onClick={() => saveSlug(form.id)}
                      className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditSlug}
                      className="px-2 py-1 bg-[#2a2a3e] text-slate-300 rounded text-xs hover:bg-[#3a3a4e]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-slate-500 bg-[#1a1a2e] px-3 py-2 rounded-lg">
                    <LinkIcon size={12} />
                    <span className="text-slate-500">playpulse.vercel.app/f/</span>
                    <span className="font-mono font-semibold text-white">{form.slug || form.id}</span>
                    {form.slug && <span className="text-green-400 ml-1 text-xs">(custom)</span>}
                  </div>
                )}
              </div>

              {form.landingTitle && (
                <p className="text-sm text-slate-400 mb-3">{form.landingTitle}</p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-[#2a2a3e]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyShareLink(form)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                  >
                    {copiedId === form.id ? <><Check size={14} /> Copied!</> : <><LinkIcon size={14} /> Copy Link</>}
                  </button>
                  <button
                    onClick={() => startEditSlug(form)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
                    title="Edit URL"
                  >
                    <Pencil size={14} /> Edit URL
                  </button>
                  <a
                    href={`/f/${form.slug || form.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <Eye size={14} /> Preview
                  </a>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(form)}
                    className={`p-2 rounded-lg transition-colors ${form.isActive ? 'text-green-400 hover:bg-green-500/10' : 'text-slate-500 hover:bg-[#1a1a2e]'}`}
                    title={form.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {form.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(form.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d15] rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex border border-[#2a2a3e]">
            {/* Left Sidebar - Journey Steps */}
            <div className="w-64 bg-[#1a1a2e] border-r border-[#2a2a3e] p-6">
              <h3 className="text-lg font-bold text-white mb-6">Create Form</h3>
              <div className="space-y-4">
                {WIZARD_STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      wizardStep === step.id 
                        ? 'bg-purple-600 text-white' 
                        : wizardStep > step.id 
                          ? 'bg-green-500 text-white' 
                          : 'bg-[#2a2a3e] text-slate-400'
                    }`}>
                      {wizardStep > step.id ? <Check size={16} /> : step.id}
                    </div>
                    <div>
                      <p className={`font-medium ${wizardStep === step.id ? 'text-purple-400' : 'text-slate-300'}`}>
                        {step.name}
                      </p>
                      <p className="text-xs text-slate-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#2a2a3e]">
                <h4 className="text-xl font-semibold text-white">
                  {WIZARD_STEPS[wizardStep - 1].name}
                </h4>
                <button
                  onClick={resetWizard}
                  className="p-2 text-slate-400 hover:text-white hover:bg-[#2a2a3e] rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Step 1: Landing Page */}
                {wizardStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Form Title *</label>
                      <input
                        type="text"
                        value={wizardData.title}
                        onChange={(e) => setWizardData({ ...wizardData, title: e.target.value })}
                        className="w-full px-4 py-2 border border-[#2a2a3e] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white bg-[#1a1a2e]"
                        placeholder="e.g., Beta Feedback Survey"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Landing Headline</label>
                        <input
                          type="text"
                          value={wizardData.landingTitle}
                          onChange={(e) => setWizardData({ ...wizardData, landingTitle: e.target.value })}
                          className="w-full px-4 py-2 border border-[#2a2a3e] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white bg-[#1a1a2e]"
                          placeholder="How Good Is Our Game?"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Subtitle</label>
                        <input
                          type="text"
                          value={wizardData.landingSubtitle}
                          onChange={(e) => setWizardData({ ...wizardData, landingSubtitle: e.target.value })}
                          className="w-full px-4 py-2 border border-[#2a2a3e] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white bg-[#1a1a2e]"
                          placeholder="Take our 2-minute quiz to find out!"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                      <textarea
                        value={wizardData.landingDescription}
                        onChange={(e) => setWizardData({ ...wizardData, landingDescription: e.target.value })}
                        className="w-full px-4 py-2 border border-[#2a2a3e] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white bg-[#1a1a2e]"
                        placeholder="Help us improve by sharing your honest feedback..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Cover Image URL</label>
                        <input
                          type="text"
                          value={wizardData.landingImage}
                          onChange={(e) => setWizardData({ ...wizardData, landingImage: e.target.value })}
                          className="w-full px-4 py-2 border border-[#2a2a3e] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white bg-[#1a1a2e]"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Button Text</label>
                        <input
                          type="text"
                          value={wizardData.ctaText}
                          onChange={(e) => setWizardData({ ...wizardData, ctaText: e.target.value })}
                          className="w-full px-4 py-2 border border-[#2a2a3e] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white bg-[#1a1a2e]"
                          placeholder="Start Quiz"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Theme Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={wizardData.themeColor}
                          onChange={(e) => setWizardData({ ...wizardData, themeColor: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={wizardData.themeColor}
                          onChange={(e) => setWizardData({ ...wizardData, themeColor: e.target.value })}
                          className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    {wizardData.landingTitle && (
                      <div className="mt-6 p-6 rounded-xl border-2 border-dashed border-slate-200" style={{ backgroundColor: wizardData.themeColor + '10' }}>
                        <p className="text-xs text-slate-500 mb-4">Preview</p>
                        <h3 className="text-2xl font-bold text-slate-800">{wizardData.landingTitle}</h3>
                        {wizardData.landingSubtitle && <p className="text-slate-600 mt-1">{wizardData.landingSubtitle}</p>}
                        {wizardData.landingDescription && <p className="text-slate-500 mt-3 text-sm">{wizardData.landingDescription}</p>}
                        <button 
                          className="mt-4 px-6 py-2 rounded-lg text-white font-medium"
                          style={{ backgroundColor: wizardData.themeColor }}
                        >
                          {wizardData.ctaText || 'Start Quiz'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Select Stats */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-slate-600 mb-4">
                      Select the stats you want to measure in this form. You&apos;ll create questions for these stats in the next step.
                    </p>
                    <p className="text-sm text-purple-600 font-medium">
                      {wizardData.selectedStatIds.length} stat{wizardData.selectedStatIds.length !== 1 ? 's' : ''} selected
                    </p>

                    {(() => {
                      const grouped = groupStatsByCategory()
                      return (
                        <div className="space-y-4">
                          {STAT_CATEGORIES.map((category) => {
                            const categoryStats = grouped[category.value]
                            if (!categoryStats || categoryStats.length === 0) return null
                            
                            const allSelected = categoryStats.every(s => wizardData.selectedStatIds.includes(s.id))
                            
                            return (
                              <div key={category.value} className="border border-[#2a2a3e] rounded-lg p-4 bg-[#1a1a2e]">
                                <div className="flex items-center justify-between mb-3">
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${category.color}`}>
                                    {category.label}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => selectAllInCategory(category.value)}
                                    className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                                      allSelected ? 'bg-purple-500/20 text-purple-400' : 'bg-[#2a2a3e] text-slate-400 hover:bg-[#3a3a4e]'
                                    }`}
                                  >
                                    {allSelected ? 'Deselect All' : 'Select All'}
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {categoryStats.map((stat) => (
                                    <button
                                      key={stat.id}
                                      type="button"
                                      onClick={() => handleStatToggle(stat.id)}
                                      className={`p-3 rounded-lg border text-left transition-all ${
                                        wizardData.selectedStatIds.includes(stat.id)
                                          ? 'border-purple-500 bg-purple-500/20 text-purple-400 shadow-sm'
                                          : 'border-[#2a2a3e] hover:border-[#3a3a4e] text-slate-300 bg-[#0d0d15]'
                                      }`}
                                    >
                                      <p className="font-medium">{stat.name}</p>
                                      {stat.description && <p className="text-xs text-slate-500 mt-1">{stat.description}</p>}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )
                          })}

                          {grouped.uncategorized.length > 0 && (
                            <div className="border border-[#2a2a3e] rounded-lg p-4 bg-[#1a1a2e]">
                              <div className="flex items-center justify-between mb-3">
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                  Uncategorized
                                </span>
                                <button
                                  type="button"
                                  onClick={() => selectAllInCategory('uncategorized')}
                                  className="text-sm px-3 py-1 rounded-lg bg-[#2a2a3e] text-slate-400 hover:bg-[#3a3a4e]"
                                >
                                  Select All
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {grouped.uncategorized.map((stat) => (
                                  <button
                                    key={stat.id}
                                    type="button"
                                    onClick={() => handleStatToggle(stat.id)}
                                    className={`p-3 rounded-lg border text-left transition-all ${
                                      wizardData.selectedStatIds.includes(stat.id)
                                        ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-800'
                                    }`}
                                  >
                                    <p className="font-medium">{stat.name}</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Step 3: Questions */}
                {wizardStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-slate-600">
                        Create questions for your selected stats. Each question measures one or more stats.
                      </p>
                      <button
                        onClick={() => addQuestion()}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Plus size={18} />
                        Add Question
                      </button>
                    </div>

                    {/* Quick Templates */}
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Quick Templates</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {QUESTION_TEMPLATES.map((template, i) => (
                          <button
                            key={i}
                            onClick={() => addTemplateQuestion(template)}
                            className="px-3 py-1.5 text-xs bg-white border border-purple-200 rounded-full text-purple-700 hover:bg-purple-100 transition"
                          >
                            + {template.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {wizardData.questions.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                        <Type className="mx-auto text-slate-300 mb-3" size={40} />
                        <p className="text-slate-500">No questions yet. Click a template above or &quot;Add Question&quot; to start.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {wizardData.questions.map((question, qIndex) => (
                          <div key={qIndex} className="border border-slate-200 rounded-xl p-4">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-500">Question {qIndex + 1}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => moveQuestion(qIndex, 'up')}
                                    disabled={qIndex === 0}
                                    className="p-1 text-slate-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Move up"
                                  >
                                    <ArrowUp size={14} />
                                  </button>
                                  <button
                                    onClick={() => moveQuestion(qIndex, 'down')}
                                    disabled={qIndex === wizardData.questions.length - 1}
                                    className="p-1 text-slate-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Move down"
                                  >
                                    <ArrowDown size={14} />
                                  </button>
                                </div>
                              </div>
                              <button
                                onClick={() => removeQuestion(qIndex)}
                                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Question Text *</label>
                                <input
                                  type="text"
                                  value={question.questionText}
                                  onChange={(e) => updateQuestion(qIndex, { questionText: e.target.value })}
                                  className="w-full px-4 py-2 border border-[#2a2a3e] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white bg-[#1a1a2e]"
                                  placeholder="e.g., How would you rate the graphics quality?"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-slate-400 mb-1">Question Type</label>
                                  <select
                                    value={question.type}
                                    onChange={(e) => updateQuestion(qIndex, { 
                                      type: e.target.value as typeof question.type,
                                      options: ['MULTIPLE_SINGLE', 'MULTIPLE_MULTI', 'YES_NO'].includes(e.target.value) 
                                        ? (e.target.value === 'YES_NO' ? [{ text: 'Yes', points: 10 }, { text: 'No', points: 0 }] : [])
                                        : []
                                    })}
                                    className="w-full px-4 py-2 border border-[#2a2a3e] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white bg-[#1a1a2e]"
                                  >
                                    {QUESTION_TYPES.map(type => (
                                      <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-slate-400 mb-1">Connected Stat</label>
                                  <select
                                    value={question.statId}
                                    onChange={(e) => updateQuestion(qIndex, { statId: e.target.value })}
                                    className="w-full px-4 py-2 border border-[#2a2a3e] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white bg-[#1a1a2e]"
                                  >
                                    <option value="">Select a stat...</option>
                                    {stats.filter(s => wizardData.selectedStatIds.includes(s.id)).map(stat => (
                                      <option key={stat.id} value={stat.id}>{stat.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Slider options */}
                              {question.type === 'SLIDER' && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Min Value</label>
                                    <input
                                      type="number"
                                      value={question.minValue}
                                      onChange={(e) => updateQuestion(qIndex, { minValue: parseInt(e.target.value) || 1 })}
                                      className="w-full px-4 py-2 border border-[#2a2a3e] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white bg-[#1a1a2e]"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Max Value</label>
                                    <input
                                      type="number"
                                      value={question.maxValue}
                                      onChange={(e) => updateQuestion(qIndex, { maxValue: parseInt(e.target.value) || 10 })}
                                      className="w-full px-4 py-2 border border-[#2a2a3e] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white bg-[#1a1a2e]"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Star Rating preview */}
                              {question.type === 'STAR_RATING' && (
                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                  <label className="block text-sm font-medium text-amber-700 mb-2">Preview: 5-Star Rating</label>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Star key={star} className="h-8 w-8 text-amber-400 fill-amber-400" />
                                    ))}
                                  </div>
                                  <p className="text-xs text-amber-600 mt-2">Users will rate from 1 to 5 stars</p>
                                </div>
                              )}

                              {/* NPS preview */}
                              {question.type === 'NPS' && (
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                  <label className="block text-sm font-medium text-blue-700 mb-2">Preview: Net Promoter Score (0-10)</label>
                                  <div className="flex gap-1">
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                      <div 
                                        key={num} 
                                        className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium ${
                                          num <= 6 ? 'bg-red-100 text-red-700' : 
                                          num <= 8 ? 'bg-yellow-100 text-yellow-700' : 
                                          'bg-green-100 text-green-700'
                                        }`}
                                      >
                                        {num}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex justify-between text-xs mt-2">
                                    <span className="text-red-600">Detractors (0-6)</span>
                                    <span className="text-yellow-600">Passives (7-8)</span>
                                    <span className="text-green-600">Promoters (9-10)</span>
                                  </div>
                                </div>
                              )}

                              {/* Multiple choice options */}
                              {['MULTIPLE_SINGLE', 'MULTIPLE_MULTI', 'YES_NO'].includes(question.type) && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-slate-700">Answer Options</label>
                                    {question.type !== 'YES_NO' && (
                                      <button
                                        onClick={() => addOption(qIndex)}
                                        className="text-sm text-purple-600 hover:text-purple-700"
                                      >
                                        + Add Option
                                      </button>
                                    )}
                                  </div>
                                  <div className="space-y-3">
                                    {question.options.map((option, oIndex) => (
                                      <div key={oIndex} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex items-center gap-2 mb-2">
                                          <input
                                            type="text"
                                            value={option.text}
                                            onChange={(e) => updateOption(qIndex, oIndex, { text: e.target.value })}
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
                                            placeholder="Option text..."
                                          />
                                          <input
                                            type="number"
                                            value={option.points}
                                            onChange={(e) => updateOption(qIndex, oIndex, { points: parseInt(e.target.value) || 0 })}
                                            className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
                                            placeholder="Pts"
                                            title="Points"
                                          />
                                          {question.type !== 'YES_NO' && (
                                            <button
                                              onClick={() => removeOption(qIndex, oIndex)}
                                              className="p-2 text-slate-400 hover:text-red-600"
                                            >
                                              <X size={16} />
                                            </button>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-slate-500">Stat:</span>
                                          <select
                                            value={option.statId || ''}
                                            onChange={(e) => updateOption(qIndex, oIndex, { statId: e.target.value || undefined })}
                                            className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
                                          >
                                            <option value="">No stat (optional)</option>
                                            {stats.filter(s => wizardData.selectedStatIds.includes(s.id)).map(stat => (
                                              <option key={stat.id} value={stat.id}>{stat.name}</option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={() => wizardStep > 1 ? setWizardStep(wizardStep - 1) : resetWizard()}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  {wizardStep > 1 ? 'Back' : 'Cancel'}
                </button>

                {wizardStep < 3 ? (
                  <button
                    onClick={() => setWizardStep(wizardStep + 1)}
                    disabled={(wizardStep === 1 && !canProceedToStep2) || (wizardStep === 2 && !canProceedToStep3)}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    onClick={handleCreateForm}
                    disabled={!canCreateForm}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check size={18} />
                    Create Form
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete Form"
        message="Are you sure you want to delete this form? All responses will be lost."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => deleteConfirm && handleDeleteForm(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
