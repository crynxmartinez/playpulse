'use client'

import { useState, useEffect } from 'react'
import TopBar from '@/components/TopBar'
import NewSidebar from '@/components/NewSidebar'
import StarsBackground from '@/components/ui/stars-background'
import { User } from '@/types'

interface DashboardLayoutProps {
  user: User
  children: React.ReactNode
}

export default function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Close sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isSidebarOpen])

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      <StarsBackground starCount={100} />
      <TopBar 
        user={user} 
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      
      <div className="flex">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Fixed on desktop, overlay on mobile */}
        <aside className={`
          fixed top-[57px] left-0 z-40 h-[calc(100vh-57px)] w-64 
          transform transition-transform duration-300 ease-in-out
          lg:sticky lg:top-[57px] lg:translate-x-0 lg:block
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          bg-[#0a0a0f] lg:bg-transparent
          border-r lg:border-r-0
          overflow-y-auto
        `}>
          <div className="p-4">
            <NewSidebar 
              selectedGameId={selectedGameId}
              onSelectGame={(id) => {
                setSelectedGameId(id)
                setIsSidebarOpen(false)
              }}
            />
          </div>
        </aside>

        {/* Main Content - Full width with proper padding */}
        <main className="flex-1 min-w-0 p-4 lg:p-6">
          <div className="space-y-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
