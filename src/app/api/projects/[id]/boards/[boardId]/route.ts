import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/projects/[id]/boards/[boardId] - Get a specific board
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; boardId: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id: projectId, boardId } = await params

    const board = await prisma.progressBoard.findFirst({
      where: { id: boardId, projectId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            userId: true,
            stats: true,
            forms: {
              include: {
                responses: {
                  include: { answers: true },
                  orderBy: { createdAt: 'desc' }
                }
              }
            }
          }
        }
      }
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Check access - owner can always see, others need public/unlisted visibility
    const isOwner = user?.id === board.project.userId
    if (!isOwner && board.visibility === 'PRIVATE') {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    return NextResponse.json({ board, isOwner })
  } catch (error) {
    console.error('Failed to fetch board:', error)
    return NextResponse.json({ error: 'Failed to fetch board' }, { status: 500 })
  }
}

// PATCH /api/projects/[id]/boards/[boardId] - Update a board
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; boardId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, boardId } = await params
    const body = await request.json()

    // Verify ownership
    const existingBoard = await prisma.progressBoard.findFirst({
      where: { id: boardId, projectId },
      include: { project: { select: { userId: true } } }
    })

    if (!existingBoard || existingBoard.project.userId !== user.id) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    const board = await prisma.progressBoard.update({
      where: { id: boardId },
      data: {
        name: body.name,
        visibility: body.visibility,
        columns: body.columns,
        showTrend: body.showTrend,
        showTable: body.showTable,
      }
    })

    return NextResponse.json({ board })
  } catch (error) {
    console.error('Failed to update board:', error)
    return NextResponse.json({ error: 'Failed to update board' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/boards/[boardId] - Delete a board
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; boardId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, boardId } = await params

    // Verify ownership
    const existingBoard = await prisma.progressBoard.findFirst({
      where: { id: boardId, projectId },
      include: { project: { select: { userId: true } } }
    })

    if (!existingBoard || existingBoard.project.userId !== user.id) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    await prisma.progressBoard.delete({
      where: { id: boardId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete board:', error)
    return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 })
  }
}
