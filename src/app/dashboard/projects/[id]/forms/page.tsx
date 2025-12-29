'use client'

import { FileText } from 'lucide-react'

export default function FormsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Forms</h2>
      
      <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
        <FileText className="mx-auto text-slate-300 mb-4" size={48} />
        <h3 className="text-lg font-medium text-slate-700 mb-2">Forms</h3>
        <p className="text-slate-500">Coming soon...</p>
      </div>
    </div>
  )
}
