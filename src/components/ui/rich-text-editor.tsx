'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  Heading1, 
  Heading2,
  Quote,
  Code,
  Undo,
  Redo
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  maxLength?: number
  className?: string
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Start typing...', 
  minHeight = '150px',
  maxLength,
  className 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const isInitialMount = useRef(true)

  // Only set innerHTML on initial mount, not on every value change
  useEffect(() => {
    if (isInitialMount.current && editorRef.current) {
      editorRef.current.innerHTML = value || ''
      isInitialMount.current = false
    }
  }, [value])

  const execCommand = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val)
    editorRef.current?.focus()
  }, [])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      if (maxLength && editorRef.current.innerText.length > maxLength) {
        // Truncate if over max length - save and restore selection
        const selection = window.getSelection()
        const range = selection?.getRangeAt(0)
        const cursorPos = range?.startOffset || 0
        
        editorRef.current.innerText = editorRef.current.innerText.slice(0, maxLength)
        
        // Restore cursor position
        if (selection && editorRef.current.firstChild) {
          const newRange = document.createRange()
          newRange.setStart(editorRef.current.firstChild, Math.min(cursorPos, maxLength))
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
      }
    }
  }, [maxLength])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    // Only sync to parent on blur to avoid cursor issues
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }, [execCommand])

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    title 
  }: { 
    onClick: () => void
    icon: React.ComponentType<{ className?: string }>
    title: string 
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
    </button>
  )

  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-border mx-1" />
  )

  return (
    <div className={cn("rounded-xl border border-input bg-background overflow-hidden", isFocused && "ring-2 ring-ring ring-offset-2 ring-offset-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-2 border-b border-input bg-muted/30 flex-wrap">
        <ToolbarButton onClick={() => execCommand('undo')} icon={Undo} title="Undo" />
        <ToolbarButton onClick={() => execCommand('redo')} icon={Redo} title="Redo" />
        
        <ToolbarDivider />
        
        <ToolbarButton onClick={() => execCommand('bold')} icon={Bold} title="Bold (Ctrl+B)" />
        <ToolbarButton onClick={() => execCommand('italic')} icon={Italic} title="Italic (Ctrl+I)" />
        <ToolbarButton onClick={() => execCommand('underline')} icon={Underline} title="Underline (Ctrl+U)" />
        
        <ToolbarDivider />
        
        <ToolbarButton onClick={() => execCommand('formatBlock', 'h1')} icon={Heading1} title="Heading 1" />
        <ToolbarButton onClick={() => execCommand('formatBlock', 'h2')} icon={Heading2} title="Heading 2" />
        
        <ToolbarDivider />
        
        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={List} title="Bullet List" />
        <ToolbarButton onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} title="Numbered List" />
        
        <ToolbarDivider />
        
        <ToolbarButton onClick={() => execCommand('formatBlock', 'blockquote')} icon={Quote} title="Quote" />
        <ToolbarButton onClick={() => execCommand('formatBlock', 'pre')} icon={Code} title="Code Block" />
        <ToolbarButton onClick={insertLink} icon={Link} title="Insert Link" />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className={cn(
          "px-3 py-2 text-sm outline-none overflow-y-auto",
          "prose prose-sm prose-invert max-w-none",
          "prose-headings:font-semibold prose-headings:text-foreground",
          "prose-h1:text-xl prose-h1:mt-4 prose-h1:mb-2",
          "prose-h2:text-lg prose-h2:mt-3 prose-h2:mb-2",
          "prose-p:my-1 prose-p:text-foreground",
          "prose-ul:my-2 prose-ol:my-2 prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-4 prose-ol:pl-4",
          "prose-li:my-0.5",
          "prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground",
          "prose-pre:bg-muted prose-pre:rounded-lg prose-pre:p-2",
          "prose-a:text-primary prose-a:underline",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground [&:empty]:before:pointer-events-none"
        )}
        style={{ minHeight }}
      />

      {/* Character count */}
      {maxLength && (
        <div className="px-3 py-1 text-xs text-muted-foreground border-t border-input bg-muted/30">
          {editorRef.current?.innerText.length || 0}/{maxLength} characters
        </div>
      )}
    </div>
  )
}
