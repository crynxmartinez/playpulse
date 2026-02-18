import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/tester/tests - Get user's test history
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const testSessions = await (prisma as any).testSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        response: {
          include: {
            form: {
              select: {
                id: true,
                title: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    logoUrl: true,
                    bannerUrl: true,
                    user: {
                      select: {
                        displayName: true,
                        username: true,
                        studioName: true,
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    // Group by project
    const projectMap = new Map<string, {
      project: any
      tests: any[]
      totalXp: number
    }>()

    for (const session of testSessions) {
      const project = session.response.form.project
      if (!projectMap.has(project.id)) {
        projectMap.set(project.id, {
          project,
          tests: [],
          totalXp: 0,
        })
      }
      const entry = projectMap.get(project.id)!
      entry.tests.push({
        id: session.id,
        formTitle: session.response.form.title,
        xpEarned: session.xpEarned,
        createdAt: session.createdAt,
      })
      entry.totalXp += session.xpEarned
    }

    return NextResponse.json({
      tests: testSessions.map((s: any) => ({
        id: s.id,
        projectId: s.projectId,
        projectName: s.response.form.project.name,
        projectSlug: s.response.form.project.slug,
        projectLogo: s.response.form.project.logoUrl,
        formTitle: s.response.form.title,
        xpEarned: s.xpEarned,
        createdAt: s.createdAt,
      })),
      byProject: Array.from(projectMap.values()),
      totalTests: testSessions.length,
      totalXp: testSessions.reduce((sum: number, s: any) => sum + s.xpEarned, 0),
    })
  } catch (error) {
    console.error('Failed to fetch tests:', error)
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 })
  }
}
