'use client'

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface ModalProps {
  open: boolean
  title: string
  children: React.ReactNode
  onClose: () => void
}

export function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border bg-background shadow-xl">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="text-base font-semibold">{title}</div>
          <Button variant="ghost" onClick={onClose} className="rounded-2xl">
            Close
          </Button>
        </div>
        <Separator />
        <div className="max-h-[72vh] overflow-auto p-5">{children}</div>
      </div>
    </div>
  )
}
