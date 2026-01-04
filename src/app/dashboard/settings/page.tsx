'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<{
    id: string
    email: string
    name: string | null
  } | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name }),
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
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
      {/* Header */}
      <div>
        <div className="text-xl font-semibold">Settings</div>
        <div className="text-sm text-muted-foreground">Profile, studio, and workspace preferences.</div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Profile Card */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Display Name</label>
              <Input
                placeholder="Your name"
                className="rounded-2xl mt-1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <Input
                placeholder="Email"
                className="rounded-2xl mt-1"
                value={formData.email}
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <Button 
              className="rounded-2xl w-full" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Account Card */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border p-3">
              <div className="text-sm font-medium">Current Plan</div>
              <div className="text-sm text-muted-foreground">Free</div>
            </div>
            <div className="rounded-2xl border p-3">
              <div className="text-sm font-medium">Member Since</div>
              <div className="text-sm text-muted-foreground">
                {user ? new Date().toLocaleDateString() : '—'}
              </div>
            </div>
            <Button 
              variant="outline" 
              className="rounded-2xl w-full text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Future Settings */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border p-3 text-center">
              <div className="font-medium">Username</div>
              <div className="text-xs">@handle</div>
            </div>
            <div className="rounded-2xl border p-3 text-center">
              <div className="font-medium">Studio Name</div>
              <div className="text-xs">For public profile</div>
            </div>
            <div className="rounded-2xl border p-3 text-center">
              <div className="font-medium">Social Links</div>
              <div className="text-xs">Discord, Twitter, etc.</div>
            </div>
            <div className="rounded-2xl border p-3 text-center">
              <div className="font-medium">Avatar</div>
              <div className="text-xs">Profile picture</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
