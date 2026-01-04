import { getCurrentUser } from '@/lib/auth'
import { LayoutDashboard } from 'lucide-react'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Dashboard
        </h1>
        <p className="text-slate-500 mt-1">Welcome back, {user?.name || 'User'}!</p>
      </div>

      {/* Placeholder - Coming Soon */}
      <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-6">
          <LayoutDashboard className="text-purple-500" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Dashboard Coming Soon</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          This will be your central hub for discovering games, tracking playtests, and viewing your activity across PlayPulse.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-400">
          <span className="px-3 py-1 bg-slate-100 rounded-full">Trending Playtests</span>
          <span className="px-3 py-1 bg-slate-100 rounded-full">Recently Updated</span>
          <span className="px-3 py-1 bg-slate-100 rounded-full">Your Activity</span>
          <span className="px-3 py-1 bg-slate-100 rounded-full">Discover Games</span>
        </div>
      </div>
    </div>
  )
}
