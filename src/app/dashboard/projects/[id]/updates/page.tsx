'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Edit2, Trash2, GitBranch, Calendar, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Version {
  id: string
  version: string
  title: string
  description: string | null
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
}

export default function UpdatesPage() {
  const params = useParams()
  const projectId = params.id as string

  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingVersion, setEditingVersion] = useState<Version | null>(null)
  const [formData, setFormData] = useState({
    version: '',
    title: '',
    description: '',
  })

  useEffect(() => {
    fetchVersions()
  }, [projectId])

  const fetchVersions = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`)
      const data = await res.json()
      if (data.versions) {
        setVersions(data.versions)
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.version.trim() || !formData.title.trim()) return

    try {
      if (editingVersion) {
        const res = await fetch(`/api/projects/${projectId}/versions/${editingVersion.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (data.version) {
          setVersions(versions.map(v => v.id === editingVersion.id ? data.version : v))
        }
      } else {
        const res = await fetch(`/api/projects/${projectId}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (data.version) {
          setVersions([data.version, ...versions])
        }
      }
      resetForm()
    } catch (error) {
      console.error('Failed to save version:', error)
    }
  }

  const handleDelete = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version?')) return

    try {
      await fetch(`/api/projects/${projectId}/versions/${versionId}`, {
        method: 'DELETE',
      })
      setVersions(versions.filter(v => v.id !== versionId))
    } catch (error) {
      console.error('Failed to delete version:', error)
    }
  }

  const handleEdit = (version: Version) => {
    setEditingVersion(version)
    setFormData({
      version: version.version,
      title: version.title,
      description: version.description || '',
    })
    setIsCreating(true)
  }

  const resetForm = () => {
    setIsCreating(false)
    setEditingVersion(null)
    setFormData({ version: '', title: '', description: '' })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
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
          <div className="text-lg font-semibold">Versions</div>
          <div className="text-sm text-muted-foreground">
            Manage your game updates, devlogs, and playtest versions.
          </div>
        </div>
        <Button
          className="rounded-2xl"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Version
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {editingVersion ? 'Edit Version' : 'Create New Version'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Version *
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 bg-white"
                placeholder="e.g., v0.1.0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 bg-white"
                placeholder="e.g., New Combat System"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 bg-white resize-none"
                placeholder="Brief description of this version..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="rounded-xl">
                {editingVersion ? 'Update Version' : 'Create Version'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={resetForm}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Versions Table */}
      {versions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <GitBranch className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No versions yet</h3>
          <p className="text-slate-500 mb-4">Create your first version to start tracking updates.</p>
          <Button
            variant="link"
            onClick={() => setIsCreating(true)}
            className="text-primary"
          >
            Create your first version
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Version</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Date</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((version) => (
                <tr key={version.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 font-mono text-sm font-medium text-slate-800">
                      <GitBranch size={14} className="text-slate-400" />
                      {version.version}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{version.title}</div>
                      {version.description && (
                        <div className="text-xs text-slate-500 line-clamp-1">{version.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                      <Calendar size={14} />
                      {formatDate(version.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/projects/${projectId}/updates/${version.id}/editor`}
                        className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit Page"
                      >
                        <ExternalLink size={16} />
                      </Link>
                      <button
                        onClick={() => handleEdit(version)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Details"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(version.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
