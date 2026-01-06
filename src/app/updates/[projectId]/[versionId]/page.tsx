'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  Square,
  Image as ImageIcon,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react'

interface Element {
  id: string
  type: string
  data: Record<string, unknown>
}

interface Column {
  id: string
  width: string
  elements: Element[]
}

interface Row {
  id: string
  columns: Column[]
  settings: {
    backgroundColor?: string
    padding?: string
  }
}

interface PageContent {
  rows: Row[]
}

interface Version {
  id: string
  version: string
  title: string
  description: string | null
  isPublished: boolean
}

interface Project {
  id: string
  name: string
  slug: string
}

export default function PublicUpdatePage() {
  const params = useParams()
  const projectId = params.projectId as string
  const versionId = params.versionId as string

  const [version, setVersion] = useState<Version | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [content, setContent] = useState<PageContent>({ rows: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  useEffect(() => {
    fetchData()
  }, [projectId, versionId])

  const fetchData = async () => {
    try {
      // Fetch version info
      const versionRes = await fetch(`/api/public/updates/${projectId}/${versionId}`)
      if (!versionRes.ok) {
        if (versionRes.status === 404) {
          setError('Update not found')
        } else if (versionRes.status === 403) {
          setError('This update is not published yet')
        } else {
          setError('Failed to load update')
        }
        setLoading(false)
        return
      }
      
      const data = await versionRes.json()
      setVersion(data.version)
      setProject(data.project)
      setContent(data.page?.content || { rows: [] })
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError('Failed to load update')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d15] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d0d15] flex flex-col items-center justify-center text-center p-4">
        <div className="text-6xl mb-4">😢</div>
        <h1 className="text-2xl font-bold text-white mb-2">{error}</h1>
        <p className="text-slate-400 mb-6">The page you're looking for doesn't exist or isn't available.</p>
        <Link 
          href="/"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Go Home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0d15]">
      {/* Header */}
      <header className="bg-[#1a1a2e] border-b border-[#2a2a3e] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={project?.id ? `/game/${project.id}` : '/'}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm hidden sm:inline">{project?.name || 'Back to Game'}</span>
            </Link>
            <div className="h-6 w-px bg-[#2a2a3e]" />
            <div>
              <h1 className="text-white font-bold">{version?.title}</h1>
              <p className="text-xs text-slate-400">Version {version?.version}</p>
            </div>
          </div>
          
          {/* Device Preview Toggle */}
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
        </div>
      </header>

      {/* Content */}
      <main className="py-8 px-4">
        <div 
          className={`mx-auto bg-[#1a1a2e] min-h-[50vh] rounded-lg shadow-2xl transition-all ${
            devicePreview === 'desktop' ? 'max-w-5xl' :
            devicePreview === 'tablet' ? 'max-w-2xl' :
            'max-w-sm'
          }`}
        >
          {content.rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-white mb-2">No Content Yet</h3>
              <p className="text-slate-400 text-sm">
                This update page is still being built.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {content.rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg"
                  style={{ backgroundColor: row.settings.backgroundColor }}
                >
                  <div className="flex gap-4 p-4">
                    {row.columns.map((col) => (
                      <div
                        key={col.id}
                        className="flex-1"
                        style={{ width: col.width }}
                      >
                        <div className="space-y-2">
                          {col.elements.map((element) => (
                            <div key={element.id} className="p-3">
                              <ElementRenderer element={element} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 text-sm">
        <p>Powered by <Link href="/" className="text-purple-400 hover:text-purple-300">PlayPulse</Link></p>
      </footer>
    </div>
  )
}

// Element Renderer Component (same as editor but read-only)
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
        <p className="text-slate-300 text-sm leading-relaxed">
          {(data.text as string) || 'Enter your text here...'}
        </p>
      )

    case 'bullet-list':
      return (
        <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
          {((data.items as string[]) || ['Item 1']).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
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
                {data.beforeImage ? (
                  <img src={data.beforeImage as string} alt="Before" className="max-h-full" />
                ) : (
                  <ImageIcon size={24} className="text-slate-500" />
                )}
              </div>
            </div>
            <div className="flex-1 p-3 bg-[#1a1a2e] rounded-lg">
              <div className="text-xs text-slate-400 mb-1">After</div>
              <div className="h-20 bg-[#2a2a3e] rounded flex items-center justify-center">
                {data.afterImage ? (
                  <img src={data.afterImage as string} alt="After" className="max-h-full" />
                ) : (
                  <ImageIcon size={24} className="text-slate-500" />
                )}
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
                <tr key={i} className="border-b border-[#2a2a3e] last:border-0">
                  <td className="p-2 text-white">{stat.name}</td>
                  <td className="p-2 text-center text-slate-400">{stat.old}</td>
                  <td className={`p-2 text-center ${
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

    case 'image':
      return (
        <div className="rounded-lg overflow-hidden">
          {data.src ? (
            <img src={data.src as string} alt={(data.alt as string) || ''} className="w-full" />
          ) : (
            <div className="h-40 bg-[#2a2a3e] flex items-center justify-center">
              <ImageIcon size={32} className="text-slate-500" />
            </div>
          )}
        </div>
      )

    case 'video':
      return (
        <div className="rounded-lg overflow-hidden bg-[#0d0d15] aspect-video flex items-center justify-center">
          {data.url ? (
            <video src={data.url as string} controls className="w-full" />
          ) : (
            <div className="text-slate-500">Video placeholder</div>
          )}
        </div>
      )

    case 'divider':
      return (
        <hr 
          className="border-t" 
          style={{ 
            borderColor: (data.color as string) || '#333',
            borderStyle: (data.style as string) || 'solid'
          }} 
        />
      )

    case 'spacer':
      return <div style={{ height: (data.height as number) || 40 }} />

    default:
      return (
        <div className="p-4 bg-[#2a2a3e] rounded-lg text-slate-400 text-sm">
          Unknown element: {type}
        </div>
      )
  }
}
