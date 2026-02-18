import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/reports - Get platform stats (admin only)
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get counts
    const [
      totalUsers,
      verifiedUsers,
      totalGames,
      publicGames,
      totalForms,
      totalResponses,
    ] = await Promise.all([
      prisma.user.count(),
      (prisma as any).user.count({ where: { emailVerified: true } }),
      prisma.project.count(),
      prisma.project.count({ where: { visibility: 'PUBLIC' } }),
      prisma.form.count(),
      prisma.response.count(),
    ])

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentSignups = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    })

    // Get recent games (last 7 days)
    const recentGames = await prisma.project.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    })

    // Get recent responses (last 7 days)
    const recentResponses = await prisma.response.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    })

    // Get top games by responses
    const topGames = await prisma.project.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        visibility: true,
        user: { select: { displayName: true, name: true } },
        _count: { select: { forms: true } }
      },
      orderBy: {
        forms: { _count: 'desc' }
      }
    })

    return NextResponse.json({
      stats: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        totalGames,
        publicGames,
        privateGames: totalGames - publicGames,
        totalForms,
        totalResponses,
        recentSignups,
        recentGames,
        recentResponses,
      },
      topGames,
    })
  } catch (error) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
