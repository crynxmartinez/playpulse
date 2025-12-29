import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; statId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, statId } = await params

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const existingStat = await prisma.stat.findFirst({
      where: { id: statId, projectId: id }
    })

    if (!existingStat) {
      return NextResponse.json({ error: 'Stat not found' }, { status: 404 })
    }

    const { name, description, minValue, maxValue, category, weight } = await request.json()

    const stat = await prisma.stat.update({
      where: { id: statId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(minValue !== undefined && { minValue }),
        ...(maxValue !== undefined && { maxValue }),
        ...(category !== undefined && { category: category?.trim() || null }),
        ...(weight !== undefined && { weight }),
      }
    })

    return NextResponse.json({ stat })
  } catch (error) {
    console.error('Update stat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; statId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, statId } = await params

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const existingStat = await prisma.stat.findFirst({
      where: { id: statId, projectId: id }
    })

    if (!existingStat) {
      return NextResponse.json({ error: 'Stat not found' }, { status: 404 })
    }

    await prisma.stat.delete({
      where: { id: statId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete stat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
