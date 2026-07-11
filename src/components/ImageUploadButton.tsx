'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { compressImageFile } from '@/lib/compress-image'
import { isValidImageUrl } from '@/lib/parse-image-urls'

export function ImageUploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Yalnız şəkil faylları (jpg, png, webp)')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('Maksimum ölçü: 4MB')
      return
    }
    setLoading(true)
    setError('')
    try {
      const compressed = await compressImageFile(file)
      const formData = new FormData()
      formData.append('file', compressed)
      const res = await apiFetch('/admin/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xəta')

      const url = typeof data.url === 'string' ? data.url.trim() : ''
      if (url.startsWith('data:')) {
        throw new Error('Köhnə kod deploy olunub — yenidən deploy edin.')
      }
      if (!isValidImageUrl(url)) {
        throw new Error(url ? `Dəstəklənməyən link: ${url.slice(0, 80)}` : 'Server link qaytarmadı — deploy yeniləyin')
      }
      onUploaded(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yükləmə uğursuz')
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="p-3 rounded-lg border-2 border-dashed border-sand-300 hover:border-accent-rose/50 text-brown-100 hover:text-accent-rose transition-colors disabled:opacity-50"
        title="Şəkil yüklə"
      >
        {loading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
      </button>
      {error && <span className="text-xs text-red-500 text-center max-w-[140px]">{error}</span>}
    </div>
  )
}
