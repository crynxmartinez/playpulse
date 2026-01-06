'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, GripVertical, Trash2, Settings, Eye, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Version {
  id: string
  version: string
  title: string
  content: string
  changelog: string | null
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
}

interface Section {
  id: string
  order: number
  title: string | null
  layout: string
  backgroundColor: string | null
  accentColor: string | null
  blocks: Block[]
}

interface Block {
  id: string
  order: number
  type: string
  data: Record<string, unknown>
}

export default function VersionEditorPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const versionId = params.versionId as string

  const [version, setVersion] = useState<Version | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [showBlockPicker, setShowBlockPicker] = useState(false)

  useEffect(() => {
    fetchVersion()
    fetchSections()
  }, [projectId, versionId])

  const fetchVersion = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/versions/${versionId}`)
      const data = await res.json()
      if (data.version) {
        setVersion(data.version)
      }
    } catch (error) {
      console.error('Failed to fetch version:', error)
    }
  }

  const fetchSections = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/versions/${versionId}/sections`)
      const data = await res.json()
      if (data.sections) {
        setSections(data.sections)
        if (data.sections.length > 0 && !selectedSectionId) {
          setSelectedSectionId(data.sections[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSection = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/versions/${versionId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Section',
          order: sections.length,
        }),
      })
      const data = await res.json()
      if (data.section) {
        setSections([...sections, { ...data.section, blocks: [] }])
        setSelectedSectionId(data.section.id)
      }
    } catch (error) {
      console.error('Failed to add section:', error)
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Delete this section and all its blocks?')) return

    try {
      await fetch(`/api/projects/${projectId}/versions/${versionId}/sections/${sectionId}`, {
        method: 'DELETE',
      })
      const remaining = sections.filter(s => s.id !== sectionId)
      setSections(remaining)
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(remaining[0]?.id || null)
      }
    } catch (error) {
      console.error('Failed to delete section:', error)
    }
  }

  const handleUpdateSection = async (sectionId: string, updates: Partial<Section>) => {
    try {
      await fetch(`/api/projects/${projectId}/versions/${versionId}/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    } catch (error) {
      console.error('Failed to update section:', error)
    }
  }

  const handleAddBlock = async (type: string) => {
    if (!selectedSectionId) return

    try {
      const res = await fetch(`/api/projects/${projectId}/versions/${versionId}/sections/${selectedSectionId}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          order: selectedSection?.blocks.length || 0,
          data: getDefaultBlockData(type),
        }),
      })
      const data = await res.json()
      if (data.block) {
        setSections(sections.map(s => 
          s.id === selectedSectionId 
            ? { ...s, blocks: [...s.blocks, data.block] }
            : s
        ))
      }
      setShowBlockPicker(false)
    } catch (error) {
      console.error('Failed to add block:', error)
    }
  }

  const handleDeleteBlock = async (blockId: string) => {
    if (!selectedSectionId) return

    try {
      await fetch(`/api/projects/${projectId}/versions/${versionId}/sections/${selectedSectionId}/blocks/${blockId}`, {
        method: 'DELETE',
      })
      setSections(sections.map(s => 
        s.id === selectedSectionId 
          ? { ...s, blocks: s.blocks.filter(b => b.id !== blockId) }
          : s
      ))
    } catch (error) {
      console.error('Failed to delete block:', error)
    }
  }

  const getDefaultBlockData = (type: string): Record<string, unknown> => {
    switch (type) {
      case 'text':
        return { content: '', style: 'paragraph' }
      case 'image':
        return { url: '', caption: '', fullWidth: false }
      case 'comparison':
        return { 
          layout: 'side-by-side', 
          title: '',
          before: { image: '', label: 'Before' },
          after: { image: '', label: 'After' },
          description: ''
        }
      case 'change-item':
        return { 
          icon: '', 
          title: '', 
          subtitle: '',
          changes: []
        }
      case 'stat-change':
        return { stats: [] }
      case 'divider':
        return {}
      case 'spotlight':
        return { image: '', title: '', description: '', ctaText: '', ctaUrl: '' }
      default:
        return {}
    }
  }

  const selectedSection = sections.find(s => s.id === selectedSectionId)

  const BLOCK_TYPES = [
    { type: 'text', label: 'Text', description: 'Rich text content' },
    { type: 'image', label: 'Image', description: 'Single image with caption' },
    { type: 'comparison', label: 'Comparison', description: 'Before/after comparison' },
    { type: 'change-item', label: 'Change Item', description: 'Item/character changes' },
    { type: 'stat-change', label: 'Stat Change', description: 'Stat comparison table' },
    { type: 'divider', label: 'Divider', description: 'Visual separator' },
    { type: 'spotlight', label: 'Spotlight', description: 'Feature highlight' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!version) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Version not found</p>
        <Link href={`/dashboard/projects/${projectId}/updates`} className="text-primary hover:underline mt-2 inline-block">
          Back to Versions
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/projects/${projectId}/updates`}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="text-sm text-slate-500">Version Editor</div>
            <div className="font-semibold text-slate-800">
              {version.version} - {version.title}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl gap-2">
            <Eye size={16} />
            Preview
          </Button>
          <Button className="rounded-xl">
            Save Changes
          </Button>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sections Sidebar */}
        <div className="w-64 border-r bg-slate-50 flex flex-col">
          <div className="p-3 border-b bg-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Sections</span>
              <button
                onClick={handleAddSection}
                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title="Add Section"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sections.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-sm text-slate-500 mb-3">No sections yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSection}
                  className="rounded-xl"
                >
                  <Plus size={14} className="mr-1" />
                  Add Section
                </Button>
              </div>
            ) : (
              sections.map((section) => (
                <div
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id)}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedSectionId === section.id
                      ? 'bg-primary text-white'
                      : 'hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <GripVertical size={14} className="opacity-50" />
                  <span className="flex-1 text-sm truncate">
                    {section.title || 'Untitled Section'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSection(section.id)
                    }}
                    className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                      selectedSectionId === section.id
                        ? 'hover:bg-white/20'
                        : 'hover:bg-red-100 hover:text-red-600'
                    }`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 bg-slate-100 overflow-y-auto p-6">
          {selectedSection ? (
            <div className="max-w-4xl mx-auto">
              {/* Section Header */}
              <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
                <input
                  type="text"
                  value={selectedSection.title || ''}
                  onChange={(e) => {
                    setSections(sections.map(s => 
                      s.id === selectedSection.id 
                        ? { ...s, title: e.target.value }
                        : s
                    ))
                  }}
                  placeholder="Section Title"
                  className="w-full text-lg font-semibold text-slate-800 border-none focus:outline-none focus:ring-0 bg-transparent"
                />
              </div>

              {/* Blocks Area */}
              <div className="bg-white rounded-xl shadow-sm border p-6 min-h-[300px]">
                {selectedSection.blocks.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 mb-4">No blocks in this section</p>
                    <Button variant="outline" className="rounded-xl" onClick={() => setShowBlockPicker(true)}>
                      <Plus size={16} className="mr-2" />
                      Add Block
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedSection.blocks.map((block) => (
                      <div
                        key={block.id}
                        className="group p-4 border rounded-lg bg-slate-50 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical size={14} className="text-slate-400" />
                            <span className="text-sm font-medium text-slate-700 capitalize">
                              {block.type.replace('-', ' ')} Block
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {JSON.stringify(block.data).substring(0, 50)}...
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl border-dashed"
                      onClick={() => setShowBlockPicker(true)}
                    >
                      <Plus size={16} className="mr-2" />
                      Add Block
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-slate-500 mb-4">Select a section to edit or create one</p>
                <Button onClick={handleAddSection} className="rounded-xl">
                  <Plus size={16} className="mr-2" />
                  Add First Section
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Block Picker Modal */}
        {showBlockPicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0d0d15] rounded-2xl w-full max-w-lg shadow-2xl border border-[#2a2a3e]">
              <div className="flex items-center justify-between p-4 border-b border-[#2a2a3e]">
                <h3 className="text-lg font-semibold text-white">Add Block</h3>
                <button
                  onClick={() => setShowBlockPicker(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-[#2a2a3e] rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {BLOCK_TYPES.map((blockType) => (
                  <button
                    key={blockType.type}
                    onClick={() => handleAddBlock(blockType.type)}
                    className="p-4 text-left border border-[#2a2a3e] rounded-xl hover:border-purple-500 hover:bg-purple-500/10 transition-colors bg-[#1a1a2e]"
                  >
                    <div className="font-medium text-white">{blockType.label}</div>
                    <div className="text-xs text-slate-400 mt-1">{blockType.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Properties Panel */}
        <div className="w-72 border-l border-[#2a2a3e] bg-[#0d0d15] flex flex-col">
          <div className="p-3 border-b border-[#2a2a3e]">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Settings size={16} />
              Properties
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedSection ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Layout
                  </label>
                  <select
                    value={selectedSection.layout}
                    onChange={(e) => {
                      setSections(sections.map(s => 
                        s.id === selectedSection.id 
                          ? { ...s, layout: e.target.value }
                          : s
                      ))
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="single">Single Column</option>
                    <option value="two-col">Two Columns</option>
                    <option value="three-col">Three Columns</option>
                    <option value="cards">Cards</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={selectedSection.backgroundColor || '#ffffff'}
                    onChange={(e) => {
                      setSections(sections.map(s => 
                        s.id === selectedSection.id 
                          ? { ...s, backgroundColor: e.target.value }
                          : s
                      ))
                    }}
                    className="w-full h-10 rounded-lg border cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Accent Color
                  </label>
                  <input
                    type="color"
                    value={selectedSection.accentColor || '#8b5cf6'}
                    onChange={(e) => {
                      setSections(sections.map(s => 
                        s.id === selectedSection.id 
                          ? { ...s, accentColor: e.target.value }
                          : s
                      ))
                    }}
                    className="w-full h-10 rounded-lg border cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Select a section to edit its properties
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
