'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Edit2, Trash2, BarChart2 } from 'lucide-react'

interface Stat {
  id: string
  name: string
  description: string | null
  minValue: number
  maxValue: number
}

export default function StatsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
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
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={20} />
          Add Stat
        </button>
      </div>

      <p className="text-slate-500 mb-6">
        Stats are the metrics you want to track in your feedback forms. For example: &quot;Fun Rating&quot;, &quot;Difficulty&quot;, &quot;Graphics Quality&quot;.
      </p>

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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
