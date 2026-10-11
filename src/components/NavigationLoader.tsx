'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import { VlaecciLoader } from './VlaecciLoader'

function NavigationLoaderInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const prevRoute = useRef(`${pathname}?${searchParams.toString()}`)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopProgress = useCallback(() => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current)
      progressTimer.current = null
    }
  }, [])

  const startLoading = useCallback(() => {
    stopProgress()
    setVisible(true)
    setLoading(true)
    setProgress(8)
    progressTimer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p
        return p + Math.random() * 12
      })
    }, 180)
  }, [stopProgress])

  const finishLoading = useCallback(() => {
    stopProgress()
    setProgress(100)
    setLoading(false)
    const hide = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 350)
    return () => clearTimeout(hide)
  }, [stopProgress])

  useEffect(() => {
    const route = `${pathname}?${searchParams.toString()}`
    if (route !== prevRoute.current) {
      prevRoute.current = route
      const cleanup = finishLoading()
      return cleanup
    }
  }, [pathname, searchParams, finishLoading])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      if (!anchor) return
      // Controls inside a card link (size chips, add-to-cart) don't navigate.
      const control = target.closest('button, input, select, textarea, [role="radio"]')
      if (control && anchor.contains(control)) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return
      if (href.startsWith('http') && !href.startsWith(window.location.origin)) return

      try {
        const url = new URL(href, window.location.origin)
        if (url.origin !== window.location.origin) return
        const current = `${pathname}${searchParams.toString() ? `?${searchParams}` : ''}`
        const next = `${url.pathname}${url.search}`
        if (next === current) return
        startLoading()
      } catch {
        // ignore invalid href
      }
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [pathname, searchParams, startLoading])

  useEffect(() => () => stopProgress(), [stopProgress])

  return <VlaecciLoader progress={progress} visible={visible} />
}

export function NavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderInner />
    </Suspense>
  )
}
