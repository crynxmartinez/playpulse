import { Lock, Link as LinkIcon, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Visibility = 'PRIVATE' | 'UNLISTED' | 'PUBLIC'

const VISIBILITY_META: Record<Visibility, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  PRIVATE: { label: 'Private', icon: Lock },
  UNLISTED: { label: 'Unlisted', icon: LinkIcon },
  PUBLIC: { label: 'Public', icon: Globe },
}

interface VisibilityBadgeProps {
  visibility: Visibility
}

export function VisibilityBadge({ visibility }: VisibilityBadgeProps) {
  const meta = VISIBILITY_META[visibility]
  const Icon = meta.icon
  
  return (
    <Badge variant="outline" className="rounded-full inline-flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  )
}
