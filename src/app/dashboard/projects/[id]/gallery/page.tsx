'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ImageIcon, Plus, Trash2, Loader2, Upload, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmModal } from '@/components/ui/confirm-modal'

interface GalleryImage {
  id: string
  imageUrl: string
  title: string | null
  description: string | null
  order: number
  createdAt: string
}

export default function GalleryPage() {
  const params = useParams()
  const projectId = params.id as string

  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  
  // Upload form state
  const [imageUrl, setImageUrl] = useState('')
  const [imageTitle, setImageTitle] = useState('')
  const [imageDescription, setImageDescription] = useState('')

  const fetchGallery = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects/${projectId}/gallery`)
      const data = await res.json()
      if (data.images) {
        setImages(data.images)
      }
    } catch (error) {
      console.error('Failed to fetch gallery:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchGallery()
  }, [fetchGallery])

  const handleUpload = async () => {
    if (!imageUrl.trim()) return
    
    setUploading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrl.trim(),
          title: imageTitle.trim() || null,
          description: imageDescription.trim() || null
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setImages(prev => [...prev, data.image])
        setShowUploadModal(false)
        setImageUrl('')
        setImageTitle('')
        setImageDescription('')
      } else {
        const error = await res.json()
        alert(`Failed to add image: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to add image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (imageId: string) => {
    setDeleteConfirm(null)
    setDeleting(imageId)
    try {
      const res = await fetch(`/api/projects/${projectId}/gallery/${imageId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setImages(prev => prev.filter(img => img.id !== imageId))
      }
    } catch (error) {
      console.error('Failed to delete image:', error)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gallery</h1>
          <p className="text-sm text-muted-foreground">
            Upload screenshots, artwork, and media to showcase on your game page.
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)} className="gap-2">
          <Plus size={16} />
          Add Image
        </Button>
      </div>

      {/* Gallery Grid */}
      {images.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No images yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add screenshots, artwork, or other media to your gallery.
            </p>
            <Button onClick={() => setShowUploadModal(true)} variant="secondary" className="gap-2">
              <Upload size={16} />
              Upload First Image
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden group relative">
              <div 
                className="aspect-video bg-muted cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <img 
                  src={image.imageUrl} 
                  alt={image.title || 'Gallery image'}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {image.title || 'Untitled'}
                    </div>
                    {image.description && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {image.description}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    onClick={() => setDeleteConfirm(image.id)}
                    disabled={deleting === image.id}
                  >
                    {deleting === image.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Image</CardTitle>
              <CardDescription>
                Add an image URL to your gallery. Use services like Imgur, Cloudinary, or any direct image link.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL *</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageTitle">Title (optional)</Label>
                <Input
                  id="imageTitle"
                  placeholder="Screenshot of gameplay"
                  value={imageTitle}
                  onChange={(e) => setImageTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageDescription">Description (optional)</Label>
                <Textarea
                  id="imageDescription"
                  placeholder="A brief description of the image..."
                  value={imageDescription}
                  onChange={(e) => setImageDescription(e.target.value)}
                  rows={2}
                />
              </div>
              
              {/* Preview */}
              {imageUrl && (
                <div className="rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={imageUrl} 
                    alt="Preview"
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowUploadModal(false)
                    setImageUrl('')
                    setImageTitle('')
                    setImageDescription('')
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={!imageUrl.trim() || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    'Add Image'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition z-10"
          >
            <X size={24} />
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

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
