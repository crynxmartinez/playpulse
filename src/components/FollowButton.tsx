'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'

interface FollowButtonProps {
  projectId: string
  initialFollowing?: boolean
  initialCount?: number
  onFollowChange?: (following: boolean, count: number) => void
}

export function FollowButton({ 
  projectId, 
  initialFollowing = false, 
  initialCount = 0,
  onFollowChange 
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [followerCount, setFollowerCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch initial follow status on mount
  useEffect(() => {
    const fetchFollowStatus = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/follow`)
        if (res.ok) {
          const data = await res.json()
          setIsFollowing(data.following)
          setFollowerCount(data.followerCount)
        }
      } catch (error) {
        console.error('Error fetching follow status:', error)
      }
    }
    fetchFollowStatus()
  }, [projectId])

  const handleFollow = async () => {
    setIsLoading(true)
    try {
      const method = isFollowing ? 'DELETE' : 'POST'
      const res = await fetch(`/api/projects/${projectId}/follow`, { method })
      
      if (res.ok) {
        const data = await res.json()
        setIsFollowing(data.following)
        setFollowerCount(data.followerCount)
        onFollowChange?.(data.following, data.followerCount)
      } else {
        const error = await res.json()
        // If unauthorized, redirect to login
        if (res.status === 401) {
          window.location.href = '/login'
          return
        }
        console.error('Follow error:', error)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant={isFollowing ? "default" : "secondary"} 
      className="rounded-2xl gap-2"
      onClick={handleFollow}
      disabled={isLoading}
    >
      <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  )
}
