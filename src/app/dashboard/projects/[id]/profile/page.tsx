'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FileText, Plus, Save, Trash2, Edit, Eye, Calendar, Tag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/ui/confirm-modal'

interface Version {
  id: string
  version: string
  title: string
  content: string
  changelog: string | null
  imageUrl: string | null
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
}

interface Project {
  id: string
  name: string
  rules: string | null
  features: string[]
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [project, setProject] = useState<Project | null>(null)
  const [versions, setVersions] = useState<Version[]>([])
  const [rules, setRules] = useState('')
  const [features, setFeatures] = useState<string[]>([])
  const [featureInput, setFeatureInput] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  
  // Version modal state
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [editingVersion, setEditingVersion] = useState<Version | null>(null)
  const [versionForm, setVersionForm] = useState({
    version: '',
    title: '',
    content: '',
    changelog: '',
    imageUrl: '',
    isPublished: false,
  })

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      const [projectRes, versionsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/versions`),
      ])
      
      const projectData = await projectRes.json()
      const versionsData = await versionsRes.json()
      
      if (projectData.project) {
        setProject(projectData.project)
        setRules(projectData.project.rules || '')
        setFeatures(projectData.project.features || [])
      }
      
      if (versionsData.versions) {
        setVersions(versionsData.versions)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addFeature = () => {
    const feature = featureInput.trim()
    if (feature && !features.includes(feature) && features.length < 10) {
      setFeatures([...features, feature])
      setFeatureInput('')
    }
  }

  const removeFeature = (featureToRemove: string) => {
    setFeatures(features.filter(f => f !== featureToRemove))
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules, features }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile saved successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save profile' })
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const openVersionModal = (version?: Version) => {
    if (version) {
      setEditingVersion(version)
      setVersionForm({
        version: version.version,
        title: version.title,
        content: version.content,
        changelog: version.changelog || '',
        imageUrl: version.imageUrl || '',
        isPublished: version.isPublished,
      })
    } else {
      setEditingVersion(null)
      setVersionForm({
        version: '',
        title: '',
        content: '',
        changelog: '',
        imageUrl: '',
        isPublished: false,
      })
    }
    setShowVersionModal(true)
  }

  const handleSaveVersion = async () => {
    if (!versionForm.version || !versionForm.title) return

    try {
      const url = editingVersion 
        ? `/api/projects/${projectId}/versions/${editingVersion.id}`
        : `/api/projects/${projectId}/versions`
      
      const res = await fetch(url, {
        method: editingVersion ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(versionForm),
      })

      if (res.ok) {
        setShowVersionModal(false)
        fetchData()
        setMessage({ type: 'success', text: editingVersion ? 'Version updated!' : 'Version created!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save version' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save version' })
      console.error(error)
    }
  }

  const handleDeleteVersion = async (versionId: string) => {
    setDeleteConfirm(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/versions/${versionId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchData()
        setMessage({ type: 'success', text: 'Version deleted!' })
      }
    } catch (error) {
      console.error(error)
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
        <div className="text-lg font-semibold">Game Profile</div>
        <div className="text-sm text-muted-foreground">
          Manage your game rules, features, and version releases.
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Game Rules */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> Game Rules / How to Play
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-3">
            Write instructions, rules, or how-to-play guide for your game. Supports markdown formatting.
          </p>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            className="w-full rounded-2xl px-4 py-3 border bg-background text-sm resize-none font-mono"
            placeholder="# How to Play&#10;&#10;1. First, do this...&#10;2. Then, do that...&#10;&#10;## Rules&#10;- Rule 1&#10;- Rule 2"
            rows={12}
          />
        </CardContent>
      </Card>

      {/* Key Features */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Tag className="h-4 w-4" /> Key Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-3">
            List the key features of your game (max 10).
          </p>
          <div className="flex gap-2 mb-3">
            <Input
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              className="rounded-2xl"
              placeholder="Add a feature..."
            />
            <Button type="button" variant="outline" className="rounded-2xl" onClick={addFeature}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {features.map((feature, idx) => (
                <Badge key={idx} variant="secondary" className="rounded-full cursor-pointer py-1 px-3" onClick={() => removeFeature(feature)}>
                  {feature} ×
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Profile Button */}
      <Button onClick={handleSaveProfile} className="rounded-2xl" disabled={saving}>
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'Saving...' : 'Save Profile'}
      </Button>

      {/* Versions */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Game Versions
            </CardTitle>
            <Button size="sm" className="rounded-2xl" onClick={() => openVersionModal()}>
              <Plus className="h-4 w-4 mr-1" /> Add Version
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            Track your game releases and updates. Published versions will appear on your public game page.
          </p>
          
          {versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No versions yet</p>
              <p className="text-sm">Add your first version to start tracking releases</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div key={version.id} className="flex items-center justify-between p-4 rounded-2xl border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-mono font-bold text-primary">
                      {version.version}
                    </div>
                    <div>
                      <div className="font-medium">{version.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {version.isPublished ? (
                      <Badge variant="default" className="rounded-full bg-green-500">
                        <Eye className="h-3 w-3 mr-1" /> Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded-full">
                        Draft
                      </Badge>
                    )}
                    <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => openVersionModal(version)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-xl text-destructive" onClick={() => setDeleteConfirm(version.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">
                {editingVersion ? 'Edit Version' : 'Add New Version'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Version *</label>
                  <Input
                    value={versionForm.version}
                    onChange={(e) => setVersionForm({ ...versionForm, version: e.target.value })}
                    className="rounded-2xl mt-1"
                    placeholder="v1.0.0"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Title *</label>
                  <Input
                    value={versionForm.title}
                    onChange={(e) => setVersionForm({ ...versionForm, title: e.target.value })}
                    className="rounded-2xl mt-1"
                    placeholder="Initial Release"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Cover Image URL</label>
                <Input
                  value={versionForm.imageUrl}
                  onChange={(e) => setVersionForm({ ...versionForm, imageUrl: e.target.value })}
                  className="rounded-2xl mt-1"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Content (Markdown)</label>
                <textarea
                  value={versionForm.content}
                  onChange={(e) => setVersionForm({ ...versionForm, content: e.target.value })}
                  className="w-full rounded-2xl mt-1 px-4 py-3 border bg-background text-sm resize-none font-mono"
                  placeholder="Describe this version..."
                  rows={6}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Changelog</label>
                <textarea
                  value={versionForm.changelog}
                  onChange={(e) => setVersionForm({ ...versionForm, changelog: e.target.value })}
                  className="w-full rounded-2xl mt-1 px-4 py-3 border bg-background text-sm resize-none font-mono"
                  placeholder="- Added new feature&#10;- Fixed bug&#10;- Improved performance"
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={versionForm.isPublished}
                  onChange={(e) => setVersionForm({ ...versionForm, isPublished: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isPublished" className="text-sm">
                  Publish this version (visible on public game page)
                </label>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => setShowVersionModal(false)}>
                Cancel
              </Button>
              <Button className="rounded-2xl" onClick={handleSaveVersion}>
                {editingVersion ? 'Update Version' : 'Create Version'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete Version"
        message="Are you sure you want to delete this version?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => deleteConfirm && handleDeleteVersion(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
