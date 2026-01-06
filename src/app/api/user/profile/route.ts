import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/user/profile - Get current user's profile
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        studioName: true,
        website: true,
        twitter: true,
        discord: true,
        createdAt: true,
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// PUT /api/user/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      displayName, 
      username, 
      bio, 
      avatarUrl, 
      studioName, 
      website, 
      twitter, 
      discord 
    } = body

    // Validate username if provided
    if (username !== undefined && username !== null) {
      // Username must be alphanumeric with underscores, 3-30 chars
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
      if (username && !usernameRegex.test(username)) {
        return NextResponse.json({ 
          error: 'Username must be 3-30 characters, alphanumeric and underscores only' 
        }, { status: 400 })
      }

      // Check if username is already taken by another user
      if (username) {
        const existingUser = await prisma.user.findFirst({
          where: { 
            username: username.toLowerCase(),
            NOT: { id: user.id }
          }
        })
        if (existingUser) {
          return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
        }
      }
    }

    // Update profile
    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: displayName ?? undefined,
        username: username ? username.toLowerCase() : undefined,
        bio: bio ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
        studioName: studioName ?? undefined,
        website: website ?? undefined,
        twitter: twitter ?? undefined,
        discord: discord ?? undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        studioName: true,
        website: true,
        twitter: true,
        discord: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    console.error('Failed to update profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
