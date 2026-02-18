'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCallback, useEffect } from 'react'

const lowlight = createLowlight(common)

interface TipTapEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function TipTapEditor({ content, onChange, placeholder = 'Start writing...' }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-purple-400 underline hover:text-purple-300',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[400px] p-4 focus:outline-none',
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const setLink = useCallback(() => {
    if (!editor) return
    
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl)
    
    if (url === null) return
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return (
      <div className="rounded-xl bg-[#1a1a2e] border border-[#2a2a3e] p-4 min-h-[500px] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-[#1a1a2e] border border-[#2a2a3e] overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-[#2a2a3e] bg-[#0d0d15]">
        {/* Text formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#8b5cf6' }).run()}
          className={`h-8 w-8 p-0 ${editor.isActive('highlight') ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Highlighter className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-[#2a2a3e] mx-1 self-center" />

        {/* Headings */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 1 }) ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 2 }) ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 3 }) ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-[#2a2a3e] mx-1 self-center" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('blockquote') ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('codeBlock') ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="h-8 w-8 p-0 text-slate-400 hover:text-white"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-[#2a2a3e] mx-1 self-center" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'left' }) ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'center' }) ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'right' }) ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-[#2a2a3e] mx-1 self-center" />

        {/* Media */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={`h-8 w-8 p-0 ${editor.isActive('link') ? 'bg-purple-600/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
          className="h-8 w-8 p-0 text-slate-400 hover:text-white"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0 text-slate-400 hover:text-white disabled:opacity-30"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0 text-slate-400 hover:text-white disabled:opacity-30"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Editor styles */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 400px;
          padding: 1rem;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #64748b;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: white;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: white;
        }
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: white;
        }
        .ProseMirror p {
          color: #cbd5e1;
          margin-bottom: 0.75rem;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
          color: #cbd5e1;
        }
        .ProseMirror li {
          margin-bottom: 0.25rem;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #8b5cf6;
          padding-left: 1rem;
          margin-left: 0;
          margin-bottom: 0.75rem;
          color: #94a3b8;
          font-style: italic;
        }
        .ProseMirror pre {
          background: #0d0d15;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 0.75rem;
          overflow-x: auto;
        }
        .ProseMirror code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.875rem;
          color: #e2e8f0;
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid #2a2a3e;
          margin: 1.5rem 0;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .ProseMirror mark {
          background-color: #8b5cf6;
          color: white;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
        }
      `}</style>
    </div>
  )
}
