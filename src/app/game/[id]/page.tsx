import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import GamePageView from '@/components/GamePageView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GamePage({ params }: PageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params

  const project = await prisma.project.findFirst({
    where: { 
      id,
      userId: user.id 
    },
    select: {
      id: true,
      name: true,
      slug: true,
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
      }
    }
  })

  if (!project) {
    redirect('/dashboard')
  }

  return <GamePageView project={project} user={user} />
}
