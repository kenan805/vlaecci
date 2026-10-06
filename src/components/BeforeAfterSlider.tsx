'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion'
import { ChevronLeft, ChevronRight, Hand } from 'lucide-react'
import type { BeforeAfterResult } from '@/lib/home-content'

const clamp = (v: number) => Math.min(100, Math.max(0, v))
const pad = (n: number) => String(n).padStart(2, '0')

/* ------------------------------------------------------------------ */
/* Draggable before/after comparison                                  */
/* ------------------------------------------------------------------ */

function CompareImage({ before, after, alt }: { before: string; after: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduceMotion = useReducedMotion()
  const position = useMotionValue(50)
  const [dragging, setDragging] = useState(false)
  const [touched, setTouched] = useState(false)
  const [value, setValue] = useState(50)

  const clipPath = useTransform(position, (v) => `inset(0 ${100 - v}% 0 0)`)
  const left = useTransform(position, (v) => `${v}%`)
  const beforeLabel = useTransform(position, [4, 18], [0, 1])
  const afterLabel = useTransform(position, [82, 96], [1, 0])

  useEffect(() => position.on('change', (v) => setValue(Math.round(v))), [position])

  // One gentle sweep the first time the image scrolls into view, to show it can be dragged.
  useEffect(() => {
    if (!inView || touched || reduceMotion) return
    const controls = animate(position, [50, 26, 74, 50], {
      duration: 2.2,
      ease: 'easeInOut',
      delay: 0.4,
    })
    return () => controls.stop()
  }, [inView, touched, reduceMotion, position])

  const setFromClientX = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    position.set(clamp(((clientX - rect.left) / rect.width) * 100))
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setTouched(true)
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    position.stop()
    setFromClientX(e.clientX)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 4
    let next: number | null = null
    if (e.key === 'ArrowLeft') next = position.get() - step
    if (e.key === 'ArrowRight') next = position.get() + step
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = 100
    if (next === null) return
    e.preventDefault()
    setTouched(true)
    position.stop()
    animate(position, clamp(next), { type: 'spring', stiffness: 400, damping: 40 })
  }

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={(e) => dragging && setFromClientX(e.clientX)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      className={`group relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-sand-200/50 select-none touch-pan-y shadow-[0_30px_60px_-30px_rgba(74,61,50,0.45)] ring-1 ring-brown-300/10 ${
        dragging ? 'cursor-grabbing' : 'cursor-ew-resize'
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={after}
        alt={`${alt} — sonra`}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <motion.div className="absolute inset-0" style={{ clipPath }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before}
          alt={`${alt} — əvvəl`}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      </motion.div>

      {/* soft vignette so labels stay legible on any photo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent" />

      <motion.span
        style={{ opacity: beforeLabel }}
        className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/40 bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md"
      >
        Əvvəl
      </motion.span>
      <motion.span
        style={{ opacity: afterLabel }}
        className="pointer-events-none absolute right-4 top-4 rounded-full border border-white/40 bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md"
      >
        Sonra
      </motion.span>

      {/* divider + handle */}
      <motion.div className="pointer-events-none absolute inset-y-0" style={{ left }}>
        <div className="absolute inset-y-0 -translate-x-1/2 w-[2px] bg-gradient-to-b from-white/0 via-white to-white/0 shadow-[0_0_12px_rgba(255,255,255,0.7)]" />

        <div
          role="slider"
          tabIndex={0}
          aria-label="Əvvəl və sonra şəkillərini müqayisə et"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          onKeyDown={onKeyDown}
          className="pointer-events-auto absolute top-1/2 -translate-x-1/2 -translate-y-1/2 outline-none"
        >
          {!touched && (
            <span className="absolute inset-0 rounded-full bg-white/40 animate-ping [animation-duration:2s]" />
          )}
          <motion.div
            animate={{ scale: dragging ? 1.1 : 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/25 shadow-[0_10px_30px_-6px_rgba(0,0,0,0.45)] backdrop-blur-md group-focus-within:ring-4 group-focus-within:ring-white/50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream-50 text-brown-300 shadow-inner">
              <ChevronLeft size={16} strokeWidth={2.5} className="-mr-1 transition-transform group-hover:-translate-x-0.5" />
              <ChevronRight size={16} strokeWidth={2.5} className="-ml-1 transition-transform group-hover:translate-x-0.5" />
            </span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Showcase: editorial copy + navigation alongside the comparison     */
/* ------------------------------------------------------------------ */

function NavButton({ dir, onClick }: { dir: 'prev' | 'next'; onClick: () => void }) {
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'prev' ? 'Əvvəlki nəticə' : 'Növbəti nəticə'}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-brown-300/20 text-brown-300 transition-all hover:border-brown-300 hover:bg-brown-300 hover:text-cream-50 active:scale-95"
    >
      <Icon size={20} />
    </button>
  )
}

export function BeforeAfterSlider({ results }: { results: BeforeAfterResult[] }) {
  const [index, setIndex] = useState(0)
  if (results.length === 0) return null

  const i = Math.min(index, results.length - 1)
  const current = results[i]
  const many = results.length > 1
  const go = (delta: number) => setIndex((n) => (n + delta + results.length) % results.length)

  return (
    <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-20">
      {/* Comparison — first on mobile, right column on desktop */}
      <div className="relative mx-auto w-full max-w-md lg:order-2 lg:max-w-none">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-y-6 inset-x-0 -z-10 rounded-[40px] lg:-inset-6 bg-gradient-to-br from-accent-rose/25 via-sand-200/40 to-accent-sage/20 blur-2xl"
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <CompareImage
              before={current.beforeImage}
              after={current.afterImage}
              alt={current.title || 'VLAECCI nəticəsi'}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Copy + controls */}
      <div className="text-center lg:order-1 lg:text-left">
        <div className="flex items-center justify-center gap-3 lg:justify-start">
          <span className="h-px w-8 bg-accent-rose" />
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-rose">Real nəticə</span>
        </div>

        {many && (
          <p className="mt-6 font-serif text-brown-300">
            <span className="text-5xl lg:text-6xl">{pad(i + 1)}</span>
            <span className="ml-2 text-lg text-brown-100/40">/ {pad(results.length)}</span>
          </p>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="min-h-[96px]"
          >
            <h3 className="mt-4 font-serif text-2xl text-brown-300 md:text-3xl lg:text-4xl">
              {current.title || 'Saçlarda görünən fərq'}
            </h3>
            {current.description && (
              <p className="mx-auto mt-3 max-w-sm leading-relaxed text-brown-100/75 lg:mx-0">{current.description}</p>
            )}
          </motion.div>
        </AnimatePresence>

        <p className="mt-6 inline-flex items-center gap-2 text-xs text-brown-100/55">
          <Hand size={14} />
          Fərqi görmək üçün tutacağı sürüşdürün
        </p>

        {many && (
          <>
            <div className="mt-8 flex items-center justify-center gap-4 lg:justify-start">
              <NavButton dir="prev" onClick={() => go(-1)} />
              <div className="flex gap-1.5">
                {results.map((r, n) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setIndex(n)}
                    aria-label={`${n + 1}-ci nəticə`}
                    className="group/dot py-2"
                  >
                    <span
                      className={`block h-1 rounded-full transition-all duration-300 ${
                        n === i ? 'w-8 bg-brown-300' : 'w-4 bg-sand-300 group-hover/dot:bg-sand-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <NavButton dir="next" onClick={() => go(1)} />
            </div>

            <div className="mt-8 hidden gap-3 lg:flex">
              {results.map((r, n) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setIndex(n)}
                  aria-label={r.title || `${n + 1}-ci nəticə`}
                  className={`relative flex h-20 w-16 overflow-hidden rounded-xl ring-offset-2 ring-offset-cream-100 transition-all ${
                    n === i ? 'ring-2 ring-brown-300' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.beforeImage} alt="" className="h-full w-1/2 object-cover" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.afterImage} alt="" className="h-full w-1/2 object-cover" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
