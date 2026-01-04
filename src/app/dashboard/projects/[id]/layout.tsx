import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProjectNav from '@/components/ProjectNav'
import ProjectHeader from '@/components/ProjectHeader'
import ProjectFormNav from '@/components/ProjectFormNav'

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

  return (
    <div className="flex flex-col h-full">
      {/* Project Header with Public View Toggle */}
      <ProjectHeader project={project} />

      {/* Dashboard / Form Toggle */}
      <ProjectFormNav projectId={id} />

      {/* Horizontal Navigation */}
      <ProjectNav projectId={id} />

      {/* Page Content */}
      <div className="flex-1 mt-4">
        {children}
      </div>
    </div>
  )
}
