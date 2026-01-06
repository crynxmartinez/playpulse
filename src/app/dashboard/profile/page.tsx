'use client'

import { useState, useEffect } from 'react'
import { User, Globe, Twitter, MessageCircle, Camera, Save, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Profile {
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

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    bio: '',
    avatarUrl: '',
    studioName: '',
    website: '',
    twitter: '',
    discord: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      const data = await res.json()
      
      if (res.ok) {
        setProfile(data.profile)
        setFormData({
          displayName: data.profile.displayName || '',
          username: data.profile.username || '',
          bio: data.profile.bio || '',
          avatarUrl: data.profile.avatarUrl || '',
          studioName: data.profile.studioName || '',
          website: data.profile.website || '',
          twitter: data.profile.twitter || '',
          discord: data.profile.discord || '',
        })
      } else {
        setError(data.error || 'Failed to load profile')
      }
    } catch (err) {
      setError('Failed to load profile')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        setProfile(data.profile)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || 'Failed to save profile')
      }
    } catch (err) {
      setError('Failed to save profile')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your developer profile. This information is shown on your games.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity Section */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Identity
            </CardTitle>
            <CardDescription>
              How you appear to players and other developers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Preview */}
            <div className="flex items-start gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center overflow-hidden border-2 border-border">
                  {formData.avatarUrl ? (
                    <img 
                      src={formData.avatarUrl} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Camera className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    placeholder="https://example.com/avatar.png"
                    value={formData.avatarUrl}
                    onChange={(e) => handleChange('avatarUrl', e.target.value)}
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a URL to your profile picture
                  </p>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="John Doe"
                value={formData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your public name shown on games and profiles
              </p>
            </div>

            {/* Username */}
            <div>
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="rounded-xl pl-8"
                  maxLength={30}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Unique handle for your profile (3-30 characters, letters, numbers, underscores)
              </p>
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell players about yourself or your studio..."
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                className="rounded-xl min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Studio/Brand Section */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Studio / Brand</CardTitle>
            <CardDescription>
              Optional studio or company information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="studioName">Studio Name</Label>
              <Input
                id="studioName"
                placeholder="Pixel Dreams Studio"
                value={formData.studioName}
                onChange={(e) => handleChange('studioName', e.target.value)}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-1">
                If set, this will be shown instead of your display name on games
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Links Section */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>
              Connect your social profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Website */}
            <div>
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://yourwebsite.com"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Twitter */}
            <div>
              <Label htmlFor="twitter" className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                Twitter / X
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="twitter"
                  placeholder="username"
                  value={formData.twitter}
                  onChange={(e) => handleChange('twitter', e.target.value.replace('@', ''))}
                  className="rounded-xl pl-8"
                />
              </div>
            </div>

            {/* Discord */}
            <div>
              <Label htmlFor="discord" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Discord
              </Label>
              <Input
                id="discord"
                placeholder="username#1234 or username"
                value={formData.discord}
                onChange={(e) => handleChange('discord', e.target.value)}
                className="rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500">
            Profile saved successfully!
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={saving}
            className="rounded-xl gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Account Info (Read-only) */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Email</span>
            <span>{profile?.email}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Member since</span>
            <span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
