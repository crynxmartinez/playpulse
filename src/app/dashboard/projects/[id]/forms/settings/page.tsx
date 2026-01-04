'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Award, Link as LinkIcon, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Project {
  id: string
  name: string
  bannerUrl: string | null
  logoUrl: string | null
  steamUrl: string | null
  itchUrl: string | null
  websiteUrl: string | null
  discordUrl: string | null
  tierLowMax: number
  tierMediumMax: number
  tierLowLabel: string
  tierMediumLabel: string
  tierHighLabel: string
  tierLowMsg: string | null
  tierMediumMsg: string | null
  tierHighMsg: string | null
}

export default function FormSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [linksData, setLinksData] = useState({
    bannerUrl: '',
    logoUrl: '',
    steamUrl: '',
    itchUrl: '',
    websiteUrl: '',
    discordUrl: '',
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

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      if (data.project) {
        setLinksData({
          bannerUrl: data.project.bannerUrl || '',
          logoUrl: data.project.logoUrl || '',
          steamUrl: data.project.steamUrl || '',
          itchUrl: data.project.itchUrl || '',
          websiteUrl: data.project.websiteUrl || '',
          discordUrl: data.project.discordUrl || '',
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
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...linksData, ...tierData }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: 'Form settings updated successfully!' })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update settings' })
      console.error(error)
    } finally {
      setSaving(false)
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
        <div className="text-lg font-semibold">Form Settings</div>
        <div className="text-sm text-muted-foreground">
          Configure links, media, and score tier settings for your forms.
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

      <form onSubmit={handleSave}>
        {/* Links & Media */}
        <Card className="rounded-3xl mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <LinkIcon className="h-4 w-4" /> Links & Media
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Banner Image URL</label>
                <Input
                  value={linksData.bannerUrl}
                  onChange={(e) => setLinksData({ ...linksData, bannerUrl: e.target.value })}
                  className="rounded-2xl mt-1"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Logo URL</label>
                <Input
                  value={linksData.logoUrl}
                  onChange={(e) => setLinksData({ ...linksData, logoUrl: e.target.value })}
                  className="rounded-2xl mt-1"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Steam URL</label>
                <Input
                  value={linksData.steamUrl}
                  onChange={(e) => setLinksData({ ...linksData, steamUrl: e.target.value })}
                  className="rounded-2xl mt-1"
                  placeholder="https://store.steampowered.com/..."
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Itch.io URL</label>
                <Input
                  value={linksData.itchUrl}
                  onChange={(e) => setLinksData({ ...linksData, itchUrl: e.target.value })}
                  className="rounded-2xl mt-1"
                  placeholder="https://itch.io/..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Website</label>
                <Input
                  value={linksData.websiteUrl}
                  onChange={(e) => setLinksData({ ...linksData, websiteUrl: e.target.value })}
                  className="rounded-2xl mt-1"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Discord Server</label>
                <Input
                  value={linksData.discordUrl}
                  onChange={(e) => setLinksData({ ...linksData, discordUrl: e.target.value })}
                  className="rounded-2xl mt-1"
                  placeholder="https://discord.gg/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Tiers Configuration */}
        <Card className="rounded-3xl mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4" /> Score Tiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
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
            <div className="mt-4 p-4 rounded-2xl border">
              <h4 className="font-medium text-sm mb-3">Preview</h4>
              <div className="flex gap-2">
                <div className="flex-1 text-center p-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white">
                  <div className="text-xs opacity-80">0-{tierData.tierLowMax}%</div>
                  <div className="font-semibold text-sm">{tierData.tierLowLabel || 'Low'}</div>
                </div>
                <div className="flex-1 text-center p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
                  <div className="text-xs opacity-80">{tierData.tierLowMax + 1}-{tierData.tierMediumMax}%</div>
                  <div className="font-semibold text-sm">{tierData.tierMediumLabel || 'Medium'}</div>
                </div>
                <div className="flex-1 text-center p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  <div className="text-xs opacity-80">{tierData.tierMediumMax + 1}-100%</div>
                  <div className="font-semibold text-sm">{tierData.tierHighLabel || 'High'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button type="submit" className="rounded-2xl w-full md:w-auto" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Form Settings'}
        </Button>
      </form>
    </div>
  )
}
