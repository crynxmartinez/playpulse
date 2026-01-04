import { getCurrentUser } from '@/lib/auth'
import { Camera } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function SnapshotsPage() {
  const user = await getCurrentUser()

  // Snapshots will be implemented in Sprint 5
  // This page is ready for that implementation
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Snapshots</div>
          <div className="text-sm text-muted-foreground">Export analytics as shareable images and embeds.</div>
        </div>
        <Button className="rounded-2xl" disabled>
          <Camera className="mr-2 h-4 w-4" /> Create Snapshot
        </Button>
      </div>

      {/* Coming Soon Notice */}
      <Card className="rounded-3xl">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Camera className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Snapshots Coming in Sprint 5</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            Create beautiful shareable images of your analytics. Perfect for social media, devlogs, and investor updates.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="rounded-full">PNG Export</Badge>
            <Badge variant="secondary" className="rounded-full">Embed Widgets</Badge>
            <Badge variant="secondary" className="rounded-full">Custom Branding</Badge>
            <Badge variant="secondary" className="rounded-full">Auto-Update</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Preview of what snapshots will look like */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Preview: Snapshot Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border p-4 text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium">Analytics Card</div>
              <div className="text-sm text-muted-foreground">Key metrics at a glance</div>
            </div>
            <div className="rounded-2xl border p-4 text-center">
              <div className="text-2xl mb-2">📈</div>
              <div className="font-medium">Trend Chart</div>
              <div className="text-sm text-muted-foreground">Response trends over time</div>
            </div>
            <div className="rounded-2xl border p-4 text-center">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-medium">Score Summary</div>
              <div className="text-sm text-muted-foreground">Fun score distribution</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
