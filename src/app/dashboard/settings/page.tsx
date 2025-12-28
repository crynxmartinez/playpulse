import { getCurrentUser } from '@/lib/auth'
import { Settings, User, Bell, Shield, Palette } from 'lucide-react'

export default async function SettingsPage() {
  const user = await getCurrentUser()

  const settingSections = [
    {
      icon: User,
      title: 'Profile Settings',
      description: 'Update your personal information and profile picture',
    },
    {
      icon: Bell,
      title: 'Notification Preferences',
      description: 'Manage how you receive notifications',
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Password, two-factor authentication, and sessions',
    },
    {
      icon: Palette,
      title: 'Appearance',
      description: 'Customize the look and feel of your dashboard',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase() || user?.email[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{user?.name || 'User'}</h2>
            <p className="text-slate-500">{user?.email}</p>
            <span className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-medium ${
              user?.role === 'ADMIN'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-slate-100 text-slate-700'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingSections.map((section) => {
          const Icon = section.icon
          return (
            <div
              key={section.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Icon className="text-purple-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{section.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{section.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
