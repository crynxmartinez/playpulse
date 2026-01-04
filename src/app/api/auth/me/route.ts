import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fullUser = await prisma.user.findUnique({
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
    },
  })

  return NextResponse.json({ user: fullUser })
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, username, displayName, bio, avatarUrl, studioName, website, twitter, discord } = body

  // Validate username if provided
  if (username !== undefined && username !== null && username !== '') {
    // Check format: alphanumeric and underscores only, 3-20 chars
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters, alphanumeric and underscores only' },
        { status: 400 }
      )
    }

    // Check uniqueness
    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    })
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: name !== undefined ? name : undefined,
      username: username !== undefined ? (username ? username.toLowerCase() : null) : undefined,
      displayName: displayName !== undefined ? displayName : undefined,
      bio: bio !== undefined ? bio : undefined,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      studioName: studioName !== undefined ? studioName : undefined,
      website: website !== undefined ? website : undefined,
      twitter: twitter !== undefined ? twitter : undefined,
      discord: discord !== undefined ? discord : undefined,
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
    },
  })

  return NextResponse.json({ user: updatedUser })
}
