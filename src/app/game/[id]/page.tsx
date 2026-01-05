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
    }
  })

  if (!project) {
    redirect('/dashboard')
  }

  return <GamePageView project={project} user={user} />
}
