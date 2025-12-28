import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Shield, User } from 'lucide-react'

interface UserData {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: Date
}

export default async function UsersPage() {
  const currentUser = await getCurrentUser()
  
  if (currentUser?.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Users</h1>
        <p className="text-slate-500 mt-1">Manage user accounts</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">User</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Role</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user: UserData) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                      {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{user.name || 'No name'}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {user.role === 'ADMIN' ? <Shield size={12} /> : <User size={12} />}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
