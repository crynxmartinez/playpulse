import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import { truncateText } from '@/lib/utils'
import PublicUpdatePageClient from '@/components/PublicUpdatePageClient'

// Cast to any to avoid type errors before prisma generate runs
const db = prisma as any

interface PageProps {
  params: Promise<{ gameSlug: string; versionSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { gameSlug, versionSlug } = await params

  // Find project by slug
  const project = await prisma.project.findFirst({
    where: { slug: gameSlug },
    select: { id: true, name: true, bannerUrl: true, logoUrl: true, slug: true },
  })

  if (!project) return { title: 'Update Not Found | PlayPulse' }

  // Find version by slug or ID (fallback for old links)
  const version = await db.projectVersion.findFirst({
    where: {
      projectId: project.id,
      OR: [
        { slug: versionSlug },
        { id: versionSlug },
      ],
    },
  })

  if (!version || !version.isPublished) return { title: 'Update Not Found | PlayPulse' }

  const title = `${version.title} — ${project.name} | PlayPulse`
  const description = truncateText(version.description, 160) || `Version ${version.version} update for ${project.name} on PlayPulse.`
  const image = project.bannerUrl || project.logoUrl || null

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'PlayPulse',
      ...(image && { images: [{ url: image, width: 1200, height: 630, alt: project.name }] }),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image && { images: [image] }),
    },
    robots: { index: true, follow: true },
  }
}

export default async function PublicUpdatePage({ params }: PageProps) {
  const { gameSlug, versionSlug } = await params

  // Find project by slug
  const project = await prisma.project.findFirst({
    where: { slug: gameSlug },
    select: { id: true, name: true, slug: true },
  })

  if (!project) notFound()

  // Find version by slug or ID (fallback for old links)
  const version = await db.projectVersion.findFirst({
    where: {
      projectId: project.id,
      OR: [
        { slug: versionSlug },
        { id: versionSlug },
      ],
    },
  })

  if (!version) notFound()

  const page = await prisma.versionPage.findUnique({ where: { versionId: version.id } })

  return (
    <PublicUpdatePageClient
      projectId={project.id}
      versionId={version.id}
      initialVersion={{
        id: version.id,
        version: version.version,
        title: version.title,
        description: version.description,
        isPublished: version.isPublished,
      }}
      initialProject={{
        id: project.id,
        name: project.name,
        slug: project.slug,
      }}
      initialContent={page ? (page.content as { rows: [] }) : { rows: [] }}
    />
  )
}
