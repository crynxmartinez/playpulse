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
      where: { 
        id,
        userId: user.id 
      },
      include: {
        stats: true,
        forms: {
          include: {
            _count: {
              select: { responses: true }
            }
          }
        },
        _count: {
          select: {
            forms: true,
            stats: true,
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { 
      name, 
      description,
      // Game Hub fields (slug is auto-generated from name)
      visibility,
      bannerUrl,
      logoUrl,
      genre,
      tags,
      steamUrl,
      itchUrl,
      websiteUrl,
      discordUrl,
      // Score tier fields
      tierLowMax,
      tierMediumMax,
      tierLowLabel,
      tierMediumLabel,
      tierHighLabel,
      tierLowMsg,
      tierMediumMsg,
      tierHighMsg,
      // Game profile content
      rules,
      features,
    } = body

    const existingProject = await prisma.project.findFirst({
      where: { id, userId: user.id }
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Auto-generate slug from name if name is being updated
    let newSlug = existingProject.slug
    if (name && name.trim() !== existingProject.name) {
      const baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      newSlug = baseSlug
      let counter = 1
      while (true) {
        const existing = await prisma.project.findFirst({ where: { slug: newSlug } })
        if (!existing || existing.id === id) break
        newSlug = `${baseSlug}-${counter}`
        counter++
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name: name.trim(), slug: newSlug }),
        ...(description !== undefined && { description: description?.trim() || null }),
        // Game Hub fields (slug is now auto-generated from name)
        ...(visibility !== undefined && { visibility }),
        ...(bannerUrl !== undefined && { bannerUrl: bannerUrl?.trim() || null }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl?.trim() || null }),
        ...(genre !== undefined && { genre: genre?.trim() || null }),
        ...(tags !== undefined && { tags }),
        ...(steamUrl !== undefined && { steamUrl: steamUrl?.trim() || null }),
        ...(itchUrl !== undefined && { itchUrl: itchUrl?.trim() || null }),
        ...(websiteUrl !== undefined && { websiteUrl: websiteUrl?.trim() || null }),
        ...(discordUrl !== undefined && { discordUrl: discordUrl?.trim() || null }),
        // Score tier fields
        ...(tierLowMax !== undefined && { tierLowMax }),
        ...(tierMediumMax !== undefined && { tierMediumMax }),
        ...(tierLowLabel !== undefined && { tierLowLabel }),
        ...(tierMediumLabel !== undefined && { tierMediumLabel }),
        ...(tierHighLabel !== undefined && { tierHighLabel }),
        ...(tierLowMsg !== undefined && { tierLowMsg: tierLowMsg?.trim() || null }),
        ...(tierMediumMsg !== undefined && { tierMediumMsg: tierMediumMsg?.trim() || null }),
        ...(tierHighMsg !== undefined && { tierHighMsg: tierHighMsg?.trim() || null }),
        // Game profile content
        ...(rules !== undefined && { rules: rules?.trim() || null }),
        ...(features !== undefined && { features }),
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Update project error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingProject = await prisma.project.findFirst({
      where: { id, userId: user.id }
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await prisma.project.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
