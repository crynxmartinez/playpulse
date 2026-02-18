import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import GamePageView from '@/components/GamePageView'
import type { Metadata } from 'next'
import { stripHtml, truncateText } from '@/lib/utils'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  const project = await prisma.project.findFirst({
    where: { slug, OR: [{ visibility: 'PUBLIC' }, { visibility: 'UNLISTED' }] },
    select: {
      name: true,
      subtitle: true,
      description: true,
      bannerUrl: true,
      logoUrl: true,
      genre: true,
      tags: true,
      user: { select: { displayName: true, username: true, studioName: true } },
    },
  })

  if (!project) return { title: 'Game Not Found | PlayPulse' }

  const developerName = project.user?.studioName || project.user?.displayName || project.user?.username || 'Unknown Developer'
  const title = `${project.name} | PlayPulse`
  const description = truncateText(project.description, 160) || `${project.name} by ${developerName} on PlayPulse.`
  const image = project.bannerUrl || project.logoUrl || null

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
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

export default async function GameBySlugPage({ params }: PageProps) {
  const user = await getCurrentUser()
  const { slug } = await params

  // Find project by slug
  const project = await prisma.project.findFirst({
    where: { 
      slug,
      OR: [
        // Owner can always see their project
        ...(user ? [{ userId: user.id }] : []),
        // Anyone can see PUBLIC projects
        { visibility: 'PUBLIC' },
        // Anyone with the link can see UNLISTED projects
        { visibility: 'UNLISTED' },
      ]
    },
    select: {
      id: true,
      userId: true,
      name: true,
      slug: true,
      subtitle: true,
      description: true,
      visibility: true,
      bannerUrl: true,
      logoUrl: true,
      genre: true,
      tags: true,
      steamUrl: true,
      itchUrl: true,
      websiteUrl: true,
      discordUrl: true,
      rules: true,
      rulesPdfUrl: true,
      features: true,
      user: {
        select: {
          displayName: true,
          username: true,
          studioName: true,
        }
      },
      versions: {
        select: {
          id: true,
          version: true,
          title: true,
          description: true,
          isPublished: true,
          publishedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
      },
      forms: {
        select: {
          id: true,
          title: true,
          slug: true,
          isActive: true,
          _count: {
            select: {
              responses: true,
            }
          }
        }
      },
      pinnedSections: {
        select: {
          id: true,
          type: true,
          title: true,
          order: true,
          widgetType: true,
          widgetConfig: true,
          snapshot: {
            select: {
              id: true,
              name: true,
              type: true,
              imageData: true,
            }
          }
        },
        orderBy: { order: 'asc' }
      },
      galleryImages: {
        select: {
          id: true,
          imageUrl: true,
          order: true,
        },
        orderBy: { order: 'asc' }
      },
    }
  })

  if (!project) {
    notFound()
  }

  // Determine if current user is the owner
  const isOwner = user?.id === project.userId

  return <GamePageView project={project} user={user} isOwner={isOwner} />
}
