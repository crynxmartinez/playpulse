import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; formId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, formId } = await params

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const form = await prisma.form.findFirst({
      where: { id: formId, projectId: id },
      include: {
        questions: {
          include: { stat: true },
          orderBy: { order: 'asc' }
        },
        _count: { select: { responses: true } }
      }
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json({ form })
  } catch (error) {
    console.error('Get form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; formId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, formId } = await params

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const existingForm = await prisma.form.findFirst({
      where: { id: formId, projectId: id }
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    const { title, description, isActive, statIds, slug } = await request.json()

    // If slug is provided, check for uniqueness
    if (slug !== undefined && slug !== null && slug !== '') {
      const existingSlug = await prisma.form.findFirst({
        where: { 
          slug: slug,
          id: { not: formId }
        }
      })
      if (existingSlug) {
        return NextResponse.json({ error: 'This URL slug is already in use' }, { status: 400 })
      }
    }

    // If statIds provided, update questions
    if (statIds !== undefined) {
      // Delete existing questions
      await prisma.question.deleteMany({
        where: { formId }
      })

      // Create new questions
      if (statIds.length > 0) {
        await prisma.question.createMany({
          data: statIds.map((statId: string, index: number) => ({
            formId,
            statId,
            order: index,
          }))
        })
      }
    }

    const form = await prisma.form.update({
      where: { id: formId },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
        ...(slug !== undefined && { slug: slug?.trim() || null }),
      },
      include: {
        questions: {
          include: { stat: true },
          orderBy: { order: 'asc' }
        },
        _count: { select: { responses: true } }
      }
    })

    return NextResponse.json({ form })
  } catch (error) {
    console.error('Update form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; formId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, formId } = await params

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const existingForm = await prisma.form.findFirst({
      where: { id: formId, projectId: id }
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    await prisma.form.delete({
      where: { id: formId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
