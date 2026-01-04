import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function MyGamesPage() {
  const user = await getCurrentUser()

  const games = await prisma.project.findMany({
    where: { userId: user?.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          forms: true,
          stats: true,
        }
      },
      forms: {
        include: {
          _count: {
            select: { responses: true }
          }
        }
      }
    }
  })

  // Calculate stats for each game
  const gamesWithStats = games.map(game => {
    const totalResponses = game.forms.reduce((sum, form) => sum + form._count.responses, 0)
    const activeCampaigns = game.forms.filter(f => f.isActive).length
    
    return {
      ...game,
      totalResponses,
      activeCampaigns,
    }
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">My Games</div>
          <div className="text-sm text-muted-foreground">Manage pages, updates, campaigns, and visibility.</div>
        </div>
        <Button className="rounded-2xl" asChild>
          <Link href="/dashboard/games/new">
            <Plus className="mr-2 h-4 w-4" /> New Game
          </Link>
        </Button>
      </div>

      {/* Games Grid */}
      {gamesWithStats.length === 0 ? (
        <Card className="rounded-3xl">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No games yet. Create your first game to get started.</p>
            <Button className="rounded-2xl" asChild>
              <Link href="/dashboard/games/new">
                <Plus className="mr-2 h-4 w-4" /> Create Game
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {gamesWithStats.map((game) => (
            <Link key={game.id} href={`/dashboard/projects/${game.id}`} className="block">
              <Card className="rounded-3xl transition hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">{game.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {game.description || 'No description'}
                      </div>
                    </div>
                    <Badge variant={game.visibility === 'PUBLIC' ? 'default' : 'secondary'} className="rounded-full text-xs">{game.visibility}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">{game._count.stats}</span>
                      <span>Stats</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">{game._count.forms}</span>
                      <span>Campaigns</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">{game.totalResponses}</span>
                      <span>Responses</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <div className="text-sm text-muted-foreground">
                      Created {new Date(game.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-2xl" asChild>
                        <Link href={`/dashboard/projects/${game.id}/settings`}>
                          Settings
                        </Link>
                      </Button>
                      <Button size="sm" className="rounded-2xl">
                        Open
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
