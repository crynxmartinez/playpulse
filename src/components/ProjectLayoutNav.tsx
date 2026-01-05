import ProjectFormNav from './ProjectFormNav'
import ProjectNav from './ProjectNav'

interface ProjectLayoutNavProps {
  projectId: string
}

export default function ProjectLayoutNav({ projectId }: ProjectLayoutNavProps) {
  return (
    <>
      {/* Overview / Form Toggle */}
      <ProjectFormNav projectId={projectId} />

      {/* Horizontal Navigation */}
      <ProjectNav projectId={projectId} />
    </>
  )
}
