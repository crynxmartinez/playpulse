import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProjectNav from '@/components/ProjectNav'

interface ProjectLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
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
  })

  if (!project) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Project Header */}
      <div className="rounded-3xl border bg-card p-4 mb-4">
        <h1 className="text-xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
        )}
      </div>

      {/* Horizontal Navigation */}
      <ProjectNav projectId={id} />

      {/* Page Content */}
      <div className="flex-1 mt-4">
        {children}
      </div>
    </div>
  )
}
