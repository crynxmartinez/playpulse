import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint - no auth required
export async function GET(
  request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params

    const form = await prisma.form.findFirst({
      where: { 
        id: formId,
        isActive: true 
      },
      include: {
        project: {
          select: { 
            name: true,
            tierLowMax: true,
            tierMediumMax: true,
            tierLowLabel: true,
            tierMediumLabel: true,
            tierHighLabel: true,
            tierLowMsg: true,
            tierMediumMsg: true,
            tierHighMsg: true,
          }
        },
        questions: {
          include: { 
            stat: {
              select: {
                id: true,
                name: true,
                description: true,
                minValue: true,
                maxValue: true,
                category: true,
                weight: true,
              }
            } 
          },
          orderBy: { order: 'asc' }
        },
      }
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 })
    }

    return NextResponse.json({ form })
  } catch (error) {
    console.error('Get public form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
