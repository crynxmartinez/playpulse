'use client'

import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  title = 'Confirm',
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const confirmButtonStyles = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    default: 'bg-purple-600 hover:bg-purple-700 text-white',
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d15] rounded-2xl max-w-md w-full shadow-xl border border-[#2a2a3e] animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {variant === 'danger' && (
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="text-red-500" size={20} />
              </div>
            )}
            {variant === 'warning' && (
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="text-amber-500" size={20} />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-slate-400 mt-1">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="p-1 text-slate-400 hover:text-white hover:bg-[#2a2a3e] rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-400 hover:text-white font-medium rounded-lg hover:bg-[#1a1a2e] transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${confirmButtonStyles[variant]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
