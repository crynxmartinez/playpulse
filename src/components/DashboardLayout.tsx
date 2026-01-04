'use client'

import { useState } from 'react'
import TopBar from '@/components/TopBar'
import NewSidebar from '@/components/NewSidebar'

interface DashboardLayoutProps {
  user: {
    id: string
    email: string
    name: string | null
  }
  children: React.ReactNode
}

export default function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const [viewMode, setViewMode] = useState<'workspace' | 'public'>('workspace')
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <TopBar 
        user={user} 
        viewMode={viewMode} 
        onViewModeChange={setViewMode} 
      />
      
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <div className="hidden md:block">
          <NewSidebar 
            selectedGameId={selectedGameId}
            onSelectGame={setSelectedGameId}
          />
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}
