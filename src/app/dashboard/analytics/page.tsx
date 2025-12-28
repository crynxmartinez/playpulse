import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'

export default function AnalyticsPage() {
  const metrics = [
    { label: 'Daily Active Users', value: '2,345', change: '+12%', positive: true },
    { label: 'Avg. Session Duration', value: '24m', change: '+5%', positive: true },
    { label: 'Bounce Rate', value: '32%', change: '-8%', positive: true },
    { label: 'New Users', value: '456', change: '-3%', positive: false },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Analytics</h1>
        <p className="text-slate-500 mt-1">Track your performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
          >
            <p className="text-sm text-slate-500 font-medium">{metric.label}</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-2xl font-bold text-slate-800">{metric.value}</p>
              <div className={`flex items-center gap-1 text-sm ${
                metric.positive ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {metric.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="text-purple-600" size={24} />
          <h2 className="text-xl font-semibold text-slate-800">Performance Overview</h2>
        </div>
        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
          <p className="text-slate-400">Chart visualization would go here</p>
        </div>
      </div>
    </div>
  )
}
