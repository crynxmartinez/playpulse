import LandingPage from '@/components/LandingPage'

export default async function Home() {
  // Allow both logged-in and logged-out users to view landing page
  // They can access dashboard via navigation
  return <LandingPage />
}
