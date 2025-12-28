import { getCurrentUser } from '@/lib/auth'
import { Gamepad2, Users, TrendingUp, Activity } from 'lucide-react'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  const stats = [
    { label: 'Total Games', value: '24', icon: Gamepad2, color: 'from-purple-500 to-purple-600' },
    { label: 'Active Users', value: '1,234', icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Growth', value: '+12%', icon: TrendingUp, color: 'from-green-500 to-green-600' },
    { label: 'Sessions', value: '5,678', icon: Activity, color: 'from-pink-500 to-pink-600' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-slate-500 mt-1">Here&apos;s what&apos;s happening with your games today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-medium">
                U{i}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">User {i} started a new game session</p>
                <p className="text-xs text-slate-400">{i} hour{i > 1 ? 's' : ''} ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
