'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Edit2, Trash2, BarChart2, Sparkles, X } from 'lucide-react'

interface Stat {
  id: string
  name: string
  description: string | null
  minValue: number
  maxValue: number
}

interface StatTemplate {
  name: string
  description: string
  minValue: number
  maxValue: number
}

interface TemplateCategory {
  name: string
  templates: StatTemplate[]
}

const STAT_TEMPLATES: TemplateCategory[] = [
  {
    name: 'Core Gameplay',
    templates: [
      { name: 'Fun Factor', description: 'How enjoyable was the overall experience?', minValue: 1, maxValue: 10 },
      { name: 'Difficulty', description: 'Was the game too easy or too hard?', minValue: 1, maxValue: 10 },
      { name: 'Game Length', description: 'Was the match/session length appropriate?', minValue: 1, maxValue: 10 },
      { name: 'Replayability', description: 'Would you want to play again?', minValue: 1, maxValue: 10 },
    ]
  },
  {
    name: 'Card/Deck Balance (TCG)',
    templates: [
      { name: 'Card Balance', description: 'Do cards feel fair and balanced?', minValue: 1, maxValue: 10 },
      { name: 'Deck Variety', description: 'Are there enough viable deck strategies?', minValue: 1, maxValue: 10 },
      { name: 'Meta Diversity', description: 'Is the competitive meta healthy?', minValue: 1, maxValue: 10 },
      { name: 'Power Creep', description: 'Do newer cards feel overpowered?', minValue: 1, maxValue: 10 },
    ]
  },
  {
    name: 'User Experience',
    templates: [
      { name: 'UI Clarity', description: 'Is the interface easy to understand?', minValue: 1, maxValue: 10 },
      { name: 'Tutorial Quality', description: 'Did the tutorial teach you well?', minValue: 1, maxValue: 10 },
      { name: 'Controls', description: 'Are the controls intuitive and responsive?', minValue: 1, maxValue: 10 },
      { name: 'Match Flow', description: 'Does the game flow smoothly?', minValue: 1, maxValue: 10 },
    ]
  },
  {
    name: 'Visuals & Audio',
    templates: [
      { name: 'Art Quality', description: 'How good is the visual artwork?', minValue: 1, maxValue: 10 },
      { name: 'Visual Effects', description: 'Are animations and effects satisfying?', minValue: 1, maxValue: 10 },
      { name: 'Sound Design', description: 'Are sound effects appropriate?', minValue: 1, maxValue: 10 },
      { name: 'Music', description: 'Does the soundtrack fit the game?', minValue: 1, maxValue: 10 },
    ]
  },
  {
    name: 'Progression & Economy',
    templates: [
      { name: 'Reward Satisfaction', description: 'Do rewards feel meaningful?', minValue: 1, maxValue: 10 },
      { name: 'Grind Factor', description: 'Is progression too grindy?', minValue: 1, maxValue: 10 },
      { name: 'F2P Friendliness', description: 'Is the game fair for free players?', minValue: 1, maxValue: 10 },
      { name: 'Collection Progress', description: 'Is collecting items/cards satisfying?', minValue: 1, maxValue: 10 },
    ]
  },
  {
    name: 'Multiplayer',
    templates: [
      { name: 'Matchmaking Quality', description: 'Are matches fair and balanced?', minValue: 1, maxValue: 10 },
      { name: 'Connection Stability', description: 'Any lag or disconnects?', minValue: 1, maxValue: 10 },
      { name: 'Opponent Skill Match', description: 'Were opponents your skill level?', minValue: 1, maxValue: 10 },
    ]
  },
  {
    name: 'Overall',
    templates: [
      { name: 'Would Recommend', description: 'Would you recommend to a friend?', minValue: 1, maxValue: 10 },
      { name: 'Overall Score', description: 'Overall rating of the game', minValue: 1, maxValue: 10 },
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
    })
    setIsCreating(true)
  }

  const resetForm = () => {
    setIsCreating(false)
    setEditingStat(null)
    setFormData({ name: '', description: '', minValue: 1, maxValue: 10 })
  }

  const handleAddFromTemplate = async (template: StatTemplate) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
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
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Stats</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Sparkles size={20} />
            Use Template
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} />
            Add Stat
          </button>
        </div>
      </div>

      <p className="text-slate-500 mb-6">
        Stats are the metrics you want to track in your feedback forms. For example: &quot;Fun Rating&quot;, &quot;Difficulty&quot;, &quot;Graphics Quality&quot;.
      </p>

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

            <div className="grid grid-cols-2 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => (
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
              {stat.description && (
                <p className="text-sm text-slate-500">{stat.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
