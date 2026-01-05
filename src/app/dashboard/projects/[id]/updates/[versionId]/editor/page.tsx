'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Eye,
  Save,
  Undo,
  Redo,
  Plus,
  GripVertical,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Type,
  Image as ImageIcon,
  Video,
  Layout,
  Columns,
  Square,
  Minus,
  Sparkles,
  GitCompare,
  BarChart3,
  FileText,
  X,
  Settings,
  Palette,
  Move
} from 'lucide-react'
import Link from 'next/link'

// Types
interface Version {
  id: string
  version: string
  title: string
  description: string | null
}

interface PageContent {
  rows: Row[]
}

interface Row {
  id: string
  type: 'section' | 'row'
  settings: RowSettings
  columns: Column[]
}

interface RowSettings {
  backgroundColor?: string
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  maxWidth?: 'full' | 'xl' | '2xl' | '4xl' | '6xl'
}

interface Column {
  id: string
  width: string
  elements: Element[]
}

interface Element {
  id: string
  type: string
  data: Record<string, unknown>
  style?: Record<string, unknown>
}

// Element type definitions
const ELEMENT_CATEGORIES = [
  {
    id: 'layout',
    label: 'Layout',
    icon: Layout,
    elements: [
      { type: 'section', label: 'Section', icon: Square, description: 'Full-width container' },
      { type: 'row-1', label: '1 Column', icon: Square, description: 'Single column row' },
      { type: 'row-2', label: '2 Columns', icon: Columns, description: 'Two column layout' },
      { type: 'row-3', label: '3 Columns', icon: Columns, description: 'Three column layout' },
    ]
  },
  {
    id: 'text',
    label: 'Text',
    icon: Type,
    elements: [
      { type: 'heading', label: 'Heading', icon: Type, description: 'H1, H2, H3 headings' },
      { type: 'paragraph', label: 'Paragraph', icon: FileText, description: 'Body text' },
      { type: 'list', label: 'Bullet List', icon: FileText, description: 'Bulleted list' },
    ]
  },
  {
    id: 'media',
    label: 'Media',
    icon: ImageIcon,
    elements: [
      { type: 'image', label: 'Image', icon: ImageIcon, description: 'Single image' },
      { type: 'video', label: 'Video', icon: Video, description: 'YouTube, Vimeo, or upload' },
    ]
  },
  {
    id: 'game',
    label: 'Game Update',
    icon: Sparkles,
    elements: [
      { type: 'section-header', label: 'Section Header', icon: Minus, description: 'Colored bar with title' },
      { type: 'change-card', label: 'Change Card', icon: FileText, description: 'Hero/Item with changes' },
      { type: 'comparison', label: 'Comparison', icon: GitCompare, description: 'Before/After view' },
      { type: 'stat-table', label: 'Stat Table', icon: BarChart3, description: 'Old vs New stats' },
    ]
  },
  {
    id: 'other',
    label: 'Other',
    icon: Plus,
    elements: [
      { type: 'divider', label: 'Divider', icon: Minus, description: 'Visual separator' },
      { type: 'spacer', label: 'Spacer', icon: Square, description: 'Empty space' },
    ]
  }
]

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 11)

// Default element data
const getDefaultElementData = (type: string): Record<string, unknown> => {
  switch (type) {
    case 'heading':
      return { text: 'Heading', level: 'h2' }
    case 'paragraph':
      return { text: 'Enter your text here...' }
    case 'list':
      return { items: ['Item 1', 'Item 2', 'Item 3'] }
    case 'image':
      return { src: '', alt: '', caption: '' }
    case 'video':
      return { src: '', type: 'youtube' }
    case 'section-header':
      return { text: 'SECTION TITLE', color: '#c23a2b' }
    case 'change-card':
      return { 
        icon: '', 
        title: 'Item Name', 
        subtitle: '',
        changes: [{ type: 'buff', text: 'Change description' }]
      }
    case 'comparison':
      return { 
        layout: 'side-by-side',
        title: '',
        before: { image: '', label: 'Before', version: '' },
        after: { image: '', label: 'After', version: '' },
        description: ''
      }
    case 'stat-table':
      return { 
        stats: [
          { name: 'Stat Name', old: '100', new: '120', change: 'buff' }
        ]
      }
    case 'divider':
      return { style: 'solid', color: '#333' }
    case 'spacer':
      return { height: 40 }
    default:
      return {}
  }
}

export default function VersionEditorPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const versionId = params.versionId as string

  // State
  const [version, setVersion] = useState<Version | null>(null)
  const [content, setContent] = useState<PageContent>({ rows: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['layout', 'text', 'game'])
  const [showElementPicker, setShowElementPicker] = useState(false)
  const [insertPosition, setInsertPosition] = useState<{ rowIndex: number; colIndex: number } | null>(null)

  // Fetch version and page data
  useEffect(() => {
    fetchData()
  }, [projectId, versionId])

  const fetchData = async () => {
    try {
      // Fetch version info
      const versionRes = await fetch(`/api/projects/${projectId}/versions/${versionId}`)
      const versionData = await versionRes.json()
      if (versionData.version) {
        setVersion(versionData.version)
      }

      // Fetch page content
      const pageRes = await fetch(`/api/projects/${projectId}/versions/${versionId}/page`)
      const pageData = await pageRes.json()
      if (pageData.page?.content) {
        setContent(pageData.page.content)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-save with debounce
  const saveContent = useCallback(async () => {
    setSaving(true)
    try {
      await fetch(`/api/projects/${projectId}/versions/${versionId}/page`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }, [content, projectId, versionId])

  // Add a row
  const addRow = (columns: number = 1) => {
    const columnWidth = `${100 / columns}%`
    const newRow: Row = {
      id: generateId(),
      type: 'row',
      settings: {
        backgroundColor: 'transparent',
        padding: 'md',
        maxWidth: '6xl',
      },
      columns: Array.from({ length: columns }, () => ({
        id: generateId(),
        width: columnWidth,
        elements: [],
      })),
    }
    setContent({ ...content, rows: [...content.rows, newRow] })
  }

  // Add element to a column
  const addElement = (type: string, rowIndex: number, colIndex: number) => {
    const newElement: Element = {
      id: generateId(),
      type,
      data: getDefaultElementData(type),
      style: {},
    }
    
    const newRows = [...content.rows]
    newRows[rowIndex].columns[colIndex].elements.push(newElement)
    setContent({ ...content, rows: newRows })
    setSelectedElementId(newElement.id)
    setShowElementPicker(false)
    setInsertPosition(null)
  }

  // Delete element
  const deleteElement = (elementId: string) => {
    const newRows = content.rows.map(row => ({
      ...row,
      columns: row.columns.map(col => ({
        ...col,
        elements: col.elements.filter(el => el.id !== elementId),
      })),
    }))
    setContent({ ...content, rows: newRows })
    setSelectedElementId(null)
  }

  // Delete row
  const deleteRow = (rowIndex: number) => {
    const newRows = content.rows.filter((_, i) => i !== rowIndex)
    setContent({ ...content, rows: newRows })
  }

  // Find selected element
  const findSelectedElement = (): Element | null => {
    for (const row of content.rows) {
      for (const col of row.columns) {
        const element = col.elements.find(el => el.id === selectedElementId)
        if (element) return element
      }
    }
    return null
  }

  // Update element data
  const updateElementData = (elementId: string, data: Record<string, unknown>) => {
    const newRows = content.rows.map(row => ({
      ...row,
      columns: row.columns.map(col => ({
        ...col,
        elements: col.elements.map(el => 
          el.id === elementId ? { ...el, data: { ...el.data, ...data } } : el
        ),
      })),
    }))
    setContent({ ...content, rows: newRows })
  }

  // Toggle category
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const selectedElement = findSelectedElement()

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0d0d15] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0d0d15] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 bg-[#1a1a2e] border-b border-[#2a2a3e] flex items-center justify-between px-4">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/projects/${projectId}/updates`}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Back</span>
          </Link>
          <div className="h-6 w-px bg-[#2a2a3e]" />
          <div>
            <div className="text-white font-medium">
              {version?.version} - {version?.title}
            </div>
            <div className="text-xs text-slate-500">
              {saving ? 'Saving...' : lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : 'Not saved yet'}
            </div>
          </div>
        </div>

        {/* Center: Device Preview */}
        <div className="flex items-center gap-1 bg-[#0d0d15] rounded-lg p-1">
          <button
            onClick={() => setDevicePreview('desktop')}
            className={`p-2 rounded-md transition-colors ${
              devicePreview === 'desktop' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor size={18} />
          </button>
          <button
            onClick={() => setDevicePreview('tablet')}
            className={`p-2 rounded-md transition-colors ${
              devicePreview === 'tablet' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tablet size={18} />
          </button>
          <button
            onClick={() => setDevicePreview('mobile')}
            className={`p-2 rounded-md transition-colors ${
              devicePreview === 'mobile' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone size={18} />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors">
            <Eye size={18} />
            <span className="text-sm">Preview</span>
          </button>
          <button
            onClick={saveContent}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            <span className="text-sm">Save</span>
          </button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Elements */}
        <div className="w-64 bg-[#1a1a2e] border-r border-[#2a2a3e] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#2a2a3e]">
            <div className="text-sm font-medium text-white">Elements</div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {ELEMENT_CATEGORIES.map((category) => (
              <div key={category.id} className="mb-1">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-[#2a2a3e] rounded-lg transition-colors"
                >
                  {expandedCategories.includes(category.id) ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                  <category.icon size={16} />
                  <span className="text-sm">{category.label}</span>
                </button>
                {expandedCategories.includes(category.id) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {category.elements.map((element) => (
                      <button
                        key={element.type}
                        onClick={() => {
                          if (content.rows.length === 0) {
                            // Add a row first, then add element
                            addRow(1)
                            setTimeout(() => {
                              addElement(element.type, 0, 0)
                            }, 0)
                          } else {
                            setShowElementPicker(true)
                            // For now, add to last row, first column
                            addElement(element.type, content.rows.length - 1, 0)
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-[#2a2a3e] rounded-lg transition-colors text-left"
                      >
                        <element.icon size={14} />
                        <div>
                          <div className="text-sm">{element.label}</div>
                          <div className="text-xs text-slate-500">{element.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 bg-[#0d0d15] overflow-y-auto p-6">
          <div 
            className={`mx-auto bg-[#1a1a2e] min-h-full rounded-lg shadow-2xl transition-all ${
              devicePreview === 'desktop' ? 'max-w-full' :
              devicePreview === 'tablet' ? 'max-w-2xl' :
              'max-w-sm'
            }`}
          >
            {content.rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-[#2a2a3e] flex items-center justify-center mb-4">
                  <Plus size={24} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Start Building</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-xs">
                  Click an element from the left sidebar to add it to your page
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => addRow(1)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Add 1 Column
                  </button>
                  <button
                    onClick={() => addRow(2)}
                    className="px-4 py-2 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white rounded-lg text-sm transition-colors"
                  >
                    Add 2 Columns
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {content.rows.map((row, rowIndex) => (
                  <div
                    key={row.id}
                    className="group relative border border-transparent hover:border-purple-500/50 rounded-lg transition-colors"
                  >
                    {/* Row Controls */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <div className="flex items-center gap-1 bg-[#2a2a3e] rounded-lg px-2 py-1">
                        <button className="p-1 text-slate-400 hover:text-white">
                          <GripVertical size={14} />
                        </button>
                        <button className="p-1 text-slate-400 hover:text-white">
                          <Copy size={14} />
                        </button>
                        <button 
                          onClick={() => deleteRow(rowIndex)}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Columns */}
                    <div 
                      className="flex gap-4 p-4"
                      style={{ backgroundColor: row.settings.backgroundColor }}
                    >
                      {row.columns.map((col, colIndex) => (
                        <div
                          key={col.id}
                          className="flex-1 min-h-[100px] border border-dashed border-[#3a3a4e] rounded-lg p-2"
                          style={{ width: col.width }}
                        >
                          {col.elements.length === 0 ? (
                            <button
                              onClick={() => {
                                setInsertPosition({ rowIndex, colIndex })
                                setShowElementPicker(true)
                              }}
                              className="w-full h-full min-h-[80px] flex flex-col items-center justify-center text-slate-500 hover:text-purple-400 hover:border-purple-400 border border-dashed border-transparent rounded-lg transition-colors"
                            >
                              <Plus size={20} />
                              <span className="text-xs mt-1">Add Element</span>
                            </button>
                          ) : (
                            <div className="space-y-2">
                              {col.elements.map((element) => (
                                <div
                                  key={element.id}
                                  onClick={() => setSelectedElementId(element.id)}
                                  className={`relative p-3 rounded-lg cursor-pointer transition-all ${
                                    selectedElementId === element.id
                                      ? 'ring-2 ring-purple-500 bg-purple-500/10'
                                      : 'hover:bg-[#2a2a3e]'
                                  }`}
                                >
                                  {/* Element Renderer */}
                                  <ElementRenderer element={element} />
                                  
                                  {/* Element Controls */}
                                  {selectedElementId === element.id && (
                                    <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-purple-600 rounded-lg px-1 py-0.5">
                                      <button className="p-1 text-white/80 hover:text-white">
                                        <Move size={12} />
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          deleteElement(element.id)
                                        }}
                                        className="p-1 text-white/80 hover:text-white"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  setInsertPosition({ rowIndex, colIndex })
                                  setShowElementPicker(true)
                                }}
                                className="w-full py-2 text-slate-500 hover:text-purple-400 text-xs flex items-center justify-center gap-1 border border-dashed border-[#3a3a4e] hover:border-purple-400 rounded-lg transition-colors"
                              >
                                <Plus size={14} />
                                Add Element
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Add Row Button */}
                <div className="flex justify-center gap-2 py-4">
                  <button
                    onClick={() => addRow(1)}
                    className="px-3 py-2 text-slate-400 hover:text-white text-sm border border-dashed border-[#3a3a4e] hover:border-purple-400 rounded-lg transition-colors"
                  >
                    + 1 Column
                  </button>
                  <button
                    onClick={() => addRow(2)}
                    className="px-3 py-2 text-slate-400 hover:text-white text-sm border border-dashed border-[#3a3a4e] hover:border-purple-400 rounded-lg transition-colors"
                  >
                    + 2 Columns
                  </button>
                  <button
                    onClick={() => addRow(3)}
                    className="px-3 py-2 text-slate-400 hover:text-white text-sm border border-dashed border-[#3a3a4e] hover:border-purple-400 rounded-lg transition-colors"
                  >
                    + 3 Columns
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-72 bg-[#1a1a2e] border-l border-[#2a2a3e] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#2a2a3e] flex items-center gap-2">
            <Settings size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-white">Properties</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedElement ? (
              <ElementProperties 
                element={selectedElement} 
                onUpdate={(data) => updateElementData(selectedElement.id, data)}
              />
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-[#2a2a3e] flex items-center justify-center mx-auto mb-3">
                  <Palette size={20} className="text-slate-400" />
                </div>
                <p className="text-sm text-slate-400">
                  Select an element to edit its properties
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Element Picker Modal */}
      {showElementPicker && insertPosition && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-2xl w-full max-w-2xl shadow-2xl border border-[#2a2a3e]">
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a3e]">
              <h3 className="text-lg font-semibold text-white">Add Element</h3>
              <button
                onClick={() => {
                  setShowElementPicker(false)
                  setInsertPosition(null)
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-[#2a2a3e] rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {ELEMENT_CATEGORIES.flatMap(cat => cat.elements).map((element) => (
                <button
                  key={element.type}
                  onClick={() => addElement(element.type, insertPosition.rowIndex, insertPosition.colIndex)}
                  className="p-4 text-left border border-[#2a2a3e] rounded-xl hover:border-purple-500 hover:bg-purple-500/10 transition-colors"
                >
                  <element.icon size={20} className="text-purple-400 mb-2" />
                  <div className="font-medium text-white text-sm">{element.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{element.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Element Renderer Component
function ElementRenderer({ element }: { element: Element }) {
  const { type, data } = element

  switch (type) {
    case 'heading':
      const HeadingTag = (data.level as string) || 'h2'
      return (
        <div className={`font-bold text-white ${
          HeadingTag === 'h1' ? 'text-3xl' :
          HeadingTag === 'h2' ? 'text-2xl' :
          'text-xl'
        }`}>
          {(data.text as string) || 'Heading'}
        </div>
      )

    case 'paragraph':
      return (
        <p className="text-slate-300 text-sm">
          {(data.text as string) || 'Enter your text here...'}
        </p>
      )

    case 'section-header':
      return (
        <div 
          className="py-2 px-4 rounded-lg text-white font-bold uppercase tracking-wider text-sm"
          style={{ backgroundColor: (data.color as string) || '#c23a2b' }}
        >
          {(data.text as string) || 'SECTION TITLE'}
        </div>
      )

    case 'change-card':
      return (
        <div className="bg-[#0d0d15] rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-[#2a2a3e] rounded-lg flex items-center justify-center">
              {data.icon ? (
                <img src={data.icon as string} alt="" className="w-10 h-10" />
              ) : (
                <Square size={24} className="text-slate-500" />
              )}
            </div>
            <div>
              <div className="font-bold text-white">{(data.title as string) || 'Item Name'}</div>
              {typeof data.subtitle === 'string' && data.subtitle && <div className="text-xs text-slate-400">{data.subtitle}</div>}
            </div>
          </div>
          <div className="space-y-1">
            {((data.changes as Array<{type: string; text: string}>) || []).map((change, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={`mt-0.5 ${
                  change.type === 'buff' ? 'text-green-400' :
                  change.type === 'nerf' ? 'text-red-400' :
                  'text-blue-400'
                }`}>
                  {change.type === 'buff' ? '↑' : change.type === 'nerf' ? '↓' : '○'}
                </span>
                <span className="text-slate-300">{change.text}</span>
              </div>
            ))}
          </div>
        </div>
      )

    case 'comparison':
      return (
        <div className="bg-[#0d0d15] rounded-lg p-4">
          <div className="text-center text-white font-medium mb-3">
            {(data.title as string) || 'Comparison'}
          </div>
          <div className={`flex gap-4 ${(data.layout as string) === 'stacked' ? 'flex-col' : ''}`}>
            <div className="flex-1 p-3 bg-[#1a1a2e]/50 rounded-lg opacity-60">
              <div className="text-xs text-slate-400 mb-1">Before</div>
              <div className="h-20 bg-[#2a2a3e] rounded flex items-center justify-center">
                <ImageIcon size={24} className="text-slate-500" />
              </div>
            </div>
            <div className="flex-1 p-3 bg-[#1a1a2e] rounded-lg">
              <div className="text-xs text-slate-400 mb-1">After</div>
              <div className="h-20 bg-[#2a2a3e] rounded flex items-center justify-center">
                <ImageIcon size={24} className="text-slate-500" />
              </div>
            </div>
          </div>
        </div>
      )

    case 'stat-table':
      return (
        <div className="bg-[#0d0d15] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3e]">
                <th className="text-left p-2 text-slate-400 font-medium">Stat</th>
                <th className="text-center p-2 text-slate-400 font-medium">Old</th>
                <th className="text-center p-2 text-slate-400 font-medium">New</th>
              </tr>
            </thead>
            <tbody>
              {((data.stats as Array<{name: string; old: string; new: string; change: string}>) || []).map((stat, i) => (
                <tr key={i} className="border-b border-[#2a2a3e]/50">
                  <td className="p-2 text-white">{stat.name}</td>
                  <td className="p-2 text-center text-slate-400 line-through">{stat.old}</td>
                  <td className={`p-2 text-center font-medium ${
                    stat.change === 'buff' ? 'text-green-400' :
                    stat.change === 'nerf' ? 'text-red-400' :
                    'text-white'
                  }`}>{stat.new}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'divider':
      return (
        <hr 
          className="border-t"
          style={{ borderColor: (data.color as string) || '#333' }}
        />
      )

    case 'spacer':
      return (
        <div style={{ height: (data.height as number) || 40 }} />
      )

    case 'image':
      return (
        <div className="bg-[#2a2a3e] rounded-lg h-32 flex items-center justify-center">
          {data.src ? (
            <img src={data.src as string} alt={data.alt as string} className="max-h-full rounded-lg" />
          ) : (
            <div className="text-center text-slate-500">
              <ImageIcon size={32} className="mx-auto mb-2" />
              <span className="text-xs">Click to add image</span>
            </div>
          )}
        </div>
      )

    case 'list':
      return (
        <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
          {((data.items as string[]) || ['Item 1', 'Item 2']).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )

    default:
      return (
        <div className="p-3 bg-[#2a2a3e] rounded-lg text-slate-400 text-sm">
          {type} element
        </div>
      )
  }
}

// Element Properties Component
function ElementProperties({ 
  element, 
  onUpdate 
}: { 
  element: Element
  onUpdate: (data: Record<string, unknown>) => void 
}) {
  const { type, data } = element

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500 uppercase tracking-wider">
        {type.replace('-', ' ')} Settings
      </div>

      {type === 'heading' && (
        <>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Text</label>
            <input
              type="text"
              value={(data.text as string) || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Level</label>
            <select
              value={(data.level as string) || 'h2'}
              onChange={(e) => onUpdate({ level: e.target.value })}
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </select>
          </div>
        </>
      )}

      {type === 'paragraph' && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">Text</label>
          <textarea
            value={(data.text as string) || ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>
      )}

      {type === 'section-header' && (
        <>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Title</label>
            <input
              type="text"
              value={(data.text as string) || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Color</label>
            <input
              type="color"
              value={(data.color as string) || '#c23a2b'}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-full h-10 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg cursor-pointer"
            />
          </div>
        </>
      )}

      {type === 'change-card' && (
        <>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Title</label>
            <input
              type="text"
              value={(data.title as string) || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Subtitle</label>
            <input
              type="text"
              value={(data.subtitle as string) || ''}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        </>
      )}

      {type === 'comparison' && (
        <>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Title</label>
            <input
              type="text"
              value={(data.title as string) || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Layout</label>
            <select
              value={(data.layout as string) || 'side-by-side'}
              onChange={(e) => onUpdate({ layout: e.target.value })}
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="side-by-side">Side by Side</option>
              <option value="stacked">Stacked</option>
              <option value="slider">Slider</option>
            </select>
          </div>
        </>
      )}

      {type === 'image' && (
        <>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Image URL</label>
            <input
              type="text"
              value={(data.src as string) || ''}
              onChange={(e) => onUpdate({ src: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Alt Text</label>
            <input
              type="text"
              value={(data.alt as string) || ''}
              onChange={(e) => onUpdate({ alt: e.target.value })}
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        </>
      )}

      {type === 'spacer' && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">Height (px)</label>
          <input
            type="number"
            value={(data.height as number) || 40}
            onChange={(e) => onUpdate({ height: parseInt(e.target.value) })}
            className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
      )}
    </div>
  )
}
