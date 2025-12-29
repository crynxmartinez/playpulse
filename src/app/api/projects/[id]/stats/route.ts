import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const stats = await prisma.stat.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { name, description, minValue, maxValue, category, weight } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Stat name is required' }, { status: 400 })
    }

    const stat = await prisma.stat.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        minValue: minValue || 1,
        maxValue: maxValue || 10,
        category: category?.trim() || null,
        weight: weight || 1.0,
        projectId: id,
      }
    })

    return NextResponse.json({ stat }, { status: 201 })
  } catch (error) {
    console.error('Create stat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
