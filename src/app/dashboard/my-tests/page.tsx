'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Trophy, Star, Gamepad2, Clock, Sparkles, 
  ChevronRight, Award, Target, Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BADGES, getRarityColor, getRarityBgColor, type Badge as BadgeType } from '@/lib/badges'

interface TesterProfile {
  id: string
  xp: number
  level: number
  testsCompleted: number
  gamesHelped: number
  badges: string[]
  xpProgress: {
    current: number
    required: number
    percentage: number
  }
  earnedBadges: BadgeType[]
}

interface Test {
  id: string
  projectId: string
  projectName: string
  projectSlug: string | null
  projectLogo: string | null
  formTitle: string
  xpEarned: number
  createdAt: string
}

export default function MyTestsPage() {
  const [profile, setProfile] = useState<TesterProfile | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [profileRes, testsRes] = await Promise.all([
        fetch('/api/tester/profile'),
        fetch('/api/tester/tests'),
      ])

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setProfile(profileData.profile)
      }

      if (testsRes.ok) {
        const testsData = await testsRes.json()
        setTests(testsData.tests)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-bold text-white">My Level</div>
          <div className="text-sm text-muted-foreground">
            Track your playtesting contributions and earn rewards
          </div>
        </div>
        <Button className="rounded-2xl" asChild>
          <Link href="/dashboard/discover">
            <Gamepad2 className="mr-2 h-4 w-4" /> Find Games to Test
          </Link>
        </Button>
      </div>

      {/* Profile Stats */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Level Card */}
          <Card className="rounded-3xl border-[#1a1a2e] bg-gradient-to-br from-purple-600/20 to-indigo-600/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Trophy className="h-7 w-7 text-primary" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-white">{profile.level}</div>
                  <div className="text-xs text-muted-foreground">Level</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">XP Progress</span>
                  <span className="text-white">{profile.xpProgress.current} / {profile.xpProgress.required}</span>
                </div>
                <Progress value={profile.xpProgress.percentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* XP Card */}
          <Card className="rounded-3xl border-[#1a1a2e] bg-[#0d0d15]/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{profile.xp.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total XP</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tests Completed Card */}
          <Card className="rounded-3xl border-[#1a1a2e] bg-[#0d0d15]/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{profile.testsCompleted}</div>
                  <div className="text-sm text-muted-foreground">Tests Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Games Helped Card */}
          <Card className="rounded-3xl border-[#1a1a2e] bg-[#0d0d15]/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <Gamepad2 className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{profile.gamesHelped}</div>
                  <div className="text-sm text-muted-foreground">Games Helped</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Badges Section */}
      {profile && (
        <Card className="rounded-3xl border-[#1a1a2e] bg-[#0d0d15]/50">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Badges
            </CardTitle>
            <CardDescription>
              {profile.earnedBadges.length} of {BADGES.length} badges earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {BADGES.map(badge => {
                const isEarned = profile.badges.includes(badge.id)
                return (
                  <div
                    key={badge.id}
                    className={`relative p-4 rounded-2xl border text-center transition ${
                      isEarned
                        ? `${getRarityBgColor(badge.rarity)} border-transparent`
                        : 'bg-[#1a1a2e]/50 border-[#2a2a3e] opacity-40'
                    }`}
                  >
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <div className={`text-xs font-medium ${isEarned ? getRarityColor(badge.rarity) : 'text-slate-500'}`}>
                      {badge.name}
                    </div>
                    {isEarned && (
                      <Badge className="absolute -top-1 -right-1 rounded-full text-[10px] px-1.5 bg-primary border-0">
                        +{badge.xpReward}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Tests */}
      <Card className="rounded-3xl border-[#1a1a2e] bg-[#0d0d15]/50">
        <CardHeader>
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Tests
          </CardTitle>
          <CardDescription>
            Your playtest history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Gamepad2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Tests Yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Start playtesting games to earn XP and badges!
              </p>
              <Button className="rounded-2xl" asChild>
                <Link href="/dashboard/discover">
                  <Sparkles className="mr-2 h-4 w-4" /> Discover Games
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tests.slice(0, 10).map(test => (
                <Link
                  key={test.id}
                  href={test.projectSlug ? `/g/${test.projectSlug}` : `/game/${test.projectId}`}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-[#1a1a2e]/50 hover:bg-[#1a1a2e] transition group"
                >
                  {/* Game Logo */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#2a2a3e] flex-shrink-0">
                    {test.projectLogo ? (
                      <img src={test.projectLogo} alt={test.projectName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
                        <Gamepad2 className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white group-hover:text-primary transition truncate">
                      {test.projectName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {test.formTitle}
                    </div>
                  </div>

                  {/* XP & Date */}
                  <div className="text-right flex-shrink-0">
                    <Badge className="rounded-full bg-yellow-500/20 text-yellow-400 border-0 mb-1">
                      +{test.xpEarned} XP
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(test.createdAt)}
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
