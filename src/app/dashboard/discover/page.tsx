import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Compass, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const query = params.q || ''

  // For now, show all public games (will be enhanced in Sprint 7)
  // Currently we don't have visibility field, so this will be empty
  // This page is ready for Sprint 7 implementation
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Discover</div>
          <div className="text-sm text-muted-foreground">Find games looking for playtesters.</div>
        </div>
      </div>

      {/* Search */}
      <Card className="rounded-3xl">
        <CardContent className="pt-6">
          <form className="flex gap-2">
            <Input
              name="q"
              placeholder="Search games, tags, studios..."
              className="rounded-2xl"
              defaultValue={query}
            />
            <Button type="submit" className="rounded-2xl">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Coming Soon Notice */}
      <Card className="rounded-3xl">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Compass className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Discovery Coming in Sprint 7</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            This page will show public games looking for playtesters. You&apos;ll be able to browse by genre, tags, and find games that need feedback.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="rounded-full">Trending Games</Badge>
            <Badge variant="secondary" className="rounded-full">New Releases</Badge>
            <Badge variant="secondary" className="rounded-full">Looking for Testers</Badge>
            <Badge variant="secondary" className="rounded-full">Genre Filter</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
