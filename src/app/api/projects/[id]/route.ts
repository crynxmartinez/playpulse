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
      // Game Hub fields
      slug,
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
    } = body

    const existingProject = await prisma.project.findFirst({
      where: { id, userId: user.id }
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Validate slug if provided
    if (slug !== undefined && slug !== null && slug !== '') {
      const slugRegex = /^[a-z0-9-]{3,50}$/
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          { error: 'Slug must be 3-50 characters, lowercase letters, numbers, and hyphens only' },
          { status: 400 }
        )
      }

      // Check uniqueness
      const existingSlug = await prisma.project.findUnique({
        where: { slug },
      })
      if (existingSlug && existingSlug.id !== id) {
        return NextResponse.json({ error: 'Slug already taken' }, { status: 400 })
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        // Game Hub fields
        ...(slug !== undefined && { slug: slug ? slug.toLowerCase() : null }),
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
