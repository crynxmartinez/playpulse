import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import { truncateText } from '@/lib/utils'
import PublicUpdatePageClient from '@/components/PublicUpdatePageClient'

interface PageProps {
  params: Promise<{ projectId: string; versionId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { projectId, versionId } = await params

  const version = await prisma.projectVersion.findFirst({
    where: { id: versionId, projectId },
    include: {
      project: { select: { name: true, bannerUrl: true, logoUrl: true, slug: true } },
    },
  })

  if (!version || !version.isPublished) return { title: 'Update Not Found | PlayPulse' }

  const title = `${version.title} — ${version.project.name} | PlayPulse`
  const description = truncateText(version.description, 160) || `Version ${version.version} update for ${version.project.name} on PlayPulse.`
  const image = version.project.bannerUrl || version.project.logoUrl || null

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'PlayPulse',
      ...(image && { images: [{ url: image, width: 1200, height: 630, alt: version.project.name }] }),
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
  const { projectId, versionId } = await params

  const version = await prisma.projectVersion.findFirst({
    where: { id: versionId, projectId },
    include: {
      project: { select: { id: true, name: true, slug: true } },
    },
  })

  if (!version) notFound()

  const page = await prisma.versionPage.findUnique({ where: { versionId } })

  return (
    <PublicUpdatePageClient
      projectId={projectId}
      versionId={versionId}
      initialVersion={{
        id: version.id,
        version: version.version,
        title: version.title,
        description: version.description,
        isPublished: version.isPublished,
      }}
      initialProject={{
        id: version.project.id,
        name: version.project.name,
        slug: version.project.slug,
      }}
      initialContent={page ? (page.content as { rows: [] }) : { rows: [] }}
    />
  )
}
