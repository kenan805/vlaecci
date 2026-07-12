'use client'

import { useEffect, useState } from 'react'

interface VlaecciLoaderProps {
  progress?: number
  visible: boolean
}

export function VlaecciLoader({ visible }: VlaecciLoaderProps) {
  const [mounted, setMounted] = useState(false)

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
      <div className="flex flex-col items-center gap-5">
        <div className="vl-emblem relative w-24 h-24 sm:w-28 sm:h-28">
          {/* soft glow */}
          <div className="vl-glow absolute -inset-5 rounded-full bg-accent-rose/20 blur-2xl" />
          {/* emblem */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-mark.png"
            alt="VLAECCI"
            className="relative w-full h-full object-contain"
          />
          {/* light sweep — hair "comes alive" as light travels across the emblem shape */}
          <div className="vl-shine absolute inset-0" aria-hidden />
        </div>

        {/* wordmark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wordmark.png" alt="" aria-hidden className="h-3.5 sm:h-4 object-contain opacity-70 vl-word" />
      </div>

      <style jsx>{`
        .vl-emblem {
          animation: vlBreathe 3s ease-in-out infinite;
        }
        .vl-glow {
          animation: vlGlow 2.6s ease-in-out infinite;
        }
        .vl-shine {
          background: linear-gradient(
            110deg,
            transparent 38%,
            rgba(253, 249, 243, 0.85) 50%,
            transparent 62%
          );
          background-size: 260% 100%;
          background-repeat: no-repeat;
          -webkit-mask: url('/logo-mark.png') center / contain no-repeat;
          mask: url('/logo-mark.png') center / contain no-repeat;
          animation: vlShine 2.4s ease-in-out infinite;
        }
        .vl-word {
          animation: vlWord 2.6s ease-in-out infinite;
        }
        @keyframes vlShine {
          0% {
            background-position: 180% 0;
          }
          60%,
          100% {
            background-position: -80% 0;
          }
        }
        @keyframes vlGlow {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(0.85);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.12);
          }
        }
        @keyframes vlBreathe {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.04) rotate(-1deg);
          }
        }
        @keyframes vlWord {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.85;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .vl-emblem,
          .vl-glow,
          .vl-shine,
          .vl-word {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
