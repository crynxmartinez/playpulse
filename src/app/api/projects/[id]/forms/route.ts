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

    const forms = await prisma.form.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        questions: {
          include: { stat: true },
          orderBy: { order: 'asc' }
        },
        _count: { select: { responses: true } }
      }
    })

    return NextResponse.json({ forms })
  } catch (error) {
    console.error('Get forms error:', error)
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

    const { title, description, statIds } = await request.json()

    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Form title is required' }, { status: 400 })
    }

    if (!statIds || statIds.length === 0) {
      return NextResponse.json({ error: 'At least one stat is required' }, { status: 400 })
    }

    const form = await prisma.form.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        projectId: id,
        questions: {
          create: statIds.map((statId: string, index: number) => ({
            statId,
            order: index,
          }))
        }
      },
      include: {
        questions: {
          include: { stat: true },
          orderBy: { order: 'asc' }
        },
        _count: { select: { responses: true } }
      }
    })

    return NextResponse.json({ form }, { status: 201 })
  } catch (error) {
    console.error('Create form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
