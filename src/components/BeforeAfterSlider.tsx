'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react'
import type { BeforeAfterResult } from '@/lib/home-content'

function CompareImage({ before, after, alt }: { before: string; after: string; alt: string }) {
  const [position, setPosition] = useState(50)

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-sand-300/30 bg-sand-200/50 select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={`${alt} — sonra`} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={before}
        alt={`${alt} — əvvəl`}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        draggable={false}
      />

      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-brown-300 shadow-sm">
        ƏVVƏL
      </span>
      <span className="absolute right-3 top-3 rounded-full bg-brown-300/90 px-3 py-1 text-xs font-medium text-cream-50 shadow-sm">
        SONRA
      </span>

      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${position}%` }}>
        <div className="absolute inset-y-0 -translate-x-1/2 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.25)]" />
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-brown-300 shadow-lg">
          <MoveHorizontal size={18} />
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Əvvəl və sonra şəkillərini müqayisə et"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  )
}

export function BeforeAfterSlider({ results }: { results: BeforeAfterResult[] }) {
  const [index, setIndex] = useState(0)
  if (results.length === 0) return null

  const current = results[Math.min(index, results.length - 1)]
  const many = results.length > 1
  const go = (delta: number) => setIndex((i) => (i + delta + results.length) % results.length)

  return (
    <div className="mx-auto max-w-md">
      <div className="relative">
        <CompareImage
          key={current.id}
          before={current.beforeImage}
          after={current.afterImage}
          alt={current.title || 'VLAECCI nəticəsi'}
        />
        {many && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 sm:left-0 sm:-translate-x-[calc(100%+12px)] flex h-11 w-11 items-center justify-center rounded-full border border-sand-200 bg-cream-50 text-brown-300 shadow-sm hover:bg-white transition-colors"
              aria-label="Əvvəlki nəticə"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 sm:right-0 sm:translate-x-[calc(100%+12px)] flex h-11 w-11 items-center justify-center rounded-full border border-sand-200 bg-cream-50 text-brown-300 shadow-sm hover:bg-white transition-colors"
              aria-label="Növbəti nəticə"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {(current.title || current.description) && (
        <div className="mt-5 text-center">
          {current.title && <p className="font-medium text-brown-300">{current.title}</p>}
          {current.description && <p className="mt-1 text-sm text-brown-100/70">{current.description}</p>}
        </div>
      )}

      {many && (
        <div className="mt-5 flex justify-center gap-2">
          {results.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-brown-300' : 'w-2 bg-sand-300 hover:bg-sand-400'
              }`}
              aria-label={`${i + 1}-ci nəticə`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
