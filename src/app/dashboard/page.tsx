import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Camera, BarChart3, Link as LinkIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  // Fetch real data
  const games = await prisma.project.findMany({
    where: { userId: user?.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          forms: true,
          stats: true,
        }
      }
    }
  })

  const totalGames = games.length

  const totalResponses = await prisma.response.count({
    where: { form: { project: { userId: user?.id } } }
  })

  // Get responses from last 14 days
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  
  const recentResponses = await prisma.response.count({
    where: { 
      form: { project: { userId: user?.id } },
      createdAt: { gte: fourteenDaysAgo }
    }
  })

  // Get the first game for display (if any)
  const selectedGame = games[0]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Dashboard</div>
          <div className="text-sm text-muted-foreground">
            Your command center: updates, campaign results, and progress proof.
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl">
            <Camera className="mr-2 h-4 w-4" /> Snapshot
          </Button>
          <Button className="rounded-2xl" asChild>
            <Link href="/dashboard/games/new">
              <Plus className="mr-2 h-4 w-4" /> New Game
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGames}</div>
            <p className="text-xs text-muted-foreground">{totalGames === 1 ? 'game' : 'games'} created</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responses (14d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentResponses}</div>
            <p className="text-xs text-muted-foreground">from all campaigns</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResponses}</div>
            <p className="text-xs text-muted-foreground">across all time</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Progress Board Preview */}
        <Card className="rounded-3xl lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm inline-flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {games.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No games yet. Create your first game to get started.</p>
                <Button className="rounded-2xl" asChild>
                  <Link href="/dashboard/games/new">
                    <Plus className="mr-2 h-4 w-4" /> Create Game
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {games.slice(0, 5).map((game) => (
                  <Link
                    key={game.id}
                    href={`/dashboard/projects/${game.id}`}
                    className="flex items-center justify-between p-3 rounded-2xl border bg-background/60 hover:bg-muted/50 transition"
                  >
                    <div>
                      <div className="font-medium">{game.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {game._count.stats} stats · {game._count.forms} campaigns
                      </div>
                    </div>
                    <Badge variant="outline" className="rounded-full">
                      View
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Board Card */}
        <Card className="rounded-3xl lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Progress Board</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border p-3">
              <div className="text-xs text-muted-foreground">Link visibility</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full inline-flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" /> Private
                </Badge>
                <span className="text-sm text-muted-foreground">Share progress with your team.</span>
              </div>
            </div>
            
            {selectedGame ? (
              <div className="rounded-2xl border p-3">
                <div className="text-xs text-muted-foreground">Quick preview</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium">Game</div>
                  <div className="font-medium">Campaigns</div>
                  <div className="font-medium">Stats</div>
                  <div className="text-muted-foreground truncate">{selectedGame.name}</div>
                  <div className="text-muted-foreground">{selectedGame._count.forms}</div>
                  <div className="text-muted-foreground">{selectedGame._count.stats}</div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border p-3 text-center text-sm text-muted-foreground">
                Create a game to see progress
              </div>
            )}
            
            <div className="flex gap-2">
              <Button className="flex-1 rounded-2xl" variant="outline" disabled={!selectedGame}>
                Copy Link
              </Button>
              <Button className="flex-1 rounded-2xl" disabled={!selectedGame} asChild>
                {selectedGame ? (
                  <Link href={`/dashboard/projects/${selectedGame.id}/analytics`}>
                    Open
                  </Link>
                ) : (
                  <span>Open</span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="rounded-2xl h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/games">
                <span className="text-lg">🎮</span>
                <span className="text-sm">My Games</span>
              </Link>
            </Button>
            <Button variant="outline" className="rounded-2xl h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/discover">
                <span className="text-lg">🔍</span>
                <span className="text-sm">Discover</span>
              </Link>
            </Button>
            <Button variant="outline" className="rounded-2xl h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/snapshots">
                <span className="text-lg">📸</span>
                <span className="text-sm">Snapshots</span>
              </Link>
            </Button>
            <Button variant="outline" className="rounded-2xl h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/settings">
                <span className="text-lg">⚙️</span>
                <span className="text-sm">Settings</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
