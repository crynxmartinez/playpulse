'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface UserProfile {
  id: string
  email: string
  name: string | null
  username: string | null
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  studioName: string | null
  website: string | null
  twitter: string | null
  discord: string | null
  createdAt: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)

  // Password change state
  const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    displayName: '',
    bio: '',
    avatarUrl: '',
    studioName: '',
    website: '',
    twitter: '',
    discord: '',
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
          username: data.user.username || '',
          displayName: data.user.displayName || '',
          bio: data.user.bio || '',
          avatarUrl: data.user.avatarUrl || '',
          studioName: data.user.studioName || '',
          website: data.user.website || '',
          twitter: data.user.twitter || '',
          discord: data.user.discord || '',
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
    setMessage(null)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data.user)
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch (error) {
      console.error('Failed to save:', error)
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const handleChangePassword = async () => {
    setPwMessage(null)
    if (!pwData.currentPassword || !pwData.newPassword || !pwData.confirmPassword) {
      setPwMessage({ type: 'error', text: 'All fields are required' })
      return
    }
    if (pwData.newPassword.length < 6) {
      setPwMessage({ type: 'error', text: 'New password must be at least 6 characters' })
      return
    }
    if (pwData.newPassword !== pwData.confirmPassword) {
      setPwMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    setPwSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwData.currentPassword, newPassword: pwData.newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setPwMessage({ type: 'success', text: 'Password changed successfully!' })
        setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setPwMessage({ type: 'error', text: data.error || 'Failed to change password' })
      }
    } catch {
      setPwMessage({ type: 'error', text: 'Something went wrong' })
    } finally {
      setPwSaving(false)
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
      {/* Header */}
      <div>
        <div className="text-xl font-semibold">Settings</div>
        <div className="text-sm text-muted-foreground">Profile, studio, and workspace preferences.</div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-2xl ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Profile Card */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Username</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">@</span>
                <Input
                  placeholder="username"
                  className="rounded-2xl"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">3-20 characters, letters, numbers, underscores</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Display Name</label>
              <Input
                placeholder="Your name"
                className="rounded-2xl mt-1"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Bio</label>
              <textarea
                placeholder="Tell us about yourself..."
                className="w-full rounded-2xl mt-1 px-3 py-2 border bg-background text-sm resize-none"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Avatar URL</label>
              <Input
                placeholder="https://..."
                className="rounded-2xl mt-1"
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Studio Card */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Studio / Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Studio Name</label>
              <Input
                placeholder="Your studio or team name"
                className="rounded-2xl mt-1"
                value={formData.studioName}
                onChange={(e) => setFormData({ ...formData, studioName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Website</label>
              <Input
                placeholder="https://..."
                className="rounded-2xl mt-1"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Twitter</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">@</span>
                <Input
                  placeholder="handle"
                  className="rounded-2xl"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value.replace('@', '') })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Discord</label>
              <Input
                placeholder="username#0000 or username"
                className="rounded-2xl mt-1"
                value={formData.discord}
                onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <Button 
        className="rounded-2xl w-full md:w-auto" 
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save All Changes'}
      </Button>

      {/* Change Password Card */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pwMessage && (
            <div className={`p-3 rounded-2xl text-sm ${
              pwMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {pwMessage.text}
            </div>
          )}
          <div>
            <label className="text-sm text-muted-foreground">Current Password</label>
            <Input
              type="password"
              placeholder="Enter current password"
              className="rounded-2xl mt-1"
              value={pwData.currentPassword}
              onChange={(e) => setPwData({ ...pwData, currentPassword: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">New Password</label>
            <Input
              type="password"
              placeholder="At least 6 characters"
              className="rounded-2xl mt-1"
              value={pwData.newPassword}
              onChange={(e) => setPwData({ ...pwData, newPassword: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Confirm New Password</label>
            <Input
              type="password"
              placeholder="Repeat new password"
              className="rounded-2xl mt-1"
              value={pwData.confirmPassword}
              onChange={(e) => setPwData({ ...pwData, confirmPassword: e.target.value })}
            />
          </div>
          <Button
            className="rounded-2xl"
            onClick={handleChangePassword}
            disabled={pwSaving}
          >
            {pwSaving ? 'Changing...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Account Card */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border p-3">
              <div className="text-sm font-medium">Email</div>
              <div className="text-sm text-muted-foreground">{user?.email || '—'}</div>
            </div>
            <div className="rounded-2xl border p-3">
              <div className="text-sm font-medium">Current Plan</div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full">Free</Badge>
              </div>
            </div>
            <div className="rounded-2xl border p-3">
              <div className="text-sm font-medium">Member Since</div>
              <div className="text-sm text-muted-foreground">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="rounded-2xl text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
