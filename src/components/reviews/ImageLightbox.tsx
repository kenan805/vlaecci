'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

/** Small clickable thumbnails that open a full-size viewer. */
export function ReviewImages({ images, size = 64 }: { images: string[]; size?: number }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  if (images.length === 0) return null
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="relative overflow-hidden rounded-lg border border-sand-200/70 bg-sand-200/30 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brown-300/40 transition-opacity"
            style={{ width: size, height: size }}
            aria-label={`Şəkli böyüt (${i + 1}/${images.length})`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      {openIndex !== null && (
        <ImageLightbox images={images} index={openIndex} onIndexChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      )}
    </>
  )
}

export function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: string[]
  index: number
  onIndexChange: (i: number) => void
  onClose: () => void
}) {
  const count = images.length
  const go = useCallback((delta: number) => onIndexChange((index + delta + count) % count), [index, count, onIndexChange])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' && count > 1) go(1)
      else if (e.key === 'ArrowLeft' && count > 1) go(-1)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, go, count])

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/80" onClick={onClose} aria-label="Bağla" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt=""
        className="relative max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
        aria-label="Bağla"
      >
        <X size={20} />
      </button>
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Əvvəlki şəkil"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Növbəti şəkil"
          >
            <ChevronRight size={22} />
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white tabular-nums">
            {index + 1} / {count}
          </span>
        </>
      )}
    </div>
  )
}
