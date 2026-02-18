import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { stripHtml } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  
  try {
    const project = await prisma.project.findFirst({
      where: {
        slug,
        visibility: { in: ['PUBLIC', 'UNLISTED'] }
      },
      select: {
        name: true,
        description: true,
        bannerUrl: true,
        logoUrl: true,
        genre: true,
        tags: true,
        user: {
          select: {
            studioName: true,
            displayName: true,
            username: true,
          }
        }
      }
    })

    if (!project) {
      return {
        title: 'Game Not Found | PatchPlay',
        description: 'This game does not exist or is private.',
      }
    }

    const developerName = project.user?.studioName || project.user?.displayName || project.user?.username || 'Developer'
    const description = stripHtml(project.description) || `${project.name} by ${developerName} on PatchPlay`
    const imageUrl = project.bannerUrl || project.logoUrl || '/og-default.png'

    return {
      title: `${project.name} | PatchPlay`,
      description,
      keywords: [project.genre, ...(project.tags || []), 'game', 'playtest', 'indie game'].filter(Boolean) as string[],
      authors: [{ name: developerName }],
      openGraph: {
        title: project.name,
        description,
        type: 'website',
        images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: project.name }] : [],
        siteName: 'PatchPlay',
      },
      twitter: {
        card: 'summary_large_image',
        title: project.name,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
    }
  } catch (error) {
    console.error('Failed to generate metadata:', error)
    return {
      title: 'PatchPlay',
      description: 'Discover and playtest indie games',
    }
  }
}

export default function GameLayout({ children }: LayoutProps) {
  return children
}
