'use client'

import { useEffect, useState } from 'react'

const LOGO_PATH = '/logo-loading.svg'

interface VlaecciLoaderProps {
  progress: number
  visible: boolean
}

function LogoMark({ className }: { className?: string }) {
  const [useFallback, setUseFallback] = useState(false)

  if (useFallback) {
    return (
      <span className={`font-serif text-4xl sm:text-5xl font-medium tracking-widest ${className || ''}`}>
        VLAECCI
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_PATH}
      alt="VLAECCI"
      className={`w-full h-full object-contain ${className || ''}`}
      onError={() => setUseFallback(true)}
    />
  )
}

export function VlaecciLoader({ progress, visible }: VlaecciLoaderProps) {
  const [mounted, setMounted] = useState(false)
  const fill = Math.min(100, Math.max(0, progress))

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !visible) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-cream-50/95 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
      aria-label="Yüklənir"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-56 h-16 sm:w-64 sm:h-20 flex items-center justify-center">
          <div className="absolute inset-0 text-sand-300">
            <LogoMark />
          </div>
          <div
            className="absolute inset-0 overflow-hidden text-brown-300 transition-[clip-path] duration-200 ease-out"
            style={{ clipPath: `inset(${100 - fill}% 0 0 0)` }}
          >
            <LogoMark />
          </div>
        </div>
        <div className="w-40 h-0.5 bg-sand-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brown-300 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${fill}%` }}
          />
        </div>
      </div>
    </div>
  )
}
