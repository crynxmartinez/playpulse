import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BarChart2, FileText, MessageSquare, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatPill } from '@/components/ui/stat-pill'

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
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill label="Stats" value={String(project._count.stats)} />
        <StatPill label="Campaigns" value={String(project._count.forms)} />
        <StatPill label="Responses" value={String(totalResponses)} />
        <StatPill label="Active" value={String(project.forms.filter(f => f.isActive).length)} hint="campaigns" />
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Stats */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart2 className="h-4 w-4" /> Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.stats.length === 0 ? (
              <p className="text-muted-foreground text-sm">No stats created yet. Go to Stats tab to create some.</p>
            ) : (
              <div className="space-y-2">
                {project.stats.slice(0, 5).map((stat) => (
                  <div key={stat.id} className="flex items-center justify-between p-3 rounded-2xl border bg-background/60">
                    <span className="font-medium">{stat.name}</span>
                    <Badge variant="outline" className="rounded-full">{stat.minValue} - {stat.maxValue}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Campaigns */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" /> Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.forms.length === 0 ? (
              <p className="text-muted-foreground text-sm">No campaigns created yet. Go to Campaigns tab to create some.</p>
            ) : (
              <div className="space-y-2">
                {project.forms.slice(0, 5).map((form) => (
                  <Link
                    key={form.id}
                    href={`/dashboard/projects/${id}/forms`}
                    className="flex items-center justify-between p-3 rounded-2xl border bg-background/60 hover:bg-muted/50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{form.title}</span>
                      <Badge 
                        variant={form.isActive ? "default" : "secondary"} 
                        className="rounded-full"
                      >
                        {form.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{form._count.responses} responses</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
