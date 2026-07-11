'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

export function ConfirmModal({
  open,
  title = 'Təsdiq',
  message = 'Bu elementi silmək istədiyinizə əminsiniz?',
  confirmLabel = 'Sil',
  cancelLabel = 'Ləğv et',
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-brown-300/40 backdrop-blur-[2px]" onClick={onCancel} aria-label="Bağla" />
      <div className="relative w-full max-w-sm rounded-2xl bg-cream-50 border border-sand-200 shadow-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-serif text-lg font-medium text-brown-300">{title}</h3>
          <button type="button" onClick={onCancel} className="p-1.5 rounded-lg text-brown-100 hover:bg-sand-200/50">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-brown-100/90 mb-6 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm border border-sand-200 text-brown-100 hover:bg-sand-200/40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-medium text-cream-50 ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-brown-300 hover:bg-brown-400'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
