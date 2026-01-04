import { Badge } from "@/components/ui/badge"

interface TagRowProps {
  tags: string[]
}

export function TagRow({ tags }: TagRowProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="rounded-full">
          #{tag}
        </Badge>
      ))}
    </div>
  )
}
