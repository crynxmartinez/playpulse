import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Cast to any to avoid type errors before prisma generate runs
const db = prisma as any

// Generate a URL-friendly slug from version and title
function generateVersionSlug(version: string, title: string): string {
  const combined = `${version}-${title}`
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

// POST /api/admin/backfill-version-slugs - Backfill slugs for all versions without slugs
export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all versions without slugs for this user's projects
    const versionsWithoutSlugs = await db.projectVersion.findMany({
      where: {
        slug: null,
        project: { userId: user.id }
      },
      include: {
        project: { select: { id: true, name: true } }
      }
    })

    if (versionsWithoutSlugs.length === 0) {
      return NextResponse.json({ 
        message: 'No versions need slug backfill',
        updated: 0 
      })
    }

    let updated = 0
    const results: Array<{ id: string; version: string; slug: string }> = []

    for (const version of versionsWithoutSlugs) {
      // Generate base slug
      const baseSlug = generateVersionSlug(version.version, version.title)
      let slug = baseSlug
      let counter = 1

      // Ensure unique slug within project
      while (true) {
        const existing = await db.projectVersion.findFirst({
          where: { 
            projectId: version.projectId, 
            slug,
            id: { not: version.id }
          },
        })
        if (!existing) break
        slug = `${baseSlug}-${counter}`
        counter++
      }

      // Update the version with the new slug
      await db.projectVersion.update({
        where: { id: version.id },
        data: { slug }
      })

      updated++
      results.push({
        id: version.id,
        version: version.version,
        slug
      })
    }

    return NextResponse.json({ 
      message: `Successfully backfilled ${updated} version slugs`,
      updated,
      results
    })
  } catch (error) {
    console.error('Failed to backfill version slugs:', error)
    return NextResponse.json({ error: 'Failed to backfill slugs' }, { status: 500 })
  }
}
