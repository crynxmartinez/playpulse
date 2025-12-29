import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BarChart2, FileText, MessageSquare, TrendingUp } from 'lucide-react'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectOverviewPage({ params }: ProjectPageProps) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
    include: {
      stats: true,
      forms: {
        include: {
          _count: { select: { responses: true } }
        }
      },
      _count: {
        select: { stats: true, forms: true }
      }
    }
  })

  if (!project) redirect('/dashboard')

  const totalResponses = project.forms.reduce(
    (acc, form) => acc + form._count.responses, 
    0
  )

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Overview</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <BarChart2 className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{project._count.stats}</p>
              <p className="text-sm text-slate-500">Stats</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{project._count.forms}</p>
              <p className="text-sm text-slate-500">Forms</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <MessageSquare className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalResponses}</p>
              <p className="text-sm text-slate-500">Responses</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <TrendingUp className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {project.forms.filter(f => f.isActive).length}
              </p>
              <p className="text-sm text-slate-500">Active Forms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Stats</h3>
          {project.stats.length === 0 ? (
            <p className="text-slate-500 text-sm">No stats created yet. Go to Stats tab to create some.</p>
          ) : (
            <div className="space-y-3">
              {project.stats.slice(0, 5).map((stat) => (
                <div key={stat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">{stat.name}</span>
                  <span className="text-sm text-slate-500">{stat.minValue} - {stat.maxValue}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Forms */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Forms</h3>
          {project.forms.length === 0 ? (
            <p className="text-slate-500 text-sm">No forms created yet. Go to Forms tab to create some.</p>
          ) : (
            <div className="space-y-3">
              {project.forms.slice(0, 5).map((form) => (
                <div key={form.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <span className="font-medium text-slate-700">{form.title}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      form.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <span className="text-sm text-slate-500">{form._count.responses} responses</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
