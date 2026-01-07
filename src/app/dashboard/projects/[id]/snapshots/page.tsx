'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Camera, Trash2, Download, ExternalLink, Loader2, Calendar, Tag, Pin, PinOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/ui/confirm-modal'

interface Snapshot {
  id: string
  name: string
  type: string
  imageData: string
  formId: string | null
  metadata: {
    timeRange?: string
    formFilter?: string
    capturedAt?: string
  } | null
  createdAt: string
  updatedAt: string
}

const SNAPSHOT_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  'overall-score': { label: 'Overall Score', icon: '🎯' },
  'insights': { label: 'Key Insights', icon: '💡' },
  'stat-performance': { label: 'Stat Performance', icon: '📊' },
  'category-breakdown': { label: 'Category Breakdown', icon: '🥧' },
  'all-stats': { label: 'All Stats', icon: '📈' },
  'response-trend': { label: 'Response Trend', icon: '📉' },
}

export default function ProjectSnapshotsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [pinning, setPinning] = useState<string | null>(null)
  const [pinnedSnapshotIds, setPinnedSnapshotIds] = useState<Set<string>>(new Set())

  const fetchSnapshots = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects/${projectId}/snapshots`)
      const data = await res.json()
      if (data.snapshots) {
        setSnapshots(data.snapshots)
      }
    } catch (error) {
      console.error('Failed to fetch snapshots:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const fetchPinnedSections = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/pinned`)
      const data = await res.json()
      if (data.pinnedSections) {
        const pinnedIds = new Set<string>(
          data.pinnedSections
            .filter((p: { snapshotId: string | null }) => p.snapshotId)
            .map((p: { snapshotId: string }) => p.snapshotId)
        )
        setPinnedSnapshotIds(pinnedIds)
      }
    } catch (error) {
      console.error('Failed to fetch pinned sections:', error)
    }
  }, [projectId])

  useEffect(() => {
    fetchSnapshots()
    fetchPinnedSections()
  }, [fetchSnapshots, fetchPinnedSections])

  const handleDelete = async (snapshotId: string) => {
    setDeleteConfirm(null)
    setDeleting(snapshotId)
    try {
      const res = await fetch(`/api/projects/${projectId}/snapshots/${snapshotId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setSnapshots(snapshots.filter(s => s.id !== snapshotId))
        if (selectedSnapshot?.id === snapshotId) {
          setSelectedSnapshot(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete snapshot:', error)
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = (snapshot: Snapshot) => {
    const link = document.createElement('a')
    link.href = snapshot.imageData
    link.download = `${snapshot.name.replace(/\s+/g, '-').toLowerCase()}.webp`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Max 5 pinned snapshots allowed
  const MAX_PINNED_SNAPSHOTS = 5
  
  const handleTogglePin = async (snapshot: Snapshot) => {
    const isPinned = pinnedSnapshotIds.has(snapshot.id)
    
    // Check limit before pinning
    if (!isPinned && pinnedSnapshotIds.size >= MAX_PINNED_SNAPSHOTS) {
      alert(`You can only pin up to ${MAX_PINNED_SNAPSHOTS} snapshots. Unpin one first.`)
      return
    }
    
    setPinning(snapshot.id)
    
    try {
      if (isPinned) {
        // Find and delete the pinned section
        const res = await fetch(`/api/projects/${projectId}/pinned`)
        const data = await res.json()
        const pinnedSection = data.pinnedSections?.find(
          (p: { snapshotId: string | null }) => p.snapshotId === snapshot.id
        )
        if (pinnedSection) {
          await fetch(`/api/projects/${projectId}/pinned/${pinnedSection.id}`, {
            method: 'DELETE',
          })
          setPinnedSnapshotIds(prev => {
            const next = new Set(prev)
            next.delete(snapshot.id)
            return next
          })
        }
      } else {
        // Create new pinned section
        const res = await fetch(`/api/projects/${projectId}/pinned`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'SNAPSHOT',
            snapshotId: snapshot.id,
            title: snapshot.name,
          }),
        })
        if (res.ok) {
          setPinnedSnapshotIds(prev => new Set(prev).add(snapshot.id))
        }
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    } finally {
      setPinning(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTypeInfo = (type: string) => {
    return SNAPSHOT_TYPE_LABELS[type] || { label: type, icon: '📷' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Snapshots</div>
          <div className="text-sm text-muted-foreground">
            {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} saved
          </div>
        </div>
        <Button className="rounded-2xl" asChild>
          <Link href={`/dashboard/projects/${projectId}/analytics`}>
            <Camera className="mr-2 h-4 w-4" /> Go to Analytics
          </Link>
        </Button>
      </div>

      {snapshots.length === 0 ? (
        /* Empty State */
        <Card className="rounded-3xl">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No Snapshots Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Go to Analytics and click the camera icon on any section to save a snapshot.
            </p>
            <Button asChild>
              <Link href={`/dashboard/projects/${projectId}/analytics`}>
                Go to Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {snapshots.map((snapshot) => {
            const typeInfo = getTypeInfo(snapshot.type)
            return (
              <Card 
                key={snapshot.id} 
                className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedSnapshot(snapshot)}
              >
                {/* Image Preview */}
                <div className="aspect-video bg-[#1a1a2e] relative overflow-hidden">
                  <img 
                    src={snapshot.imageData} 
                    alt={snapshot.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="rounded-full text-xs">
                      {typeInfo.icon} {typeInfo.label}
                    </Badge>
                  </div>
                </div>
                
                {/* Info */}
                <CardContent className="p-4">
                  <h3 className="font-semibold text-white truncate mb-1">
                    {snapshot.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <Calendar size={12} />
                    {formatDate(snapshot.createdAt)}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant={pinnedSnapshotIds.has(snapshot.id) ? "default" : "outline"}
                      className={`flex-1 rounded-xl ${pinnedSnapshotIds.has(snapshot.id) ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTogglePin(snapshot)
                      }}
                      disabled={pinning === snapshot.id}
                    >
                      {pinning === snapshot.id ? (
                        <Loader2 size={14} className="mr-1 animate-spin" />
                      ) : pinnedSnapshotIds.has(snapshot.id) ? (
                        <PinOff size={14} className="mr-1" />
                      ) : (
                        <Pin size={14} className="mr-1" />
                      )}
                      {pinnedSnapshotIds.has(snapshot.id) ? 'Pinned' : 'Pin'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(snapshot)
                      }}
                    >
                      <Download size={14} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(snapshot.id)
                      }}
                      disabled={deleting === snapshot.id}
                    >
                      {deleting === snapshot.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete Snapshot"
        message="Are you sure you want to delete this snapshot? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Lightbox Modal */}
      {selectedSnapshot && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSnapshot(null)}
        >
          <div 
            className="bg-[#0d0d15] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-[#2a2a3e]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a3e]">
              <div>
                <h2 className="font-semibold text-lg text-white">{selectedSnapshot.name}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Tag size={14} />
                  {getTypeInfo(selectedSnapshot.type).label}
                  <span className="mx-1">•</span>
                  <Calendar size={14} />
                  {formatDate(selectedSnapshot.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant={pinnedSnapshotIds.has(selectedSnapshot.id) ? "default" : "outline"}
                  className={pinnedSnapshotIds.has(selectedSnapshot.id) ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  onClick={() => handleTogglePin(selectedSnapshot)}
                  disabled={pinning === selectedSnapshot.id}
                >
                  {pinning === selectedSnapshot.id ? (
                    <Loader2 size={14} className="mr-1 animate-spin" />
                  ) : pinnedSnapshotIds.has(selectedSnapshot.id) ? (
                    <PinOff size={14} className="mr-1" />
                  ) : (
                    <Pin size={14} className="mr-1" />
                  )}
                  {pinnedSnapshotIds.has(selectedSnapshot.id) ? 'Pinned' : 'Pin to Game Page'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDownload(selectedSnapshot)}
                >
                  <Download size={14} className="mr-1" /> Download
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setSelectedSnapshot(null)}
                >
                  Close
                </Button>
              </div>
            </div>
            
            {/* Modal Image */}
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <img 
                src={selectedSnapshot.imageData} 
                alt={selectedSnapshot.name}
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
