import { Bell, Check } from 'lucide-react'

export default function NotificationsPage() {
  const notifications = [
    { id: 1, title: 'New user registered', message: 'John Doe just created an account', time: '5 min ago', read: false },
    { id: 2, title: 'Game update available', message: 'Adventure Quest v2.0 is ready to deploy', time: '1 hour ago', read: false },
    { id: 3, title: 'Server maintenance', message: 'Scheduled maintenance completed successfully', time: '3 hours ago', read: true },
    { id: 4, title: 'New achievement unlocked', message: '100 concurrent players reached!', time: '1 day ago', read: true },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Notifications</h1>
          <p className="text-slate-500 mt-1">Stay updated with the latest events</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all">
          <Check size={20} />
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white rounded-xl p-6 shadow-sm border transition-all cursor-pointer hover:shadow-md ${
              notification.read ? 'border-slate-200' : 'border-purple-200 bg-purple-50/30'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                notification.read ? 'bg-slate-100' : 'bg-purple-100'
              }`}>
                <Bell className={notification.read ? 'text-slate-500' : 'text-purple-600'} size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${notification.read ? 'text-slate-700' : 'text-slate-800'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-slate-400">{notification.time}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{notification.message}</p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-purple-600"></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
