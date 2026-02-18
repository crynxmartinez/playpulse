import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/games - Get all games (admin only)
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const games = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        visibility: true,
        genre: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            displayName: true,
          }
        },
        _count: {
          select: {
            forms: true,
            versions: true,
            followers: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ games })
  } catch (error) {
    console.error('Failed to fetch games:', error)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}

// PATCH /api/admin/games - Update game (admin only)
export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { gameId, visibility } = await request.json()

    if (!gameId) {
      return NextResponse.json({ error: 'Game ID required' }, { status: 400 })
    }

    const updateData: any = {}
    if (visibility && ['PRIVATE', 'UNLISTED', 'PUBLIC'].includes(visibility)) {
      updateData.visibility = visibility
    }

    const game = await prisma.project.update({
      where: { id: gameId },
      data: updateData,
      select: {
        id: true,
        name: true,
        visibility: true,
      }
    })

    return NextResponse.json({ game })
  } catch (error) {
    console.error('Failed to update game:', error)
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 })
  }
}
