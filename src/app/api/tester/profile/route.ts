import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { calculateLevel, getXpProgress, checkNewBadges, BADGES } from '@/lib/badges'

// Cast prisma to any to avoid type errors before prisma generate runs
const db = prisma as any

// GET /api/tester/profile - Get current user's tester profile
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create tester profile
    let profile = await db.testerProfile.findUnique({
      where: { userId: user.id }
    })

    if (!profile) {
      profile = await db.testerProfile.create({
        data: { userId: user.id }
      })
    }

    const xpProgress = getXpProgress(profile.xp, profile.level)
    const earnedBadges = (profile.badges as string[]) || []

    return NextResponse.json({
      profile: {
        ...profile,
        xpProgress,
        earnedBadges: earnedBadges.map(id => BADGES.find(b => b.id === id)).filter(Boolean),
      }
    })
  } catch (error) {
    console.error('Failed to fetch tester profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// POST /api/tester/profile - Record a completed test and award XP
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { responseId, projectId } = body

    if (!responseId || !projectId) {
      return NextResponse.json({ error: 'Missing responseId or projectId' }, { status: 400 })
    }

    // Check if this response already has a test session
    const existingSession = await db.testSession.findUnique({
      where: { responseId }
    })

    if (existingSession) {
      return NextResponse.json({ error: 'Test already recorded' }, { status: 400 })
    }

    // Get or create tester profile
    let profile = await db.testerProfile.findUnique({
      where: { userId: user.id }
    })

    if (!profile) {
      profile = await db.testerProfile.create({
        data: { userId: user.id }
      })
    }

    // Check if this is a new game for the user
    const existingGameTest = await db.testSession.findFirst({
      where: { userId: user.id, projectId }
    })
    const isNewGame = !existingGameTest

    // Base XP for completing a test
    const baseXp = 10
    let bonusXp = 0

    // Bonus XP for testing a new game
    if (isNewGame) {
      bonusXp += 5
    }

    const totalXp = baseXp + bonusXp

    // Create test session
    await db.testSession.create({
      data: {
        userId: user.id,
        responseId,
        projectId,
        xpEarned: totalXp,
      }
    })

    // Update profile stats
    const newXp = profile.xp + totalXp
    const newTestsCompleted = profile.testsCompleted + 1
    const newGamesHelped = isNewGame ? profile.gamesHelped + 1 : profile.gamesHelped
    const newLevel = calculateLevel(newXp)

    // Check for new badges
    const earnedBadges = (profile.badges as string[]) || []
    const newBadges = checkNewBadges(earnedBadges, newTestsCompleted, newGamesHelped, newXp)
    
    // Add badge XP rewards
    let badgeXp = 0
    for (const badge of newBadges) {
      badgeXp += badge.xpReward
      earnedBadges.push(badge.id)
    }

    const finalXp = newXp + badgeXp
    const finalLevel = calculateLevel(finalXp)

    // Update profile
    const updatedProfile = await db.testerProfile.update({
      where: { userId: user.id },
      data: {
        xp: finalXp,
        level: finalLevel,
        testsCompleted: newTestsCompleted,
        gamesHelped: newGamesHelped,
        badges: earnedBadges,
      }
    })

    const xpProgress = getXpProgress(finalXp, finalLevel)

    return NextResponse.json({
      success: true,
      xpEarned: totalXp + badgeXp,
      newBadges,
      levelUp: finalLevel > profile.level,
      profile: {
        ...updatedProfile,
        xpProgress,
      }
    })
  } catch (error) {
    console.error('Failed to record test:', error)
    return NextResponse.json({ error: 'Failed to record test' }, { status: 500 })
  }
}
