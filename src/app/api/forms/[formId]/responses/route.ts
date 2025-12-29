import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint - no auth required
export async function POST(
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
        questions: true
      }
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 })
    }

    const { answers, comment, respondent } = await request.json()

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Answers are required' }, { status: 400 })
    }

    // Create response with answers (supporting new answer format)
    const answerCreateData = Object.entries(answers).map(([questionId, answerData]) => {
      const data = answerData as { value?: number; textValue?: string; selectedIds?: number[] }
      return {
        question: { connect: { id: questionId } },
        value: data.value ?? null,
        textValue: data.textValue?.trim() || null,
        selectedIds: data.selectedIds && data.selectedIds.length > 0 ? data.selectedIds : undefined,
      }
    })

    const response = await prisma.response.create({
      data: {
        formId,
        comment: comment?.trim() || null,
        respondent: respondent?.trim() || null,
        answers: {
          create: answerCreateData
        }
      },
      include: {
        answers: {
          include: {
            question: {
              include: { stat: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ response }, { status: 201 })
  } catch (error) {
    console.error('Submit response error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
