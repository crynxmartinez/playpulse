'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Edit2, Trash2, FileText, Link as LinkIcon, Eye, EyeOff, Copy, Check } from 'lucide-react'

interface Stat {
  id: string
  name: string
  minValue: number
  maxValue: number
  category: string | null
  weight: number
}

const STAT_CATEGORIES = [
  { value: 'gameplay', label: 'Gameplay', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'visuals', label: 'Visuals & Audio', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'ux', label: 'User Experience', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'balance', label: 'Balance', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'progression', label: 'Progression', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { value: 'multiplayer', label: 'Multiplayer', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { value: 'overall', label: 'Overall', color: 'bg-slate-100 text-slate-700 border-slate-200' },
]

interface Question {
  id: string
  stat: Stat
  order: number
}

interface Form {
  id: string
  title: string
  description: string | null
  isActive: boolean
  questions: Question[]
  _count: { responses: number }
}

export default function FormsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [forms, setForms] = useState<Form[]>([])
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingForm, setEditingForm] = useState<Form | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    statIds: [] as string[],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    if (formData.statIds.length === 0) {
      alert('Please select at least one stat')
      return
    }

    try {
      if (editingForm) {
        const res = await fetch(`/api/projects/${projectId}/forms/${editingForm.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (data.form) {
          setForms(forms.map(f => f.id === editingForm.id ? data.form : f))
        }
      } else {
        const res = await fetch(`/api/projects/${projectId}/forms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (data.form) {
          setForms([data.form, ...forms])
        }
      }
      resetForm()
    } catch (error) {
      console.error('Failed to save form:', error)
    }
  }

  const handleDelete = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? All responses will be lost.')) return

    try {
      await fetch(`/api/projects/${projectId}/forms/${formId}`, {
        method: 'DELETE',
      })
      setForms(forms.filter(f => f.id !== formId))
    } catch (error) {
      console.error('Failed to delete form:', error)
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

  const handleEdit = (form: Form) => {
    setEditingForm(form)
    setFormData({
      title: form.title,
      description: form.description || '',
      statIds: form.questions.map(q => q.stat.id),
    })
    setIsCreating(true)
  }

  const handleStatToggle = (statId: string) => {
    if (formData.statIds.includes(statId)) {
      setFormData({ ...formData, statIds: formData.statIds.filter(id => id !== statId) })
    } else {
      setFormData({ ...formData, statIds: [...formData.statIds, statId] })
    }
  }

  const copyShareLink = (formId: string) => {
    const url = `${window.location.origin}/f/${formId}`
    navigator.clipboard.writeText(url)
    setCopiedId(formId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const resetForm = () => {
    setIsCreating(false)
    setEditingForm(null)
    setFormData({ title: '', description: '', statIds: [] })
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

  const selectAllInCategory = (categoryValue: string) => {
    const grouped = groupStatsByCategory()
    const categoryStats = grouped[categoryValue] || []
    const categoryStatIds = categoryStats.map(s => s.id)
    const allSelected = categoryStatIds.every(id => formData.statIds.includes(id))
    
    if (allSelected) {
      // Deselect all in category
      setFormData({ ...formData, statIds: formData.statIds.filter(id => !categoryStatIds.includes(id)) })
    } else {
      // Select all in category
      const newIds = [...new Set([...formData.statIds, ...categoryStatIds])]
      setFormData({ ...formData, statIds: newIds })
    }
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
        <h2 className="text-2xl font-bold text-slate-800">Forms</h2>
        <button
          onClick={() => setIsCreating(true)}
          disabled={stats.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          Create Form
        </button>
      </div>

      {stats.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            You need to create at least one stat before creating forms. Go to the Stats tab first.
          </p>
        </div>
      )}

      <p className="text-slate-500 mb-6">
        Forms are questionnaires that players fill out. Each form includes stats you want to measure and a comment field.
      </p>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {editingForm ? 'Edit Form' : 'Create New Form'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                placeholder="e.g., Beta Feedback Survey"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                placeholder="Describe what this form is for..."
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Stats to Include *
              </label>
              <p className="text-xs text-slate-500 mb-3">
                {formData.statIds.length} stat{formData.statIds.length !== 1 ? 's' : ''} selected
              </p>
              
              {(() => {
                const grouped = groupStatsByCategory()
                const hasCategories = Object.entries(grouped).some(([key, items]) => key !== 'uncategorized' && items.length > 0)
                
                if (!hasCategories) {
                  // Show flat grid if no categories
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {stats.map((stat) => (
                        <button
                          key={stat.id}
                          type="button"
                          onClick={() => handleStatToggle(stat.id)}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            formData.statIds.includes(stat.id)
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-slate-200 hover:border-slate-300 text-slate-800'
                          }`}
                        >
                          <p className="font-medium text-sm">{stat.name}</p>
                          <p className="text-xs text-slate-500">{stat.minValue} - {stat.maxValue}</p>
                        </button>
                      ))}
                    </div>
                  )
                }
                
                // Show grouped by category
                return (
                  <div className="space-y-4">
                    {STAT_CATEGORIES.map((category) => {
                      const categoryStats = grouped[category.value]
                      if (!categoryStats || categoryStats.length === 0) return null
                      
                      const allSelected = categoryStats.every(s => formData.statIds.includes(s.id))
                      const someSelected = categoryStats.some(s => formData.statIds.includes(s.id))
                      
                      return (
                        <div key={category.value} className="border border-slate-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${category.color}`}>
                              {category.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => selectAllInCategory(category.value)}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                allSelected 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : someSelected
                                    ? 'bg-purple-50 text-purple-600'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                                className={`p-2 rounded-lg border text-left transition-colors ${
                                  formData.statIds.includes(stat.id)
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-800'
                                }`}
                              >
                                <p className="font-medium text-sm">{stat.name}</p>
                                <p className="text-xs text-slate-500">{stat.minValue} - {stat.maxValue}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    
                    {/* Uncategorized stats */}
                    {grouped.uncategorized.length > 0 && (
                      <div className="border border-slate-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            Uncategorized
                          </span>
                          <button
                            type="button"
                            onClick={() => selectAllInCategory('uncategorized')}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              grouped.uncategorized.every(s => formData.statIds.includes(s.id))
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {grouped.uncategorized.every(s => formData.statIds.includes(s.id)) ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {grouped.uncategorized.map((stat) => (
                            <button
                              key={stat.id}
                              type="button"
                              onClick={() => handleStatToggle(stat.id)}
                              className={`p-2 rounded-lg border text-left transition-colors ${
                                formData.statIds.includes(stat.id)
                                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                                  : 'border-slate-200 hover:border-slate-300 text-slate-800'
                              }`}
                            >
                              <p className="font-medium text-sm">{stat.name}</p>
                              <p className="text-xs text-slate-500">{stat.minValue} - {stat.maxValue}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
              
              {formData.statIds.length === 0 && (
                <p className="text-sm text-red-500 mt-2">Select at least one stat</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {editingForm ? 'Update Form' : 'Create Form'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Forms List */}
      {forms.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No forms yet</h3>
          <p className="text-slate-500 mb-4">Create forms to start collecting player feedback.</p>
          {stats.length > 0 && (
            <button
              onClick={() => setIsCreating(true)}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Create your first form
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    form.isActive ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    <FileText className={form.isActive ? 'text-green-600' : 'text-slate-400'} size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{form.title}</h4>
                    <p className="text-sm text-slate-500">
                      {form.questions.length} questions · {form._count.responses} responses
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    form.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {form.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {form.description && (
                <p className="text-sm text-slate-500 mb-3">{form.description}</p>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {form.questions.map((q) => {
                  const catInfo = getCategoryInfo(q.stat.category)
                  return (
                    <span 
                      key={q.id} 
                      className={`text-xs px-2 py-1 rounded ${
                        catInfo ? catInfo.color : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {q.stat.name}
                    </span>
                  )
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyShareLink(form.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    {copiedId === form.id ? (
                      <>
                        <Check size={14} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <LinkIcon size={14} />
                        Copy Link
                      </>
                    )}
                  </button>
                  <a
                    href={`/f/${form.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye size={14} />
                    Preview
                  </a>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(form)}
                    className={`p-2 rounded-lg transition-colors ${
                      form.isActive 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-slate-400 hover:bg-slate-50'
                    }`}
                    title={form.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {form.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => handleEdit(form)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(form.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
