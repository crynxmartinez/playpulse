'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  CheckCircle, 
  XCircle, 
  Shield, 
  User,
  MoreVertical,
  Mail,
  Calendar,
  Gamepad2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface UserData {
  id: string
  email: string
  name: string | null
  username: string | null
  displayName: string | null
  role: 'USER' | 'ADMIN'
  emailVerified: boolean
  createdAt: string
  _count: {
    projects: number
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.users) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (userId: string, updates: { emailVerified?: boolean; role?: string }) => {
    setUpdating(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates })
      })
      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to update user:', error)
    } finally {
      setUpdating(null)
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: users.length,
    verified: users.filter(u => u.emailVerified).length,
    admins: users.filter(u => u.role === 'ADMIN').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Users className="h-7 w-7 text-purple-400" />
          User Management
        </h1>
        <p className="text-slate-400 mt-1">Manage all users on the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-slate-400">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.verified}</p>
                <p className="text-xs text-slate-400">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.admins}</p>
                <p className="text-xs text-slate-400">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search users by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl bg-[#0d0d15] border-[#2a2a3e]"
        />
      </div>

      {/* Users Table */}
      <Card className="rounded-2xl bg-[#0d0d15] border-[#1a1a2e]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a1a2e]">
                  <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">User</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Role</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Games</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Joined</th>
                  <th className="text-right p-4 text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[#1a1a2e] hover:bg-[#1a1a2e]/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#2a2a3e] flex items-center justify-center">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {user.displayName || user.name || 'No name'}
                          </p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {user.emailVerified ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <XCircle className="h-3 w-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge className={user.role === 'ADMIN' 
                        ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                        : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                      }>
                        {user.role === 'ADMIN' && <Shield className="h-3 w-3 mr-1" />}
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-slate-400">
                        <Gamepad2 className="h-4 w-4" />
                        {user._count.projects}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-slate-400">
                        <Calendar className="h-4 w-4" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!user.emailVerified && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg text-xs border-green-500/30 text-green-400 hover:bg-green-500/20"
                            onClick={() => updateUser(user.id, { emailVerified: true })}
                            disabled={updating === user.id}
                          >
                            {updating === user.id ? '...' : 'Verify'}
                          </Button>
                        )}
                        {user.role !== 'ADMIN' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                            onClick={() => updateUser(user.id, { role: 'ADMIN' })}
                            disabled={updating === user.id}
                          >
                            Make Admin
                          </Button>
                        )}
                        {user.role === 'ADMIN' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg text-xs border-slate-500/30 text-slate-400 hover:bg-slate-500/20"
                            onClick={() => updateUser(user.id, { role: 'USER' })}
                            disabled={updating === user.id}
                          >
                            Remove Admin
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No users found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
