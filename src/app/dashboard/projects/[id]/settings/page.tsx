'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Settings, Trash2, Save, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Project {
  id: string
  name: string
  description: string | null
  tierLowMax: number
  tierMediumMax: number
  tierLowLabel: string
  tierMediumLabel: string
  tierHighLabel: string
  tierLowMsg: string | null
  tierMediumMsg: string | null
  tierHighMsg: string | null
}

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [tierData, setTierData] = useState({
    tierLowMax: 40,
    tierMediumMax: 70,
    tierLowLabel: 'Needs Improvement',
    tierMediumLabel: 'Good',
    tierHighLabel: 'Excellent',
    tierLowMsg: '',
    tierMediumMsg: '',
    tierHighMsg: '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      if (data.project) {
        setProject(data.project)
        setFormData({
          name: data.project.name,
          description: data.project.description || '',
        })
        setTierData({
          tierLowMax: data.project.tierLowMax || 40,
          tierMediumMax: data.project.tierMediumMax || 70,
          tierLowLabel: data.project.tierLowLabel || 'Needs Improvement',
          tierMediumLabel: data.project.tierMediumLabel || 'Good',
          tierHighLabel: data.project.tierHighLabel || 'Excellent',
          tierLowMsg: data.project.tierLowMsg || '',
          tierMediumMsg: data.project.tierMediumMsg || '',
          tierHighMsg: data.project.tierHighMsg || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ...tierData }),
      })

      if (res.ok) {
        const data = await res.json()
        setProject(data.project)
        setMessage({ type: 'success', text: 'Project updated successfully!' })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: 'Failed to update project' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update project' })
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone. All forms, stats, and responses will be permanently deleted.')) {
      return
    }

    setDeleting(true)

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setMessage({ type: 'error', text: 'Failed to delete project' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete project' })
      console.error(error)
    } finally {
      setDeleting(false)
    }
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
      <div>
        <div className="text-lg font-semibold">Settings</div>
        <div className="text-sm text-muted-foreground">
          Configure your game settings and score tiers.
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Project Settings */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="text-purple-600" size={24} />
          <h3 className="text-lg font-semibold text-slate-800">Project Settings</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
              placeholder="My Awesome Game"
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
              placeholder="A brief description of your game..."
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>

      {/* Score Tiers Configuration */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Award className="text-purple-600" size={24} />
          <h3 className="text-lg font-semibold text-slate-800">Score Tiers</h3>
        </div>
        
        <p className="text-slate-500 text-sm mb-6">
          Configure how scores are categorized and what messages players see after submitting feedback.
        </p>

        {/* Tier Ranges */}
        <div className="mb-6">
          <h4 className="font-medium text-slate-700 mb-3">Tier Ranges</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <label className="block text-sm font-medium text-red-700 mb-2">
                Low Tier (0% - {tierData.tierLowMax}%)
              </label>
              <input
                type="number"
                value={tierData.tierLowMax}
                onChange={(e) => setTierData({ ...tierData, tierLowMax: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-800 bg-white"
                min={1}
                max={tierData.tierMediumMax - 1}
              />
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <label className="block text-sm font-medium text-yellow-700 mb-2">
                Medium Tier ({tierData.tierLowMax + 1}% - {tierData.tierMediumMax}%)
              </label>
              <input
                type="number"
                value={tierData.tierMediumMax}
                onChange={(e) => setTierData({ ...tierData, tierMediumMax: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-yellow-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-800 bg-white"
                min={tierData.tierLowMax + 1}
                max={99}
              />
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <label className="block text-sm font-medium text-green-700 mb-2">
                High Tier ({tierData.tierMediumMax + 1}% - 100%)
              </label>
              <div className="px-3 py-2 bg-green-100 border border-green-200 rounded-lg text-slate-600 text-sm">
                Automatically calculated
              </div>
            </div>
          </div>
        </div>

        {/* Tier Labels */}
        <div className="mb-6">
          <h4 className="font-medium text-slate-700 mb-3">Tier Labels</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Low Tier Label</label>
              <input
                type="text"
                value={tierData.tierLowLabel}
                onChange={(e) => setTierData({ ...tierData, tierLowLabel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                placeholder="Needs Improvement"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Medium Tier Label</label>
              <input
                type="text"
                value={tierData.tierMediumLabel}
                onChange={(e) => setTierData({ ...tierData, tierMediumLabel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                placeholder="Good"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">High Tier Label</label>
              <input
                type="text"
                value={tierData.tierHighLabel}
                onChange={(e) => setTierData({ ...tierData, tierHighLabel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                placeholder="Excellent"
              />
            </div>
          </div>
        </div>

        {/* Tier Messages */}
        <div>
          <h4 className="font-medium text-slate-700 mb-3">Tier Messages (shown to players after submission)</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-red-600 mb-1">Low Tier Message</label>
              <textarea
                value={tierData.tierLowMsg}
                onChange={(e) => setTierData({ ...tierData, tierLowMsg: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                placeholder="Thanks for the honest feedback! We'll work on improving..."
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-600 mb-1">Medium Tier Message</label>
              <textarea
                value={tierData.tierMediumMsg}
                onChange={(e) => setTierData({ ...tierData, tierMediumMsg: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                placeholder="Good foundation! Here's what we're focusing on..."
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-600 mb-1">High Tier Message</label>
              <textarea
                value={tierData.tierHighMsg}
                onChange={(e) => setTierData({ ...tierData, tierHighMsg: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-white"
                placeholder="Awesome! Glad you enjoyed it!"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h4 className="font-medium text-slate-700 mb-3">Preview</h4>
          <div className="flex gap-2">
            <div className="flex-1 text-center p-3 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white">
              <div className="text-xs opacity-80">0-{tierData.tierLowMax}%</div>
              <div className="font-semibold">{tierData.tierLowLabel || 'Low'}</div>
            </div>
            <div className="flex-1 text-center p-3 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
              <div className="text-xs opacity-80">{tierData.tierLowMax + 1}-{tierData.tierMediumMax}%</div>
              <div className="font-semibold">{tierData.tierMediumLabel || 'Medium'}</div>
            </div>
            <div className="flex-1 text-center p-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <div className="text-xs opacity-80">{tierData.tierMediumMax + 1}-100%</div>
              <div className="font-semibold">{tierData.tierHighLabel || 'High'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-red-200">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="text-red-600" size={24} />
          <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
        </div>

        <p className="text-slate-600 mb-4">
          Once you delete a project, there is no going back. All forms, stats, and responses will be permanently deleted.
        </p>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {deleting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Deleting...
            </>
          ) : (
            <>
              <Trash2 size={18} />
              Delete Project
            </>
          )}
        </button>
      </div>
    </div>
  )
}
