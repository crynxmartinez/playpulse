import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GamePageRedirect({ params }: PageProps) {
  const { id } = await params
  // Redirect to the new /game/[id] route
  redirect(`/game/${id}`)
}
