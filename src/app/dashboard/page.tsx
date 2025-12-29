import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Gamepad2, Plus, BarChart3, FileText } from 'lucide-react'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  const projects = await prisma.project.findMany({
    where: { userId: user?.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      _count: {
        select: {
          forms: true,
          stats: true,
        }
      }
    }
  })

  const totalProjects = await prisma.project.count({
    where: { userId: user?.id }
  })

  const totalForms = await prisma.form.count({
    where: { project: { userId: user?.id } }
  })

  const totalResponses = await prisma.response.count({
    where: { form: { project: { userId: user?.id } } }
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-slate-500 mt-1">Here&apos;s an overview of your game feedback platform.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Projects</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalProjects}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Gamepad2 className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Forms</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalForms}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <FileText className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Responses</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalResponses}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <BarChart3 className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Recent Projects</h2>
          <Link 
            href="/dashboard" 
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            View all
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <Gamepad2 className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-slate-700 mb-2">No projects yet</h3>
            <p className="text-slate-500 mb-4">Create your first project to start collecting game feedback.</p>
            <p className="text-sm text-slate-400">Click the + button in the sidebar to create a project.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Gamepad2 className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{project.name}</p>
                    <p className="text-sm text-slate-500">
                      {project._count.stats} stats · {project._count.forms} forms
                    </p>
                  </div>
                </div>
                <div className="text-slate-400">
                  <Plus size={20} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
