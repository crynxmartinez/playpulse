import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import GamePageView from '@/components/GamePageView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GamePage({ params }: PageProps) {
  const user = await getCurrentUser()
  const { id } = await params

  // First try to find the project
  const project = await prisma.project.findFirst({
    where: { 
      id,
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
      _count: {
        select: {
          followers: true
        }
      }
    }
  })

  if (!project) {
    // If not found and user is not logged in, redirect to login
    // If logged in but project not found, redirect to dashboard
    redirect(user ? '/dashboard' : '/login')
  }

  // Determine if current user is the owner
  const isOwner = user?.id === project.userId

  return <GamePageView project={project} user={user} isOwner={isOwner} />
}
