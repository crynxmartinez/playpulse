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

    const { 
      title, 
      landingTitle,
      landingSubtitle,
      landingDescription,
      landingImage,
      ctaText,
      themeColor,
      questions 
    } = await request.json()

    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Form title is required' }, { status: 400 })
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'At least one question is required' }, { status: 400 })
    }

    const form = await prisma.form.create({
      data: {
        title: title.trim(),
        isActive: true,
        landingTitle: landingTitle?.trim() || null,
        landingSubtitle: landingSubtitle?.trim() || null,
        landingDescription: landingDescription?.trim() || null,
        landingImage: landingImage?.trim() || null,
        ctaText: ctaText?.trim() || 'Start Quiz',
        themeColor: themeColor || '#8b5cf6',
        projectId: id,
        questions: {
          create: questions.map((q: { 
            questionText: string
            type: string
            statId: string
            options: unknown[]
            minValue: number
            maxValue: number 
          }, index: number) => ({
            questionText: q.questionText.trim(),
            type: q.type,
            statId: q.statId || null,
            options: q.options && q.options.length > 0 ? q.options : null,
            minValue: q.minValue || 1,
            maxValue: q.maxValue || 10,
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
