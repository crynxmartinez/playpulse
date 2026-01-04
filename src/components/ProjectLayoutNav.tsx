'use client'

import { usePathname } from 'next/navigation'
import ProjectFormNav from './ProjectFormNav'
import ProjectNav from './ProjectNav'

interface ProjectLayoutNavProps {
  projectId: string
}

export default function ProjectLayoutNav({ projectId }: ProjectLayoutNavProps) {
  const pathname = usePathname()
  
  // Hide nav menus when on the public/game page editor
  const isGamePageView = pathname.includes('/public')
  
  if (isGamePageView) {
    return null
  }

  return (
    <>
      {/* Dashboard / Form Toggle */}
      <ProjectFormNav projectId={projectId} />

      {/* Horizontal Navigation */}
      <ProjectNav projectId={projectId} />
    </>
  )
}
