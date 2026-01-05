import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Return children directly without any wrapper - full page editor
  return <>{children}</>
}
