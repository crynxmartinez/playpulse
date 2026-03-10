import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ForumThreadView from '@/components/ForumThreadView'

interface PageProps {
  params: Promise<{ slug: string; threadId: string }>
}

export default async function ForumThreadPage({ params }: PageProps) {
  const user = await getCurrentUser()
  const { slug, threadId } = await params

  // Find project by slug
  const project = await prisma.project.findFirst({
    where: { 
      slug,
      OR: [
        ...(user ? [{ userId: user.id }] : []),
        { visibility: 'PUBLIC' },
        { visibility: 'UNLISTED' },
      ]
    },
    select: {
      id: true,
      userId: true,
      name: true,
      slug: true,
    }
  })

  if (!project) {
    notFound()
  }

  // Fetch thread with replies
  const thread = await prisma.forumThread.findFirst({
    where: { 
      id: threadId,
      projectId: project.id,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      replies: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!thread) {
    notFound()
  }

  const isOwner = user?.id === project.userId

  // Serialize dates for client component
  const serializedThread = {
    ...thread,
    createdAt: thread.createdAt.toISOString(),
    replies: thread.replies.map((reply) => ({
      ...reply,
      createdAt: reply.createdAt.toISOString(),
    })),
  }

  return (
    <ForumThreadView 
      project={project}
      thread={serializedThread}
      user={user}
      isOwner={isOwner}
    />
  )
}
