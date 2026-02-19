'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Link as LinkIcon, Check, Copy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  selectedGame: {
    id: string
    name: string
    slug: string | null
    _count: { forms: number; stats: number }
  } | null
}

export default function ProgressBoardCard({ selectedGame }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    if (!selectedGame) return
    const url = selectedGame.slug
      ? `${window.location.origin}/g/${selectedGame.slug}`
      : `${window.location.origin}/game/${selectedGame.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="rounded-3xl lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Progress Board</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl border p-3">
          <div className="text-xs text-muted-foreground">Public game page</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full inline-flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              {selectedGame?.slug ? `patchplay.live/g/${selectedGame.slug}` : 'No slug set'}
            </Badge>
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
          <Button
            className="flex-1 rounded-2xl"
            variant="outline"
            disabled={!selectedGame}
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-green-500" /> Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" /> Copy Link
              </>
            )}
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
  )
}
