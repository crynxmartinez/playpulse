import { getCurrentUser } from '@/lib/auth'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-slate-500 mt-1">Dashboard</p>
      </div>
    </div>
  )
}
