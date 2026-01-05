'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function NewGamePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          slug: formData.slug || null,
        }),
      })
      const data = await res.json()
      if (data.project) {
        router.push(`/dashboard/projects/${data.project.id}`)
      } else if (data.error) {
        alert(data.error)
      }
    } catch (error) {
      console.error('Failed to create game:', error)
      alert('Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Create New Game</h1>
            <p className="text-muted-foreground">Set up your game hub to collect feedback</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Game Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    name: e.target.value,
                    slug: formData.slug || generateSlug(e.target.value)
                  })
                }}
                placeholder="e.g., Codex Legends TCG"
                className="rounded-xl"
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
                placeholder="Brief description of your game..."
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 bg-white resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                URL Slug
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">playpulse.app/game/</span>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                  placeholder="my-game"
                  className="rounded-xl flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This will be your public game page URL
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading || !formData.name.trim()}
            className="rounded-xl"
          >
            {loading ? 'Creating...' : 'Create Game'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
