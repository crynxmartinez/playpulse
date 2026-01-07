'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ImageIcon } from 'lucide-react'

interface GalleryImage {
  id: string
  imageUrl: string
  title: string | null
  description: string | null
  order: number
  createdAt: string
}

interface GallerySectionProps {
  projectId: string
}

export function GallerySection({ projectId }: GallerySectionProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/gallery`)
        if (res.ok) {
          const data = await res.json()
          setImages(data.images || [])
        }
      } catch (error) {
        console.error('Error fetching gallery:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchGallery()
  }, [projectId])

  if (loading) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading gallery...
        </CardContent>
      </Card>
    )
  }

  if (images.length === 0) {
    return (
      <Card className="rounded-3xl border-dashed border-2 border-[#2a2a3e] bg-transparent">
        <CardContent className="py-12 text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <div className="text-muted-foreground">
            <div className="text-sm font-medium">No images yet</div>
            <div className="text-xs mt-1">The developer hasn&apos;t added any gallery images.</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((image) => (
          <div 
            key={image.id}
            className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group bg-[#1a1a2e]"
            onClick={() => setSelectedImage(image)}
          >
            <img 
              src={image.imageUrl} 
              alt={image.title || 'Gallery image'}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            {image.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <div className="text-sm font-medium text-white truncate">{image.title}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition z-10"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div 
            className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedImage.imageUrl} 
              alt={selectedImage.title || 'Gallery image'}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {(selectedImage.title || selectedImage.description) && (
              <div className="mt-4 text-center max-w-2xl">
                {selectedImage.title && (
                  <div className="text-lg font-medium text-white">{selectedImage.title}</div>
                )}
                {selectedImage.description && (
                  <div className="text-sm text-slate-400 mt-1">{selectedImage.description}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
