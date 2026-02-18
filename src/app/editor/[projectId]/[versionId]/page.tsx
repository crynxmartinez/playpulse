'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Eye,
  Save,
  Plus,
  GripVertical,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Type,
  Image as ImageIcon,
  Video,
  Square,
  Minus,
  Sparkles,
  GitCompare,
  FileText,
  X,
  Settings,
  Palette,
  Move,
  Share2,
  Check,
  Undo2,
  Redo2
} from 'lucide-react'
import Link from 'next/link'

// Types
interface Version {
  id: string
  slug?: string | null
  version: string
  title: string
  description: string | null
  project?: {
    slug?: string | null
  }
}

interface ChangeCardData {
  id: string
  title: string
  subtitle: string
  icon: string
  changes: Array<{ type: string; text: string }>
}

interface VersionWithCards {
  id: string
  version: string
  title: string
  cards: ChangeCardData[]
}

interface PageSettings {
  backgroundColor?: string
  backgroundOpacity?: number
  backgroundImage?: string
  contentBackgroundColor?: string
  contentBackgroundOpacity?: number
  contentBackgroundImage?: string
}

interface PageContent {
  rows: Row[]
  settings?: PageSettings
}

interface Row {
  id: string
  type: 'section' | 'row'
  settings: RowSettings
  columns: Column[]
}

interface RowSettings {
  backgroundColor?: string
  backgroundOpacity?: number
  backgroundImage?: string
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

// Element type definitions (Layout items removed - they are row types, not elements)
const ELEMENT_CATEGORIES = [
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
      { type: 'card-reference', label: 'Card Reference', icon: FileText, description: 'Load card from previous version' },
      { type: 'comparison', label: 'Comparison', icon: GitCompare, description: 'Before/After view' },
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
      return { text: 'Heading', level: 'h2', align: 'left', fontSize: '24', fontFamily: 'inherit' }
    case 'paragraph':
      return { text: 'Enter your text here...', align: 'left', fontSize: '14', fontFamily: 'inherit' }
    case 'list':
      return { items: ['Item 1', 'Item 2', 'Item 3'], bulletStyle: 'disc', align: 'left', indent: 0, fontSize: '14', fontFamily: 'inherit' }
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
        title: 'Comparison',
        overlay: 'darken',
        before: { title: '', subtitle: '', icon: '', changes: [] },
        after: { title: '', subtitle: '', icon: '', changes: [] }
      }
    case 'card-reference':
      return {
        sourceVersionId: '',
        sourceCardId: '',
        title: '',
        subtitle: '',
        icon: '',
        changes: [],
        overlay: 'none'
      }
    case 'divider':
      return { style: 'solid', color: '#333', spacing: 5 }
    case 'spacer':
      return { height: 20 }
    default:
      return {}
  }
}

export default function VersionEditorPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
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
  const [activeColumn, setActiveColumn] = useState<{ rowIndex: number; colIndex: number } | null>(null)
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)
  const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'row' | 'page'>('properties')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [versionsWithCards, setVersionsWithCards] = useState<VersionWithCards[]>([])
  
  // Undo/Redo history (max 10 states)
  const [history, setHistory] = useState<PageContent[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const MAX_HISTORY = 10

  // Copy share link
  const copyShareLink = () => {
    // Use slug-based URL if available
    const gameSlug = version?.project?.slug || projectId
    const versionSlug = version?.slug || versionId
    const url = `${window.location.origin}/updates/${gameSlug}/${versionSlug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Update content with history tracking
  const updateContentWithHistory = useCallback((newContent: PageContent) => {
    // Add current state to history before updating
    setHistory(prev => {
      const newHistory = [...prev.slice(0, historyIndex + 1), content]
      // Keep only last MAX_HISTORY states
      if (newHistory.length > MAX_HISTORY) {
        return newHistory.slice(-MAX_HISTORY)
      }
      return newHistory
    })
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1))
    setContent(newContent)
  }, [content, historyIndex, MAX_HISTORY])

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex >= 0 && history.length > 0) {
      const previousState = history[historyIndex]
      setContent(previousState)
      setHistoryIndex(prev => prev - 1)
    }
  }, [history, historyIndex])

  // Redo function  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      if (nextState) {
        setContent(nextState)
        setHistoryIndex(prev => prev + 1)
      }
    }
  }, [history, historyIndex])

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

      // Fetch all versions with their change cards (for comparison element)
      const cardsRes = await fetch(`/api/projects/${projectId}/versions/cards`)
      const cardsData = await cardsRes.json()
      if (cardsData.versions) {
        setVersionsWithCards(cardsData.versions)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Extract cards from Comparison.after and Card Reference elements and create change-cards
  const extractAndCreateCards = (pageContent: PageContent): PageContent => {
    const newContent = JSON.parse(JSON.stringify(pageContent)) as PageContent
    const cardsToAdd: Element[] = []
    const processedCardIds = new Set<string>()
    
    // Collect existing change-card IDs to avoid duplicates
    newContent.rows.forEach(row => {
      row.columns.forEach(col => {
        col.elements.forEach(el => {
          if (el.type === 'change-card') {
            // Use title as identifier since cards might be loaded multiple times
            const cardKey = `${el.data.title}-${el.data.subtitle || ''}`
            processedCardIds.add(cardKey)
          }
        })
      })
    })
    
    // Find Comparison and Card Reference elements
    newContent.rows.forEach(row => {
      row.columns.forEach(col => {
        col.elements.forEach(el => {
          if (el.type === 'comparison') {
            const afterData = el.data.after as { title?: string; subtitle?: string; icon?: string; changes?: Array<{type: string; text: string}> }
            if (afterData?.title) {
              const cardKey = `${afterData.title}-${afterData.subtitle || ''}`
              if (!processedCardIds.has(cardKey)) {
                processedCardIds.add(cardKey)
                cardsToAdd.push({
                  id: generateId(),
                  type: 'change-card',
                  data: {
                    icon: afterData.icon || '',
                    title: afterData.title,
                    subtitle: afterData.subtitle || '',
                    changes: afterData.changes || []
                  }
                })
              }
            }
          }
          if (el.type === 'card-reference') {
            const title = el.data.title as string
            if (title) {
              const cardKey = `${title}-${el.data.subtitle || ''}`
              if (!processedCardIds.has(cardKey)) {
                processedCardIds.add(cardKey)
                cardsToAdd.push({
                  id: generateId(),
                  type: 'change-card',
                  data: {
                    icon: el.data.icon || '',
                    title: title,
                    subtitle: (el.data.subtitle as string) || '',
                    changes: (el.data.changes as Array<{type: string; text: string}>) || []
                  }
                })
              }
            }
          }
        })
      })
    })
    
    // Add new cards to the first row's first column (or create a new row)
    if (cardsToAdd.length > 0) {
      if (newContent.rows.length > 0 && newContent.rows[0].columns.length > 0) {
        // Add to end of first column
        newContent.rows[0].columns[0].elements.push(...cardsToAdd)
      } else {
        // Create a new row with the cards
        newContent.rows.push({
          id: generateId(),
          type: 'row',
          settings: { backgroundColor: 'transparent', padding: 'md', maxWidth: '6xl' },
          columns: [{
            id: generateId(),
            width: '100%',
            elements: cardsToAdd
          }]
        })
      }
    }
    
    return newContent
  }

  // Save content
  const saveContent = useCallback(async () => {
    setSaving(true)
    try {
      // Extract cards from Comparison.after and Card Reference, add as change-cards
      const contentWithCards = extractAndCreateCards(content)
      
      await fetch(`/api/projects/${projectId}/versions/${versionId}/page`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentWithCards }),
      })
      
      // Update local content with the new cards
      setContent(contentWithCards)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }, [content, projectId, versionId])

  // Keyboard shortcuts for undo/redo/save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveContent()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, saveContent])

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
    updateContentWithHistory({ ...content, rows: [...content.rows, newRow] })
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
    updateContentWithHistory({ ...content, rows: newRows })
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
    updateContentWithHistory({ ...content, rows: newRows })
    setSelectedElementId(null)
  }

  // Delete row
  const deleteRow = (rowIndex: number) => {
    const newRows = content.rows.filter((_, i) => i !== rowIndex)
    updateContentWithHistory({ ...content, rows: newRows })
  }

  // Duplicate row
  const duplicateRow = (rowIndex: number) => {
    const rowToDuplicate = content.rows[rowIndex]
    const duplicatedRow: Row = {
      ...rowToDuplicate,
      id: `row-${Date.now()}`,
      columns: rowToDuplicate.columns.map(col => ({
        ...col,
        id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        elements: col.elements.map(el => ({
          ...el,
          id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }))
      }))
    }
    const newRows = [...content.rows]
    newRows.splice(rowIndex + 1, 0, duplicatedRow)
    updateContentWithHistory({ ...content, rows: newRows })
  }

  // Duplicate column (adds a copy of the column to the same row)
  const duplicateColumn = (rowIndex: number, colIndex: number) => {
    const colToDuplicate = content.rows[rowIndex].columns[colIndex]
    const duplicatedCol: Column = {
      ...colToDuplicate,
      id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      elements: colToDuplicate.elements.map(el => ({
        ...el,
        id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }))
    }
    const newRows = [...content.rows]
    newRows[rowIndex].columns.splice(colIndex + 1, 0, duplicatedCol)
    // Recalculate widths
    const colCount = newRows[rowIndex].columns.length
    newRows[rowIndex].columns = newRows[rowIndex].columns.map(col => ({
      ...col,
      width: `${100 / colCount}%`
    }))
    updateContentWithHistory({ ...content, rows: newRows })
  }

  // Delete column
  const deleteColumn = (rowIndex: number, colIndex: number) => {
    const newRows = [...content.rows]
    const row = newRows[rowIndex]
    
    // If only 1 column, delete the entire row
    if (row.columns.length <= 1) {
      newRows.splice(rowIndex, 1)
    } else {
      // Remove the column
      row.columns.splice(colIndex, 1)
      // Recalculate widths
      const colCount = row.columns.length
      row.columns = row.columns.map(col => ({
        ...col,
        width: `${100 / colCount}%`
      }))
    }
    
    updateContentWithHistory({ ...content, rows: newRows })
    setActiveColumn(null)
  }

  // Move column to another row
  const moveColumnToRow = (fromRowIndex: number, fromColIndex: number, toRowIndex: number) => {
    if (fromRowIndex === toRowIndex) return
    const newRows = [...content.rows]
    const [movedCol] = newRows[fromRowIndex].columns.splice(fromColIndex, 1)
    
    // If source row is now empty, remove it
    if (newRows[fromRowIndex].columns.length === 0) {
      newRows.splice(fromRowIndex, 1)
      // Adjust toRowIndex if needed
      if (toRowIndex > fromRowIndex) toRowIndex--
    } else {
      // Recalculate source row widths
      const srcColCount = newRows[fromRowIndex].columns.length
      newRows[fromRowIndex].columns = newRows[fromRowIndex].columns.map(col => ({
        ...col,
        width: `${100 / srcColCount}%`
      }))
    }
    
    // Add to target row
    newRows[toRowIndex].columns.push(movedCol)
    // Recalculate target row widths
    const tgtColCount = newRows[toRowIndex].columns.length
    newRows[toRowIndex].columns = newRows[toRowIndex].columns.map(col => ({
      ...col,
      width: `${100 / tgtColCount}%`
    }))
    
    updateContentWithHistory({ ...content, rows: newRows })
  }

  // Update row settings
  const updateRowSettings = (rowIndex: number, settings: Partial<RowSettings>) => {
    const newRows = [...content.rows]
    newRows[rowIndex] = {
      ...newRows[rowIndex],
      settings: { ...newRows[rowIndex].settings, ...settings }
    }
    updateContentWithHistory({ ...content, rows: newRows })
  }

  // Update page settings
  const updatePageSettings = (settings: Partial<PageSettings>) => {
    updateContentWithHistory({ 
      ...content, 
      settings: { ...content.settings, ...settings } 
    })
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
    updateContentWithHistory({ ...content, rows: newRows })
  }

  // Toggle category
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // Drag and drop for rows
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null)
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null)

  const handleRowDragStart = (e: React.DragEvent, rowIndex: number) => {
    setDraggedRowIndex(rowIndex)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', `row-${rowIndex}`)
  }

  const handleRowDragOver = (e: React.DragEvent, rowIndex: number) => {
    e.preventDefault()
    if (draggedRowIndex !== null && draggedRowIndex !== rowIndex) {
      setDragOverRowIndex(rowIndex)
    }
  }

  const handleRowDragLeave = () => {
    setDragOverRowIndex(null)
  }

  const handleRowDrop = (e: React.DragEvent, targetRowIndex: number) => {
    e.preventDefault()
    if (draggedRowIndex !== null && draggedRowIndex !== targetRowIndex) {
      const newRows = [...content.rows]
      const [draggedRow] = newRows.splice(draggedRowIndex, 1)
      newRows.splice(targetRowIndex, 0, draggedRow)
      setContent({ ...content, rows: newRows })
    }
    setDraggedRowIndex(null)
    setDragOverRowIndex(null)
  }

  const handleRowDragEnd = () => {
    setDraggedRowIndex(null)
    setDragOverRowIndex(null)
  }

  // Drag and drop for elements
  const [draggedElement, setDraggedElement] = useState<{ rowIndex: number; colIndex: number; elementIndex: number } | null>(null)
  const [dragOverElement, setDragOverElement] = useState<{ rowIndex: number; colIndex: number; elementIndex: number } | null>(null)

  const handleElementDragStart = (e: React.DragEvent, rowIndex: number, colIndex: number, elementIndex: number) => {
    e.stopPropagation()
    setDraggedElement({ rowIndex, colIndex, elementIndex })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', `element-${rowIndex}-${colIndex}-${elementIndex}`)
  }

  const handleElementDragOver = (e: React.DragEvent, rowIndex: number, colIndex: number, elementIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedElement !== null) {
      setDragOverElement({ rowIndex, colIndex, elementIndex })
    }
  }

  const handleElementDragLeave = (e: React.DragEvent) => {
    e.stopPropagation()
    setDragOverElement(null)
  }

  const handleElementDrop = (e: React.DragEvent, targetRowIndex: number, targetColIndex: number, targetElementIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (draggedElement !== null) {
      const { rowIndex: srcRowIndex, colIndex: srcColIndex, elementIndex: srcElementIndex } = draggedElement
      
      // Get the element being dragged
      const newRows = [...content.rows]
      const srcCol = newRows[srcRowIndex].columns[srcColIndex]
      const [movedElement] = srcCol.elements.splice(srcElementIndex, 1)
      
      // Insert at target position
      const targetCol = newRows[targetRowIndex].columns[targetColIndex]
      targetCol.elements.splice(targetElementIndex, 0, movedElement)
      
      setContent({ ...content, rows: newRows })
    }
    
    setDraggedElement(null)
    setDragOverElement(null)
  }

  const handleElementDragEnd = () => {
    setDraggedElement(null)
    setDragOverElement(null)
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
    <div className="fixed inset-0 bg-[#0d0d15] flex flex-col overflow-hidden z-[9999]">
      {/* Top Bar */}
      <div className="h-14 bg-[#1a1a2e] border-b border-[#2a2a3e] flex items-center justify-between px-4 shrink-0">
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
          {/* Undo/Redo buttons */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={undo}
              disabled={historyIndex < 0}
              title="Undo (Ctrl+Z)"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#2a2a3e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Undo2 size={18} />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Shift+Z)"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#2a2a3e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Redo2 size={18} />
            </button>
          </div>
          <button 
            onClick={copyShareLink}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              copied ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
            <span className="text-sm">{copied ? 'Copied!' : 'Share'}</span>
          </button>
          <button 
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isPreviewMode ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye size={18} />
            <span className="text-sm">{isPreviewMode ? 'Edit' : 'Preview'}</span>
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
        {/* Left Sidebar - Elements (hidden in preview mode) */}
        {!isPreviewMode && (
        <div className="w-64 bg-[#1a1a2e] border-r border-[#2a2a3e] flex flex-col overflow-hidden shrink-0">
          <div className="p-3 border-b border-[#2a2a3e]">
            <div className="text-sm font-medium text-white">Elements</div>
            {activeColumn && (
              <div className="text-xs text-purple-400 mt-1">
                Inserting to Row {activeColumn.rowIndex + 1}, Col {activeColumn.colIndex + 1}
              </div>
            )}
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
                            addRow(1)
                            setTimeout(() => {
                              addElement(element.type, 0, 0)
                              setActiveColumn({ rowIndex: 0, colIndex: 0 })
                            }, 0)
                          } else if (activeColumn) {
                            // Use active column if one is selected
                            addElement(element.type, activeColumn.rowIndex, activeColumn.colIndex)
                          } else {
                            // Default to last row, first column
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
        )}

        {/* Center Canvas */}
        <div 
          className="flex-1 overflow-y-auto p-6"
          style={{
            backgroundColor: content.settings?.backgroundColor 
              ? `rgba(${parseInt(content.settings.backgroundColor.slice(1, 3), 16)}, ${parseInt(content.settings.backgroundColor.slice(3, 5), 16)}, ${parseInt(content.settings.backgroundColor.slice(5, 7), 16)}, ${content.settings?.backgroundOpacity ?? 1})`
              : '#0d0d15',
            backgroundImage: content.settings?.backgroundImage ? `url(${content.settings.backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div 
            className={`mx-auto min-h-full rounded-lg shadow-2xl transition-all ${
              devicePreview === 'desktop' ? 'max-w-full' :
              devicePreview === 'tablet' ? 'max-w-2xl' :
              'max-w-sm'
            }`}
            style={{
              backgroundColor: content.settings?.contentBackgroundColor 
                ? `rgba(${parseInt(content.settings.contentBackgroundColor.slice(1, 3), 16)}, ${parseInt(content.settings.contentBackgroundColor.slice(3, 5), 16)}, ${parseInt(content.settings.contentBackgroundColor.slice(5, 7), 16)}, ${content.settings?.contentBackgroundOpacity ?? 1})`
                : '#1a1a2e',
              backgroundImage: content.settings?.contentBackgroundImage ? `url(${content.settings.contentBackgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
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
                    draggable={!isPreviewMode}
                    onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                    onDragOver={(e) => handleRowDragOver(e, rowIndex)}
                    onDragLeave={handleRowDragLeave}
                    onDrop={(e) => handleRowDrop(e, rowIndex)}
                    onDragEnd={handleRowDragEnd}
                    onClick={() => {
                      if (!isPreviewMode) {
                        setSelectedRowIndex(rowIndex)
                        setRightPanelTab('row')
                      }
                    }}
                    className={`group relative border-2 rounded-lg transition-all ${
                      !isPreviewMode ? 'hover:border-purple-500/50 cursor-pointer' : ''
                    } ${
                      dragOverRowIndex === rowIndex ? 'border-purple-500 bg-purple-500/10' : 
                      selectedRowIndex === rowIndex ? 'border-purple-500/30' : 'border-transparent'
                    } ${
                      draggedRowIndex === rowIndex ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Row Controls (hidden in preview mode) */}
                    {!isPreviewMode && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <div className="flex items-center gap-1 bg-[#2a2a3e] rounded-lg px-2 py-1">
                        <button className="p-1 text-slate-400 hover:text-white cursor-grab" title="Drag to reorder">
                          <GripVertical size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicateRow(rowIndex)
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Duplicate row"
                        >
                          <Copy size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteRow(rowIndex)
                          }}
                          className="p-1 text-slate-400 hover:text-red-500"
                          title="Delete row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    )}
                    
                    
                    {/* Columns */}
                    <div 
                      className={`grid gap-4 p-4 relative ${
                        devicePreview === 'mobile' 
                          ? 'grid-cols-1'
                          : devicePreview === 'tablet'
                            ? (row.columns.length === 1 ? 'grid-cols-1' : 'grid-cols-2')
                            : (row.columns.length === 1 
                                ? 'grid-cols-1' 
                                : row.columns.length === 2 
                                  ? 'grid-cols-2' 
                                  : 'grid-cols-3')
                      }`}
                      style={{ 
                        backgroundColor: row.settings.backgroundColor !== 'transparent' 
                          ? `rgba(${parseInt(row.settings.backgroundColor?.slice(1, 3) || '1a', 16)}, ${parseInt(row.settings.backgroundColor?.slice(3, 5) || '1a', 16)}, ${parseInt(row.settings.backgroundColor?.slice(5, 7) || '2e', 16)}, ${row.settings.backgroundOpacity ?? 1})`
                          : 'transparent',
                        backgroundImage: row.settings.backgroundImage ? `url(${row.settings.backgroundImage})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {row.columns.map((col, colIndex) => (
                        <div
                          key={col.id}
                          onClick={(e) => {
                            if (!isPreviewMode) {
                              e.stopPropagation()
                              setActiveColumn({ rowIndex, colIndex })
                              setSelectedElementId(null)
                            }
                          }}
                          className={`w-full rounded-lg p-2 transition-all relative group/col ${
                            col.elements.length === 0 ? 'min-h-[100px]' : 'min-h-[20px]'
                          } ${
                            !isPreviewMode ? 'border border-dashed cursor-pointer' : ''
                          } ${
                            !isPreviewMode && activeColumn?.rowIndex === rowIndex && activeColumn?.colIndex === colIndex
                              ? 'border-purple-500 bg-purple-500/5'
                              : !isPreviewMode ? 'border-transparent hover:border-purple-400/50' : ''
                          }`}
                        >
                          {/* Column Controls */}
                          {!isPreviewMode && (
                            <div className="absolute -top-2 right-1 opacity-0 group-hover/col:opacity-100 transition-opacity z-10 flex items-center gap-0.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  duplicateColumn(rowIndex, colIndex)
                                }}
                                className="p-1 bg-[#2a2a3e] rounded text-slate-400 hover:text-white text-xs"
                                title="Duplicate column"
                              >
                                <Copy size={10} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteColumn(rowIndex, colIndex)
                                }}
                                className="p-1 bg-[#2a2a3e] rounded text-slate-400 hover:text-red-400 text-xs"
                                title="Delete column"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          )}
                          {col.elements.length === 0 ? (
                            !isPreviewMode ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setInsertPosition({ rowIndex, colIndex })
                                setActiveColumn({ rowIndex, colIndex })
                                setShowElementPicker(true)
                              }}
                              className="w-full h-full min-h-[80px] flex flex-col items-center justify-center text-slate-500 hover:text-purple-400 hover:border-purple-400 border border-dashed border-transparent rounded-lg transition-colors"
                            >
                              <Plus size={20} />
                              <span className="text-xs mt-1">Add Element</span>
                            </button>
                            ) : null
                          ) : (
                            <div className="space-y-2">
                              {col.elements.map((element, elementIndex) => (
                                <div
                                  key={element.id}
                                  draggable={!isPreviewMode}
                                  onDragStart={(e) => handleElementDragStart(e, rowIndex, colIndex, elementIndex)}
                                  onDragOver={(e) => handleElementDragOver(e, rowIndex, colIndex, elementIndex)}
                                  onDragLeave={handleElementDragLeave}
                                  onDrop={(e) => handleElementDrop(e, rowIndex, colIndex, elementIndex)}
                                  onDragEnd={handleElementDragEnd}
                                  onClick={(e) => {
                                    if (!isPreviewMode) {
                                      e.stopPropagation()
                                      setSelectedElementId(element.id)
                                      setRightPanelTab('properties')
                                    }
                                  }}
                                  className={`relative rounded-lg transition-all ${
                                    !isPreviewMode ? 'cursor-grab active:cursor-grabbing' : ''
                                  } ${
                                    !isPreviewMode && selectedElementId === element.id
                                      ? 'ring-2 ring-purple-500 bg-purple-500/10'
                                      : !isPreviewMode ? 'hover:bg-[#2a2a3e]' : ''
                                  } ${
                                    dragOverElement?.rowIndex === rowIndex && 
                                    dragOverElement?.colIndex === colIndex && 
                                    dragOverElement?.elementIndex === elementIndex 
                                      ? 'border-t-2 border-purple-500' : ''
                                  } ${
                                    draggedElement?.rowIndex === rowIndex && 
                                    draggedElement?.colIndex === colIndex && 
                                    draggedElement?.elementIndex === elementIndex 
                                      ? 'opacity-50' : ''
                                  }`}
                                  style={{
                                    marginTop: element.data.marginTop === 'auto' ? 'auto' : (typeof element.data.marginTop === 'number' ? element.data.marginTop : 0),
                                    marginRight: element.data.marginRight === 'auto' ? 'auto' : (typeof element.data.marginRight === 'number' ? element.data.marginRight : 0),
                                    marginBottom: element.data.marginBottom === 'auto' ? 'auto' : (typeof element.data.marginBottom === 'number' ? element.data.marginBottom : 0),
                                    marginLeft: element.data.marginLeft === 'auto' ? 'auto' : (typeof element.data.marginLeft === 'number' ? element.data.marginLeft : 0),
                                    paddingTop: (element.data.paddingTop === 'auto' ? 0 : (typeof element.data.paddingTop === 'number' ? element.data.paddingTop : 0)) + 12,
                                    paddingRight: (element.data.paddingRight === 'auto' ? 0 : (typeof element.data.paddingRight === 'number' ? element.data.paddingRight : 0)) + 12,
                                    paddingBottom: (element.data.paddingBottom === 'auto' ? 0 : (typeof element.data.paddingBottom === 'number' ? element.data.paddingBottom : 0)) + 12,
                                    paddingLeft: (element.data.paddingLeft === 'auto' ? 0 : (typeof element.data.paddingLeft === 'number' ? element.data.paddingLeft : 0)) + 12,
                                  }}
                                >
                                  {/* Element Renderer with inline editing */}
                                  <ElementRenderer 
                                    element={element} 
                                    isEditing={!isPreviewMode}
                                    onUpdate={(data) => updateElementData(element.id, data)}
                                    versionsWithCards={versionsWithCards}
                                  />
                                  
                                  {/* Element Controls (hidden in preview mode) */}
                                  {!isPreviewMode && selectedElementId === element.id && (
                                    <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-purple-600 rounded-lg px-1 py-0.5">
                                      <button className="p-1 text-white/80 hover:text-white cursor-grab">
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
                              {!isPreviewMode && (
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
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Add Row Button (hidden in preview mode) */}
                {!isPreviewMode && (
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
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Properties (hidden in preview mode) */}
        {!isPreviewMode && (
        <div className="w-64 bg-[#1a1a2e] border-l border-[#2a2a3e] flex flex-col overflow-hidden shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-[#2a2a3e]">
            <button
              onClick={() => setRightPanelTab('properties')}
              className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                rightPanelTab === 'properties' 
                  ? 'text-white border-b-2 border-purple-500 bg-purple-500/10' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Element
            </button>
            <button
              onClick={() => setRightPanelTab('row')}
              className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                rightPanelTab === 'row' 
                  ? 'text-white border-b-2 border-purple-500 bg-purple-500/10' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Row
            </button>
            <button
              onClick={() => setRightPanelTab('page')}
              className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                rightPanelTab === 'page' 
                  ? 'text-white border-b-2 border-purple-500 bg-purple-500/10' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Page
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {rightPanelTab === 'properties' && (
              selectedElement ? (
                <ElementProperties 
                  element={selectedElement} 
                  onUpdate={(data) => updateElementData(selectedElement.id, data)}
                  versionsWithCards={versionsWithCards}
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
              )
            )}
            
            {rightPanelTab === 'row' && (
              selectedRowIndex !== null && content.rows[selectedRowIndex] ? (
                <div className="space-y-4">
                  <div className="text-sm text-slate-400 mb-2">Row {selectedRowIndex + 1} Settings</div>
                  
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Background Color</label>
                    <input
                      type="color"
                      value={content.rows[selectedRowIndex].settings.backgroundColor === 'transparent' ? '#1a1a2e' : (content.rows[selectedRowIndex].settings.backgroundColor || '#1a1a2e')}
                      onChange={(e) => updateRowSettings(selectedRowIndex, { backgroundColor: e.target.value })}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Opacity: {Math.round((content.rows[selectedRowIndex].settings.backgroundOpacity ?? 1) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(content.rows[selectedRowIndex].settings.backgroundOpacity ?? 1) * 100}
                      onChange={(e) => updateRowSettings(selectedRowIndex, { backgroundOpacity: parseInt(e.target.value) / 100 })}
                      className="w-full h-2 bg-[#3a3a4e] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Background Image URL</label>
                    <input
                      type="text"
                      value={content.rows[selectedRowIndex].settings.backgroundImage || ''}
                      onChange={(e) => updateRowSettings(selectedRowIndex, { backgroundImage: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-[#0d0d15] border border-[#3a3a4e] rounded-lg text-sm text-white"
                    />
                  </div>
                  
                  <button
                    onClick={() => updateRowSettings(selectedRowIndex, { backgroundColor: 'transparent', backgroundOpacity: 1, backgroundImage: '' })}
                    className="w-full text-sm text-slate-400 hover:text-white py-2 border border-[#3a3a4e] rounded-lg hover:border-slate-500 transition-colors"
                  >
                    Reset to Default
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[#2a2a3e] flex items-center justify-center mx-auto mb-3">
                    <Settings size={20} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-400">
                    Click on a row to edit its settings
                  </p>
                </div>
              )
            )}
            
            {rightPanelTab === 'page' && (
              <div className="space-y-4">
                {/* Outer Background */}
                <div className="text-sm text-slate-400 mb-2">Outer Background</div>
                
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Color</label>
                  <input
                    type="color"
                    value={content.settings?.backgroundColor || '#0d0d15'}
                    onChange={(e) => updatePageSettings({ backgroundColor: e.target.value })}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Opacity: {Math.round((content.settings?.backgroundOpacity ?? 1) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(content.settings?.backgroundOpacity ?? 1) * 100}
                    onChange={(e) => updatePageSettings({ backgroundOpacity: parseInt(e.target.value) / 100 })}
                    className="w-full h-2 bg-[#3a3a4e] rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={content.settings?.backgroundImage || ''}
                    onChange={(e) => updatePageSettings({ backgroundImage: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-[#0d0d15] border border-[#3a3a4e] rounded-lg text-sm text-white"
                  />
                </div>

                <div className="border-t border-[#3a3a4e] pt-4 mt-4">
                  <div className="text-sm text-slate-400 mb-2">Content Container (Grey Layer)</div>
                </div>
                
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Color</label>
                  <input
                    type="color"
                    value={content.settings?.contentBackgroundColor || '#1a1a2e'}
                    onChange={(e) => updatePageSettings({ contentBackgroundColor: e.target.value })}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Opacity: {Math.round((content.settings?.contentBackgroundOpacity ?? 1) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(content.settings?.contentBackgroundOpacity ?? 1) * 100}
                    onChange={(e) => updatePageSettings({ contentBackgroundOpacity: parseInt(e.target.value) / 100 })}
                    className="w-full h-2 bg-[#3a3a4e] rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={content.settings?.contentBackgroundImage || ''}
                    onChange={(e) => updatePageSettings({ contentBackgroundImage: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-[#0d0d15] border border-[#3a3a4e] rounded-lg text-sm text-white"
                  />
                </div>
                
                <button
                  onClick={() => updatePageSettings({ 
                    backgroundColor: '#0d0d15', 
                    backgroundOpacity: 1, 
                    backgroundImage: '',
                    contentBackgroundColor: '#1a1a2e',
                    contentBackgroundOpacity: 1,
                    contentBackgroundImage: ''
                  })}
                  className="w-full text-sm text-slate-400 hover:text-white py-2 border border-[#3a3a4e] rounded-lg hover:border-slate-500 transition-colors"
                >
                  Reset All to Default
                </button>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Element Picker Modal */}
      {showElementPicker && insertPosition && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000] p-4">
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

// Inline Rich Text Component with basic formatting
function InlineRichText({ 
  value, 
  onChange, 
  isEditing,
  className,
  placeholder = 'Enter text...',
  multiline = false
}: { 
  value: string
  onChange: (value: string) => void
  isEditing: boolean
  className?: string
  placeholder?: string
  multiline?: boolean
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showToolbar, setShowToolbar] = useState(false)

  // Initialize content
  useEffect(() => {
    if (editorRef.current && isEditing) {
      editorRef.current.innerHTML = value || ''
    }
  }, [isEditing])

  const execCommand = (command: string, val?: string) => {
    document.execCommand(command, false, val)
    editorRef.current?.focus()
  }

  const handleBlur = () => {
    setShowToolbar(false)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  if (!isEditing) {
    return (
      <div 
        className={className}
        dangerouslySetInnerHTML={{ __html: value || placeholder }}
      />
    )
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      {/* Mini Toolbar */}
      {showToolbar && (
        <div className="absolute -top-8 left-0 flex items-center gap-0.5 bg-[#2a2a3e] rounded-lg px-1 py-0.5 z-10 shadow-lg">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execCommand('bold') }}
            className="p-1 text-slate-400 hover:text-white rounded text-xs font-bold"
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execCommand('italic') }}
            className="p-1 text-slate-400 hover:text-white rounded text-xs italic"
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execCommand('underline') }}
            className="p-1 text-slate-400 hover:text-white rounded text-xs underline"
            title="Underline"
          >
            U
          </button>
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable
        onFocus={() => setShowToolbar(true)}
        onBlur={handleBlur}
        data-placeholder={placeholder}
        className={`${className} bg-transparent outline-none w-full focus:ring-1 focus:ring-purple-500 rounded px-1 ${multiline ? 'min-h-[60px]' : ''} [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-slate-500`}
        style={{ minHeight: multiline ? '60px' : 'auto' }}
      />
    </div>
  )
}

// Simple Inline Editable Text Component (for non-rich text fields)
function InlineEditableText({ 
  value, 
  onChange, 
  isEditing,
  className,
  placeholder = 'Enter text...',
  multiline = false
}: { 
  value: string
  onChange: (value: string) => void
  isEditing: boolean
  className?: string
  placeholder?: string
  multiline?: boolean
}) {
  if (!isEditing) {
    return <span className={className}>{value || placeholder}</span>
  }

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className={`${className} bg-transparent border-none outline-none resize-none w-full focus:ring-1 focus:ring-purple-500 rounded px-1`}
        placeholder={placeholder}
        rows={3}
      />
    )
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className={`${className} bg-transparent border-none outline-none w-full focus:ring-1 focus:ring-purple-500 rounded px-1`}
      placeholder={placeholder}
    />
  )
}

// Element Renderer Component with inline editing support
function ElementRenderer({ 
  element, 
  isEditing = false,
  onUpdate,
  versionsWithCards = []
}: { 
  element: Element
  isEditing?: boolean
  onUpdate?: (data: Record<string, unknown>) => void
  versionsWithCards?: VersionWithCards[]
}) {
  const { type, data } = element
  const handleUpdate = (newData: Record<string, unknown>) => {
    if (onUpdate) onUpdate(newData)
  }

  switch (type) {
    case 'heading':
      const HeadingTag = (data.level as string) || 'h2'
      const headingAlign = (data.align as string) || 'left'
      const headingFontSize = (data.fontSize as string) || '24'
      const headingFontFamily = (data.fontFamily as string) || 'inherit'
      return (
        <div 
          className="font-bold text-white"
          style={{ 
            textAlign: headingAlign as 'left' | 'center' | 'right',
            fontSize: `${headingFontSize}px`,
            fontFamily: headingFontFamily === 'inherit' ? 'inherit' : headingFontFamily
          }}
        >
          <InlineRichText
            value={(data.text as string) || ''}
            onChange={(text) => handleUpdate({ text })}
            isEditing={isEditing}
            placeholder="Heading"
          />
        </div>
      )

    case 'paragraph':
      const paraAlign = (data.align as string) || 'left'
      const paraFontSize = (data.fontSize as string) || '14'
      const paraFontFamily = (data.fontFamily as string) || 'inherit'
      return (
        <div 
          className="text-slate-300 leading-relaxed"
          style={{ 
            textAlign: paraAlign as 'left' | 'center' | 'right',
            fontSize: `${paraFontSize}px`,
            fontFamily: paraFontFamily === 'inherit' ? 'inherit' : paraFontFamily
          }}
        >
          <InlineRichText
            value={(data.text as string) || ''}
            onChange={(text) => handleUpdate({ text })}
            isEditing={isEditing}
            placeholder="Enter your text here..."
            multiline
          />
        </div>
      )

    case 'section-header':
      return (
        <div 
          className="py-2 px-4 rounded-lg text-white font-bold uppercase tracking-wider text-sm"
          style={{ backgroundColor: (data.color as string) || '#c23a2b' }}
        >
          <InlineEditableText
            value={(data.text as string) || ''}
            onChange={(text) => handleUpdate({ text })}
            isEditing={isEditing}
            placeholder="SECTION TITLE"
          />
        </div>
      )

    case 'change-card':
      return (
        <div className="bg-[#0d0d15] rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-[#2a2a3e] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#3a3a4e] transition-colors">
              {data.icon ? (
                <img src={data.icon as string} alt="" className="w-10 h-10" />
              ) : (
                <Square size={24} className="text-slate-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-bold text-white">
                <InlineEditableText
                  value={(data.title as string) || ''}
                  onChange={(title) => handleUpdate({ title })}
                  isEditing={isEditing}
                  placeholder="Item Name"
                />
              </div>
              <div className="text-xs text-slate-400">
                <InlineEditableText
                  value={(data.subtitle as string) || ''}
                  onChange={(subtitle) => handleUpdate({ subtitle })}
                  isEditing={isEditing}
                  placeholder="Subtitle (optional)"
                />
              </div>
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
      const compOverlay = (data.overlay as string) || 'darken'
      const compBeforeOverlay = compOverlay === 'red' 
        ? 'bg-red-500/20 border-red-500/30' 
        : 'bg-black/30 border-slate-600/30'
      
      const beforeCardData = (data.before as { title?: string; subtitle?: string; icon?: string; changes?: Array<{type: string; text: string}> }) || {}
      const afterCardData = (data.after as { title?: string; subtitle?: string; icon?: string; changes?: Array<{type: string; text: string}> }) || {}
      
      // Render editable card
      const renderEditableCard = (
        cardData: { title?: string; subtitle?: string; icon?: string; changes?: Array<{type: string; text: string}> },
        cardKey: 'before' | 'after'
      ) => {
        const hasContent = cardData.title || (cardData.changes && cardData.changes.length > 0)
        if (!hasContent) {
          return (
            <div className="text-center text-slate-500 py-4">
              <Square size={24} className="mx-auto mb-2 opacity-50" />
              <div className="text-xs">Load a card from properties</div>
            </div>
          )
        }
        return (
          <div>
            <div className="flex items-center gap-2 mb-2">
              {cardData.icon ? (
                <img src={cardData.icon} alt="" className="w-8 h-8 rounded" />
              ) : (
                <div className="w-8 h-8 bg-[#2a2a3e] rounded flex items-center justify-center">
                  <Square size={14} className="text-slate-500" />
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium text-white text-sm">
                  <InlineEditableText
                    value={cardData.title || ''}
                    onChange={(title) => handleUpdate({ [cardKey]: { ...cardData, title } })}
                    isEditing={isEditing}
                    placeholder="Card Title"
                  />
                </div>
                <div className="text-xs text-slate-400">
                  <InlineEditableText
                    value={cardData.subtitle || ''}
                    onChange={(subtitle) => handleUpdate({ [cardKey]: { ...cardData, subtitle } })}
                    isEditing={isEditing}
                    placeholder="Subtitle"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              {(cardData.changes || []).map((change, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
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
      }
      
      return (
        <div className="bg-[#0d0d15] rounded-lg p-4">
          {(data.title as string) && (
            <div className="text-center text-white font-medium mb-3">
              <InlineEditableText
                value={(data.title as string) || ''}
                onChange={(title) => handleUpdate({ title })}
                isEditing={isEditing}
                placeholder="Comparison Title"
              />
            </div>
          )}
          <div className={`flex gap-4 ${(data.layout as string) === 'stacked' ? 'flex-col' : ''}`}>
            {/* Before */}
            <div className={`flex-1 p-3 rounded-lg border ${compBeforeOverlay}`}>
              <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">
                Before
              </div>
              {renderEditableCard(beforeCardData, 'before')}
            </div>
            {/* After */}
            <div className="flex-1 p-3 bg-[#1a1a2e] rounded-lg border border-green-500/30">
              <div className="text-xs text-green-400 mb-2 font-medium uppercase tracking-wide">
                After
              </div>
              {renderEditableCard(afterCardData, 'after')}
            </div>
          </div>
        </div>
      )

    case 'card-reference':
      const refOverlay = (data.overlay as string) || 'none'
      const refOverlayStyle = refOverlay === 'red' 
        ? 'bg-red-500/20 border-red-500/30' 
        : refOverlay === 'darken'
        ? 'bg-black/30 border-slate-600/30'
        : 'bg-[#0d0d15] border-[#2a2a3e]'
      
      const refChanges = (data.changes as Array<{type: string; text: string}>) || []
      const hasRefContent = data.title || refChanges.length > 0
      
      if (!hasRefContent) {
        return (
          <div className={`rounded-lg p-4 border ${refOverlayStyle}`}>
            <div className="text-center text-slate-500 py-4">
              <Square size={24} className="mx-auto mb-2 opacity-50" />
              <div className="text-xs">Load a card from properties</div>
            </div>
          </div>
        )
      }
      
      return (
        <div className={`rounded-lg p-4 border ${refOverlayStyle}`}>
          <div className="flex items-center gap-3 mb-3">
            {(data.icon as string) ? (
              <img src={data.icon as string} alt="" className="w-12 h-12 rounded-lg" />
            ) : (
              <div className="w-12 h-12 bg-[#2a2a3e] rounded-lg flex items-center justify-center">
                <Square size={24} className="text-slate-500" />
              </div>
            )}
            <div className="flex-1">
              <div className="font-bold text-white">
                <InlineEditableText
                  value={(data.title as string) || ''}
                  onChange={(title) => handleUpdate({ title })}
                  isEditing={isEditing}
                  placeholder="Card Title"
                />
              </div>
              <div className="text-xs text-slate-400">
                <InlineEditableText
                  value={(data.subtitle as string) || ''}
                  onChange={(subtitle) => handleUpdate({ subtitle })}
                  isEditing={isEditing}
                  placeholder="Subtitle"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            {refChanges.map((change, i) => (
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

    case 'divider':
      const dividerSpacing = (data.spacing as number) || 5
      return (
        <div style={{ paddingTop: dividerSpacing, paddingBottom: dividerSpacing }}>
          <hr 
            className="border-t"
            style={{ borderColor: (data.color as string) || '#333', borderWidth: '1px' }}
          />
        </div>
      )

    case 'spacer':
      return (
        <div style={{ height: (data.height as number) || 20 }} />
      )

    case 'image':
      const imgWidth = (data.width as string) || 'auto'
      const imgHeight = (data.height as string) || 'auto'
      return (
        <div 
          className="rounded-lg flex items-center justify-center"
          style={{
            width: imgWidth === 'auto' ? '100%' : imgWidth,
            height: imgHeight === 'auto' ? 'auto' : imgHeight,
          }}
        >
          {data.src ? (
            <img 
              src={data.src as string} 
              alt={data.alt as string} 
              className={`max-w-full rounded-lg transition-opacity ${!isEditing ? 'cursor-pointer hover:opacity-90' : ''}`}
              style={{ 
                width: imgWidth === 'auto' ? '100%' : imgWidth,
                height: imgHeight === 'auto' ? 'auto' : imgHeight,
                maxHeight: imgHeight === 'auto' ? '400px' : undefined,
                objectFit: 'contain' 
              }}
              onClick={(e) => {
                if (!isEditing) {
                  e.stopPropagation()
                  window.open(data.src as string, '_blank')
                }
              }}
              title={!isEditing ? "Click to view full size" : undefined}
            />
          ) : (
            <div className="text-center text-slate-500 py-8 bg-[#2a2a3e] w-full rounded-lg">
              <ImageIcon size={32} className="mx-auto mb-2" />
              <span className="text-xs">Click to add image</span>
            </div>
          )}
        </div>
      )

    case 'list':
      const items = (data.items as string[]) || ['Item 1', 'Item 2']
      const bulletStyle = (data.bulletStyle as string) || 'disc'
      const listAlign = (data.align as string) || 'left'
      const listIndent = (data.indent as number) || 0
      const listFontSize = (data.fontSize as string) || '14'
      const listFontFamily = (data.fontFamily as string) || 'inherit'
      
      // Bullet shape mapping
      const getBulletShape = (style: string) => {
        switch (style) {
          case 'disc': return '●'
          case 'circle': return '○'
          case 'square': return '■'
          case 'diamond': return '◆'
          case 'triangle': return '▶'
          case 'heart': return '♥'
          case 'star': return '★'
          case 'arrow': return '→'
          case 'check': return '✓'
          case 'dash': return '—'
          default: return '●'
        }
      }
      
      return (
        <ul 
          className="text-slate-300 space-y-1"
          style={{ 
            textAlign: listAlign as 'left' | 'center' | 'right',
            paddingLeft: `${listIndent * 16}px`,
            fontSize: `${listFontSize}px`,
            fontFamily: listFontFamily === 'inherit' ? 'inherit' : listFontFamily
          }}
        >
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 group">
              <span className="shrink-0 text-slate-400" style={{ fontSize: `${parseInt(listFontSize) * 0.7}px` }}>
                {getBulletShape(bulletStyle)}
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newItems = [...items]
                    newItems[i] = e.target.value
                    handleUpdate({ items: newItems })
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent border-none outline-none text-slate-300 focus:ring-1 focus:ring-purple-500 rounded px-1 -ml-1"
                  placeholder="List item..."
                />
              ) : (
                <span>{item}</span>
              )}
              {isEditing && items.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const newItems = items.filter((_, idx) => idx !== i)
                    handleUpdate({ items: newItems })
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-300 transition-opacity"
                >
                  <X size={12} />
                </button>
              )}
            </li>
          ))}
          {isEditing && (
            <li>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleUpdate({ items: [...items, ''] })
                }}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 ml-3.5"
              >
                <Plus size={12} />
                Add item
              </button>
            </li>
          )}
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
  onUpdate,
  versionsWithCards = []
}: { 
  element: Element
  onUpdate: (data: Record<string, unknown>) => void
  versionsWithCards?: VersionWithCards[]
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
          <div>
            <label className="block text-xs text-slate-400 mb-1">Alignment</label>
            <div className="flex gap-1">
              {['left', 'center', 'right'].map((align) => (
                <button
                  key={align}
                  onClick={() => onUpdate({ align })}
                  className={`flex-1 px-2 py-1.5 rounded text-xs ${
                    (data.align || 'left') === align 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-[#0d0d15] text-slate-400 hover:text-white'
                  }`}
                >
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Font Size (px)</label>
            <input
              type="number"
              value={(data.fontSize as string) || '24'}
              onChange={(e) => onUpdate({ fontSize: e.target.value })}
              min="12"
              max="72"
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Font Family</label>
            <select
              value={(data.fontFamily as string) || 'inherit'}
              onChange={(e) => onUpdate({ fontFamily: e.target.value })}
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="inherit">Default</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Verdana, sans-serif">Verdana</option>
              <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
              <option value="Impact, sans-serif">Impact</option>
            </select>
          </div>
        </>
      )}

      {type === 'paragraph' && (
        <>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Text</label>
            <textarea
              value={(data.text as string) || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Alignment</label>
            <div className="flex gap-1">
              {['left', 'center', 'right'].map((align) => (
                <button
                  key={align}
                  onClick={() => onUpdate({ align })}
                  className={`flex-1 px-2 py-1.5 rounded text-xs ${
                    (data.align || 'left') === align 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-[#0d0d15] text-slate-400 hover:text-white'
                  }`}
                >
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Font Size (px)</label>
            <input
              type="number"
              value={(data.fontSize as string) || '14'}
              onChange={(e) => onUpdate({ fontSize: e.target.value })}
              min="10"
              max="48"
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Font Family</label>
            <select
              value={(data.fontFamily as string) || 'inherit'}
              onChange={(e) => onUpdate({ fontFamily: e.target.value })}
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="inherit">Default</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Verdana, sans-serif">Verdana</option>
              <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
            </select>
          </div>
        </>
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

      {type === 'list' && (
        <>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Bullet Style</label>
            <select
              value={(data.bulletStyle as string) || 'disc'}
              onChange={(e) => onUpdate({ bulletStyle: e.target.value })}
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="disc">● Disc</option>
              <option value="circle">○ Circle</option>
              <option value="square">■ Square</option>
              <option value="diamond">◆ Diamond</option>
              <option value="triangle">▶ Triangle</option>
              <option value="heart">♥ Heart</option>
              <option value="star">★ Star</option>
              <option value="arrow">→ Arrow</option>
              <option value="check">✓ Check</option>
              <option value="dash">— Dash</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Alignment</label>
            <div className="flex gap-1">
              {['left', 'center', 'right'].map((align) => (
                <button
                  key={align}
                  onClick={() => onUpdate({ align })}
                  className={`flex-1 px-2 py-1.5 rounded text-xs ${
                    (data.align || 'left') === align 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-[#0d0d15] text-slate-400 hover:text-white'
                  }`}
                >
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Indentation: {(data.indent as number) || 0}</label>
            <input
              type="range"
              value={(data.indent as number) || 0}
              onChange={(e) => onUpdate({ indent: parseInt(e.target.value) })}
              min="0"
              max="4"
              className="w-full h-2 bg-[#3a3a4e] rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Font Size (px)</label>
            <input
              type="number"
              value={(data.fontSize as string) || '14'}
              onChange={(e) => onUpdate({ fontSize: e.target.value })}
              min="10"
              max="36"
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Font Family</label>
            <select
              value={(data.fontFamily as string) || 'inherit'}
              onChange={(e) => onUpdate({ fontFamily: e.target.value })}
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="inherit">Default</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Verdana, sans-serif">Verdana</option>
            </select>
          </div>
        </>
      )}

      {type === 'change-card' && (
        <>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Icon Image URL</label>
            <input
              type="text"
              value={(data.icon as string) || ''}
              onChange={(e) => onUpdate({ icon: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
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
          <div>
            <label className="block text-xs text-slate-400 mb-2">Changes</label>
            <div className="space-y-2">
              {((data.changes as Array<{type: string; text: string}>) || []).map((change, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    value={change.type}
                    onChange={(e) => {
                      const newChanges = [...((data.changes as Array<{type: string; text: string}>) || [])]
                      newChanges[i] = { ...newChanges[i], type: e.target.value }
                      onUpdate({ changes: newChanges })
                    }}
                    className="w-20 px-2 py-1.5 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="buff">↑ Buff</option>
                    <option value="nerf">↓ Nerf</option>
                    <option value="neutral">○ Info</option>
                  </select>
                  <input
                    type="text"
                    value={change.text}
                    onChange={(e) => {
                      const newChanges = [...((data.changes as Array<{type: string; text: string}>) || [])]
                      newChanges[i] = { ...newChanges[i], text: e.target.value }
                      onUpdate({ changes: newChanges })
                    }}
                    placeholder="Change description"
                    className="flex-1 px-2 py-1.5 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => {
                      const newChanges = ((data.changes as Array<{type: string; text: string}>) || []).filter((_, idx) => idx !== i)
                      onUpdate({ changes: newChanges })
                    }}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newChanges = [...((data.changes as Array<{type: string; text: string}>) || []), { type: 'buff', text: '' }]
                  onUpdate({ changes: newChanges })
                }}
                className="w-full py-1.5 text-xs text-purple-400 hover:text-purple-300 border border-dashed border-[#2a2a3e] hover:border-purple-500 rounded-lg transition-colors"
              >
                + Add Change
              </button>
            </div>
          </div>
        </>
      )}

      {type === 'comparison' && (
        <ComparisonProperties data={data} onUpdate={onUpdate} versionsWithCards={versionsWithCards} />
      )}

      {type === 'card-reference' && (
        <CardReferenceProperties data={data} onUpdate={onUpdate} versionsWithCards={versionsWithCards} />
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
          <div className="border-t border-[#2a2a3e] pt-3 mt-3">
            <label className="block text-xs text-slate-400 mb-2">Container Size</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Width</label>
                <input
                  type="text"
                  value={(data.width as string) || 'auto'}
                  onChange={(e) => onUpdate({ width: e.target.value })}
                  placeholder="auto"
                  className="w-full px-2 py-1.5 bg-[#0d0d15] border border-[#2a2a3e] rounded text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Height</label>
                <input
                  type="text"
                  value={(data.height as string) || 'auto'}
                  onChange={(e) => onUpdate({ height: e.target.value })}
                  placeholder="auto"
                  className="w-full px-2 py-1.5 bg-[#0d0d15] border border-[#2a2a3e] rounded text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">Use px, %, or auto</p>
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

      {type === 'list' && (
        <div>
          <label className="block text-xs text-slate-400 mb-2">List Items</label>
          <div className="space-y-2">
            {((data.items as string[]) || ['Item 1']).map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newItems = [...((data.items as string[]) || [])]
                    newItems[i] = e.target.value
                    onUpdate({ items: newItems })
                  }}
                  placeholder="List item..."
                  className="flex-1 px-2 py-1.5 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => {
                    const newItems = ((data.items as string[]) || []).filter((_, idx) => idx !== i)
                    onUpdate({ items: newItems.length > 0 ? newItems : ['Item 1'] })
                  }}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newItems = [...((data.items as string[]) || []), '']
                onUpdate({ items: newItems })
              }}
              className="w-full py-1.5 text-xs text-purple-400 hover:text-purple-300 border border-dashed border-[#2a2a3e] hover:border-purple-500 rounded-lg transition-colors"
            >
              + Add Item
            </button>
          </div>
        </div>
      )}

      {type === 'divider' && (
        <>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Color</label>
            <input
              type="color"
              value={(data.color as string) || '#333333'}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-full h-10 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Spacing: {(data.spacing as number) || 5}px</label>
            <input
              type="range"
              min="0"
              max="50"
              value={(data.spacing as number) || 5}
              onChange={(e) => onUpdate({ spacing: parseInt(e.target.value) })}
              className="w-full h-2 bg-[#3a3a4e] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </>
      )}

      {type === 'spacer' && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">Height: {(data.height as number) || 20}px</label>
          <input
            type="range"
            min="5"
            max="200"
            value={(data.height as number) || 20}
            onChange={(e) => onUpdate({ height: parseInt(e.target.value) })}
            className="w-full h-2 bg-[#3a3a4e] rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}

      {/* Margin & Padding - Available for all elements */}
      <div className="border-t border-[#2a2a3e] pt-3 mt-3">
        <label className="block text-xs text-slate-400 mb-2">Margin & Padding</label>
        
        {/* Margin */}
        <div className="mb-3">
          <div className="text-xs text-slate-500 mb-1">Margin</div>
          <div className="grid grid-cols-4 gap-1">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Top</label>
              <input
                type="text"
                value={(data.marginTop as string) ?? 'auto'}
                onChange={(e) => onUpdate({ marginTop: e.target.value === 'auto' ? 'auto' : parseInt(e.target.value) || 0 })}
                className="w-full px-1 py-1 bg-[#0d0d15] border border-[#3a3a4e] rounded text-center text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Bottom</label>
              <input
                type="text"
                value={(data.marginBottom as string) ?? 'auto'}
                onChange={(e) => onUpdate({ marginBottom: e.target.value === 'auto' ? 'auto' : parseInt(e.target.value) || 0 })}
                className="w-full px-1 py-1 bg-[#0d0d15] border border-[#3a3a4e] rounded text-center text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Left</label>
              <input
                type="text"
                value={(data.marginLeft as string) ?? 'auto'}
                onChange={(e) => onUpdate({ marginLeft: e.target.value === 'auto' ? 'auto' : parseInt(e.target.value) || 0 })}
                className="w-full px-1 py-1 bg-[#0d0d15] border border-[#3a3a4e] rounded text-center text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Right</label>
              <input
                type="text"
                value={(data.marginRight as string) ?? 'auto'}
                onChange={(e) => onUpdate({ marginRight: e.target.value === 'auto' ? 'auto' : parseInt(e.target.value) || 0 })}
                className="w-full px-1 py-1 bg-[#0d0d15] border border-[#3a3a4e] rounded text-center text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>
        
        {/* Padding */}
        <div>
          <div className="text-xs text-slate-500 mb-1">Padding</div>
          <div className="grid grid-cols-4 gap-1">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Top</label>
              <input
                type="text"
                value={(data.paddingTop as string) ?? 'auto'}
                onChange={(e) => onUpdate({ paddingTop: e.target.value === 'auto' ? 'auto' : parseInt(e.target.value) || 0 })}
                className="w-full px-1 py-1 bg-[#0d0d15] border border-[#3a3a4e] rounded text-center text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Bottom</label>
              <input
                type="text"
                value={(data.paddingBottom as string) ?? 'auto'}
                onChange={(e) => onUpdate({ paddingBottom: e.target.value === 'auto' ? 'auto' : parseInt(e.target.value) || 0 })}
                className="w-full px-1 py-1 bg-[#0d0d15] border border-[#3a3a4e] rounded text-center text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Left</label>
              <input
                type="text"
                value={(data.paddingLeft as string) ?? 'auto'}
                onChange={(e) => onUpdate({ paddingLeft: e.target.value === 'auto' ? 'auto' : parseInt(e.target.value) || 0 })}
                className="w-full px-1 py-1 bg-[#0d0d15] border border-[#3a3a4e] rounded text-center text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Right</label>
              <input
                type="text"
                value={(data.paddingRight as string) ?? 'auto'}
                onChange={(e) => onUpdate({ paddingRight: e.target.value === 'auto' ? 'auto' : parseInt(e.target.value) || 0 })}
                className="w-full px-1 py-1 bg-[#0d0d15] border border-[#3a3a4e] rounded text-center text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Use px values or "auto"</p>
      </div>
    </div>
  )
}

// Comparison Properties Component
function ComparisonProperties({ 
  data, 
  onUpdate, 
  versionsWithCards 
}: { 
  data: Record<string, unknown>
  onUpdate: (data: Record<string, unknown>) => void
  versionsWithCards: VersionWithCards[]
}) {
  const [loadVersionId, setLoadVersionId] = useState<{ before: string; after: string }>({ before: '', after: '' })
  
  const loadCard = (cardKey: 'before' | 'after', versionId: string, cardId: string) => {
    const version = versionsWithCards.find(v => v.id === versionId)
    const card = version?.cards.find(c => c.id === cardId)
    if (card) {
      onUpdate({
        [cardKey]: {
          title: card.title,
          subtitle: card.subtitle,
          icon: card.icon,
          changes: [...card.changes]
        }
      })
    }
  }
  
  const beforeData = (data.before as { title?: string; subtitle?: string; icon?: string; changes?: Array<{type: string; text: string}> }) || {}
  const afterData = (data.after as { title?: string; subtitle?: string; icon?: string; changes?: Array<{type: string; text: string}> }) || {}
  
  const renderCardEditor = (cardData: typeof beforeData, cardKey: 'before' | 'after') => (
    <div className="space-y-2">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Icon URL</label>
        <input
          type="text"
          value={cardData.icon || ''}
          onChange={(e) => onUpdate({ [cardKey]: { ...cardData, icon: e.target.value } })}
          placeholder="https://..."
          className="w-full px-2 py-1.5 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Title</label>
        <input
          type="text"
          value={cardData.title || ''}
          onChange={(e) => onUpdate({ [cardKey]: { ...cardData, title: e.target.value } })}
          className="w-full px-2 py-1.5 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Subtitle</label>
        <input
          type="text"
          value={cardData.subtitle || ''}
          onChange={(e) => onUpdate({ [cardKey]: { ...cardData, subtitle: e.target.value } })}
          className="w-full px-2 py-1.5 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Changes</label>
        <div className="space-y-1">
          {(cardData.changes || []).map((change, i) => (
            <div key={i} className="flex gap-1">
              <select
                value={change.type}
                onChange={(e) => {
                  const newChanges = [...(cardData.changes || [])]
                  newChanges[i] = { ...newChanges[i], type: e.target.value }
                  onUpdate({ [cardKey]: { ...cardData, changes: newChanges } })
                }}
                className="w-16 px-1 py-1 bg-[#0d0d15] border border-[#2a2a3e] rounded text-white text-[10px] focus:outline-none"
              >
                <option value="buff">↑</option>
                <option value="nerf">↓</option>
                <option value="neutral">○</option>
              </select>
              <input
                type="text"
                value={change.text}
                onChange={(e) => {
                  const newChanges = [...(cardData.changes || [])]
                  newChanges[i] = { ...newChanges[i], text: e.target.value }
                  onUpdate({ [cardKey]: { ...cardData, changes: newChanges } })
                }}
                className="flex-1 px-1 py-1 bg-[#0d0d15] border border-[#2a2a3e] rounded text-white text-[10px] focus:outline-none"
              />
              <button
                onClick={() => {
                  const newChanges = (cardData.changes || []).filter((_, idx) => idx !== i)
                  onUpdate({ [cardKey]: { ...cardData, changes: newChanges } })
                }}
                className="px-1 text-red-400 hover:text-red-300"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newChanges = [...(cardData.changes || []), { type: 'buff', text: '' }]
              onUpdate({ [cardKey]: { ...cardData, changes: newChanges } })
            }}
            className="w-full py-1 text-[10px] text-purple-400 border border-dashed border-[#2a2a3e] rounded hover:border-purple-500"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  )
  
  return (
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
          <option value="stacked">Stacked (Up/Down)</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">&quot;Before&quot; Overlay</label>
        <select
          value={(data.overlay as string) || 'darken'}
          onChange={(e) => onUpdate({ overlay: e.target.value })}
          className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="darken">Darken (Gray)</option>
          <option value="red">Red Tint</option>
        </select>
      </div>
      
      {/* Before Card */}
      <div className="pt-2 border-t border-[#2a2a3e]">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Before Card</div>
        <div className="flex gap-1 mb-2">
          <select
            value={loadVersionId.before}
            onChange={(e) => setLoadVersionId(prev => ({ ...prev, before: e.target.value }))}
            className="flex-1 px-2 py-1 bg-[#0d0d15] border border-[#2a2a3e] rounded text-white text-xs"
          >
            <option value="">Version...</option>
            {versionsWithCards.filter(v => v.cards.length > 0).map((v) => (
              <option key={v.id} value={v.id}>v{v.version}</option>
            ))}
          </select>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value && loadVersionId.before) {
                loadCard('before', loadVersionId.before, e.target.value)
              }
            }}
            className="flex-1 px-2 py-1 bg-[#0d0d15] border border-[#2a2a3e] rounded text-white text-xs"
          >
            <option value="">Load card...</option>
            {versionsWithCards.find(v => v.id === loadVersionId.before)?.cards.map((card) => (
              <option key={card.id} value={card.id}>{card.title}</option>
            ))}
          </select>
        </div>
        {renderCardEditor(beforeData, 'before')}
      </div>
      
      {/* After Card */}
      <div className="pt-2 border-t border-[#2a2a3e]">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">After Card</div>
        <div className="flex gap-1 mb-2">
          <select
            value={loadVersionId.after}
            onChange={(e) => setLoadVersionId(prev => ({ ...prev, after: e.target.value }))}
            className="flex-1 px-2 py-1 bg-[#0d0d15] border border-[#2a2a3e] rounded text-white text-xs"
          >
            <option value="">Version...</option>
            {versionsWithCards.filter(v => v.cards.length > 0).map((v) => (
              <option key={v.id} value={v.id}>v{v.version}</option>
            ))}
          </select>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value && loadVersionId.after) {
                loadCard('after', loadVersionId.after, e.target.value)
              }
            }}
            className="flex-1 px-2 py-1 bg-[#0d0d15] border border-[#2a2a3e] rounded text-white text-xs"
          >
            <option value="">Load card...</option>
            {versionsWithCards.find(v => v.id === loadVersionId.after)?.cards.map((card) => (
              <option key={card.id} value={card.id}>{card.title}</option>
            ))}
          </select>
        </div>
        {renderCardEditor(afterData, 'after')}
      </div>
    </>
  )
}

// Card Reference Properties Component
function CardReferenceProperties({ 
  data, 
  onUpdate, 
  versionsWithCards 
}: { 
  data: Record<string, unknown>
  onUpdate: (data: Record<string, unknown>) => void
  versionsWithCards: VersionWithCards[]
}) {
  const [loadVersionId, setLoadVersionId] = useState('')
  
  const loadCard = (versionId: string, cardId: string) => {
    const version = versionsWithCards.find(v => v.id === versionId)
    const card = version?.cards.find(c => c.id === cardId)
    if (card) {
      onUpdate({
        sourceVersionId: versionId,
        sourceCardId: cardId,
        title: card.title,
        subtitle: card.subtitle,
        icon: card.icon,
        changes: [...card.changes]
      })
    }
  }
  
  return (
    <>
      {/* Load from version */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Load from Version</label>
        <div className="flex gap-1">
          <select
            value={loadVersionId}
            onChange={(e) => setLoadVersionId(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-xs"
          >
            <option value="">Select version...</option>
            {versionsWithCards.filter(v => v.cards.length > 0).map((v) => (
              <option key={v.id} value={v.id}>v{v.version} - {v.title}</option>
            ))}
          </select>
        </div>
        {loadVersionId && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                loadCard(loadVersionId, e.target.value)
              }
            }}
            className="w-full mt-1 px-2 py-1.5 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-xs"
          >
            <option value="">Select card to load...</option>
            {versionsWithCards.find(v => v.id === loadVersionId)?.cards.map((card) => (
              <option key={card.id} value={card.id}>{card.title}</option>
            ))}
          </select>
        )}
      </div>
      
      <div>
        <label className="block text-xs text-slate-400 mb-1">Overlay Color</label>
        <select
          value={(data.overlay as string) || 'none'}
          onChange={(e) => onUpdate({ overlay: e.target.value })}
          className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="none">None</option>
          <option value="darken">Darken (Gray)</option>
          <option value="red">Red Tint</option>
        </select>
      </div>
      
      <div>
        <label className="block text-xs text-slate-400 mb-1">Icon URL</label>
        <input
          type="text"
          value={(data.icon as string) || ''}
          onChange={(e) => onUpdate({ icon: e.target.value })}
          placeholder="https://..."
          className="w-full px-3 py-2 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
        />
      </div>
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
      
      <div>
        <label className="block text-xs text-slate-400 mb-2">Changes</label>
        <div className="space-y-2">
          {((data.changes as Array<{type: string; text: string}>) || []).map((change, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={change.type}
                onChange={(e) => {
                  const newChanges = [...((data.changes as Array<{type: string; text: string}>) || [])]
                  newChanges[i] = { ...newChanges[i], type: e.target.value }
                  onUpdate({ changes: newChanges })
                }}
                className="w-20 px-2 py-1.5 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-xs"
              >
                <option value="buff">↑ Buff</option>
                <option value="nerf">↓ Nerf</option>
                <option value="neutral">○ Info</option>
              </select>
              <input
                type="text"
                value={change.text}
                onChange={(e) => {
                  const newChanges = [...((data.changes as Array<{type: string; text: string}>) || [])]
                  newChanges[i] = { ...newChanges[i], text: e.target.value }
                  onUpdate({ changes: newChanges })
                }}
                className="flex-1 px-2 py-1.5 bg-[#0d0d15] border border-[#2a2a3e] rounded-lg text-white text-xs"
              />
              <button
                onClick={() => {
                  const newChanges = ((data.changes as Array<{type: string; text: string}>) || []).filter((_, idx) => idx !== i)
                  onUpdate({ changes: newChanges })
                }}
                className="p-1.5 text-red-400 hover:text-red-300"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newChanges = [...((data.changes as Array<{type: string; text: string}>) || []), { type: 'buff', text: '' }]
              onUpdate({ changes: newChanges })
            }}
            className="w-full py-1.5 text-xs text-purple-400 border border-dashed border-[#2a2a3e] rounded-lg hover:border-purple-500"
          >
            + Add Change
          </button>
        </div>
      </div>
    </>
  )
}
