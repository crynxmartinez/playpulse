'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Edit2, Trash2, BarChart2, Sparkles, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'

interface Stat {
  id: string
  name: string
  description: string | null
  minValue: number
  maxValue: number
  category: string | null
  weight: number
}

interface StatTemplate {
  name: string
  description: string
  minValue: number
  maxValue: number
  category: string
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

interface TemplateCategory {
  name: string
  templates: StatTemplate[]
}

const STAT_TEMPLATES: TemplateCategory[] = [
  {
    name: 'Core Gameplay',
    templates: [
      { name: 'Fun Factor', description: 'How enjoyable was the overall experience?', minValue: 1, maxValue: 10, category: 'gameplay' },
      { name: 'Difficulty', description: 'Was the game too easy or too hard?', minValue: 1, maxValue: 10, category: 'gameplay' },
      { name: 'Game Length', description: 'Was the match/session length appropriate?', minValue: 1, maxValue: 10, category: 'gameplay' },
      { name: 'Replayability', description: 'Would you want to play again?', minValue: 1, maxValue: 10, category: 'gameplay' },
    ]
  },
  {
    name: 'Card/Deck Balance (TCG)',
    templates: [
      { name: 'Card Balance', description: 'Do cards feel fair and balanced?', minValue: 1, maxValue: 10, category: 'balance' },
      { name: 'Deck Variety', description: 'Are there enough viable deck strategies?', minValue: 1, maxValue: 10, category: 'balance' },
      { name: 'Meta Diversity', description: 'Is the competitive meta healthy?', minValue: 1, maxValue: 10, category: 'balance' },
      { name: 'Power Creep', description: 'Do newer cards feel overpowered?', minValue: 1, maxValue: 10, category: 'balance' },
    ]
  },
  {
    name: 'User Experience',
    templates: [
      { name: 'UI Clarity', description: 'Is the interface easy to understand?', minValue: 1, maxValue: 10, category: 'ux' },
      { name: 'Tutorial Quality', description: 'Did the tutorial teach you well?', minValue: 1, maxValue: 10, category: 'ux' },
      { name: 'Controls', description: 'Are the controls intuitive and responsive?', minValue: 1, maxValue: 10, category: 'ux' },
      { name: 'Match Flow', description: 'Does the game flow smoothly?', minValue: 1, maxValue: 10, category: 'ux' },
    ]
  },
  {
    name: 'Visuals & Audio',
    templates: [
      { name: 'Art Quality', description: 'How good is the visual artwork?', minValue: 1, maxValue: 10, category: 'visuals' },
      { name: 'Visual Effects', description: 'Are animations and effects satisfying?', minValue: 1, maxValue: 10, category: 'visuals' },
      { name: 'Sound Design', description: 'Are sound effects appropriate?', minValue: 1, maxValue: 10, category: 'visuals' },
      { name: 'Music', description: 'Does the soundtrack fit the game?', minValue: 1, maxValue: 10, category: 'visuals' },
    ]
  },
  {
    name: 'Progression & Economy',
    templates: [
      { name: 'Reward Satisfaction', description: 'Do rewards feel meaningful?', minValue: 1, maxValue: 10, category: 'progression' },
      { name: 'Grind Factor', description: 'Is progression too grindy?', minValue: 1, maxValue: 10, category: 'progression' },
      { name: 'F2P Friendliness', description: 'Is the game fair for free players?', minValue: 1, maxValue: 10, category: 'progression' },
      { name: 'Collection Progress', description: 'Is collecting items/cards satisfying?', minValue: 1, maxValue: 10, category: 'progression' },
    ]
  },
  {
    name: 'Multiplayer',
    templates: [
      { name: 'Matchmaking Quality', description: 'Are matches fair and balanced?', minValue: 1, maxValue: 10, category: 'multiplayer' },
      { name: 'Connection Stability', description: 'Any lag or disconnects?', minValue: 1, maxValue: 10, category: 'multiplayer' },
      { name: 'Opponent Skill Match', description: 'Were opponents your skill level?', minValue: 1, maxValue: 10, category: 'multiplayer' },
    ]
  },
  {
    name: 'Overall',
    templates: [
      { name: 'Would Recommend', description: 'Would you recommend to a friend?', minValue: 1, maxValue: 10, category: 'overall' },
      { name: 'Overall Score', description: 'Overall rating of the game', minValue: 1, maxValue: 10, category: 'overall' },
    ]
  },
]

export default function StatsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editingStat, setEditingStat] = useState<Stat | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    minValue: 1,
    maxValue: 10,
    category: '',
    weight: 1.0,
  })

  useEffect(() => {
    fetchStats()
  }, [projectId])

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/stats`)
      const data = await res.json()
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      if (editingStat) {
        const res = await fetch(`/api/projects/${projectId}/stats/${editingStat.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (data.stat) {
          setStats(stats.map(s => s.id === editingStat.id ? data.stat : s))
        }
      } else {
        const res = await fetch(`/api/projects/${projectId}/stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (data.stat) {
          setStats([...stats, data.stat])
        }
      }
      resetForm()
    } catch (error) {
      console.error('Failed to save stat:', error)
    }
  }

  const handleDelete = async (statId: string) => {
    if (!confirm('Are you sure you want to delete this stat?')) return

    try {
      await fetch(`/api/projects/${projectId}/stats/${statId}`, {
        method: 'DELETE',
      })
      setStats(stats.filter(s => s.id !== statId))
    } catch (error) {
      console.error('Failed to delete stat:', error)
    }
  }

  const handleEdit = (stat: Stat) => {
    setEditingStat(stat)
    setFormData({
      name: stat.name,
      description: stat.description || '',
      minValue: stat.minValue,
      maxValue: stat.maxValue,
      category: stat.category || '',
      weight: stat.weight || 1.0,
    })
    setIsCreating(true)
  }

  const resetForm = () => {
    setIsCreating(false)
    setEditingStat(null)
    setFormData({ name: '', description: '', minValue: 1, maxValue: 10, category: '', weight: 1.0 })
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

  const handleAddFromTemplate = async (template: StatTemplate) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...template, weight: 1.0 }),
      })
      const data = await res.json()
      if (data.stat) {
        setStats([...stats, data.stat])
      }
    } catch (error) {
      console.error('Failed to add stat from template:', error)
    }
  }

  const isStatAlreadyAdded = (templateName: string) => {
    return stats.some(s => s.name.toLowerCase() === templateName.toLowerCase())
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Stats</div>
          <div className="text-sm text-muted-foreground">
            Metrics to track in your campaigns. Example: Fun Rating, Difficulty.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => setShowTemplates(true)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Use Template
          </Button>
          <Button
            className="rounded-2xl"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Stat
          </Button>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Stat Templates</h3>
                <p className="text-sm text-slate-500 mt-1">Click on any stat to add it to your project</p>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {STAT_TEMPLATES.map((category) => (
                  <div key={category.name}>
                    <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
                      {category.name}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {category.templates.map((template) => {
                        const alreadyAdded = isStatAlreadyAdded(template.name)
                        return (
                          <button
                            key={template.name}
                            onClick={() => !alreadyAdded && handleAddFromTemplate(template)}
                            disabled={alreadyAdded}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              alreadyAdded
                                ? 'border-green-200 bg-green-50 cursor-default'
                                : 'border-slate-200 hover:border-purple-400 hover:bg-purple-50 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-medium ${alreadyAdded ? 'text-green-700' : 'text-slate-800'}`}>
                                {template.name}
                              </span>
                              {alreadyAdded && (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                  Added
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowTemplates(false)}
                className="w-full py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {editingStat ? 'Edit Stat' : 'Create New Stat'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                placeholder="e.g., Fun Rating"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                placeholder="e.g., How fun was the game?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
              >
                <option value="">No Category</option>
                {STAT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Min Value
                </label>
                <input
                  type="number"
                  value={formData.minValue}
                  onChange={(e) => setFormData({ ...formData, minValue: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Max Value
                </label>
                <input
                  type="number"
                  value={formData.maxValue}
                  onChange={(e) => setFormData({ ...formData, maxValue: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Weight
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                  min={0.1}
                  max={5}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {editingStat ? 'Update Stat' : 'Create Stat'}
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

      {/* Stats List */}
      {stats.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <BarChart2 className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No stats yet</h3>
          <p className="text-slate-500 mb-4">Create stats to define the metrics you want to track.</p>
          <button
            onClick={() => setIsCreating(true)}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Create your first stat
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats grouped by category */}
          {(() => {
            const grouped = groupStatsByCategory()
            const hasCategories = Object.entries(grouped).some(([key, items]) => key !== 'uncategorized' && items.length > 0)
            
            if (!hasCategories) {
              // Show flat grid if no categories used
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.map((stat) => {
                    const catInfo = getCategoryInfo(stat.category)
                    return (
                      <div
                        key={stat.id}
                        className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              <BarChart2 className="text-purple-600" size={20} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800">{stat.name}</h4>
                              <p className="text-sm text-slate-500">
                                Range: {stat.minValue} - {stat.maxValue}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(stat)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(stat.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        {catInfo && (
                          <span className={`inline-block text-xs px-2 py-1 rounded-full ${catInfo.color} mb-2`}>
                            {catInfo.label}
                          </span>
                        )}
                        {stat.description && (
                          <p className="text-sm text-slate-500">{stat.description}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            }
            
            // Show grouped by category
            return (
              <>
                {STAT_CATEGORIES.map((category) => {
                  const categoryStats = grouped[category.value]
                  if (!categoryStats || categoryStats.length === 0) return null
                  
                  return (
                    <div key={category.value} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${category.color}`}>
                          {category.label}
                        </span>
                        <span className="text-sm text-slate-400">
                          {categoryStats.length} stat{categoryStats.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryStats.map((stat) => (
                          <div
                            key={stat.id}
                            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg ${category.color.split(' ')[0]} flex items-center justify-center`}>
                                  <BarChart2 className={category.color.split(' ')[1]} size={20} />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-slate-800">{stat.name}</h4>
                                  <p className="text-sm text-slate-500">
                                    Range: {stat.minValue} - {stat.maxValue}
                                    {stat.weight !== 1 && ` • Weight: ${stat.weight}x`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEdit(stat)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(stat.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            {stat.description && (
                              <p className="text-sm text-slate-500">{stat.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                
                {/* Uncategorized stats */}
                {grouped.uncategorized.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                        Uncategorized
                      </span>
                      <span className="text-sm text-slate-400">
                        {grouped.uncategorized.length} stat{grouped.uncategorized.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {grouped.uncategorized.map((stat) => (
                        <div
                          key={stat.id}
                          className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <BarChart2 className="text-gray-600" size={20} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-800">{stat.name}</h4>
                                <p className="text-sm text-slate-500">
                                  Range: {stat.minValue} - {stat.maxValue}
                                  {stat.weight !== 1 && ` • Weight: ${stat.weight}x`}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEdit(stat)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(stat.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          {stat.description && (
                            <p className="text-sm text-slate-500">{stat.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
