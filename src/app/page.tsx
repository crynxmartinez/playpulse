import { getCurrentUser } from '@/lib/auth'
import LandingPage from '@/components/LandingPage'
import { redirect } from 'next/navigation'

export default async function Home() {
  const user = await getCurrentUser()
  
  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }
  
  return <LandingPage />
}
