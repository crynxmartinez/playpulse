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

    const responses = await prisma.response.findMany({
      where: { 
        form: { projectId: id }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        comment: true,
        respondent: true,
        respondentEmail: true,
        createdAt: true,
        form: {
          select: { id: true, title: true }
        },
        answers: {
          select: {
            id: true,
            value: true,
            textValue: true,
            question: {
              select: {
                questionText: true,
                type: true,
                stat: {
                  select: { name: true, minValue: true, maxValue: true }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ responses })
  } catch (error) {
    console.error('Get responses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
