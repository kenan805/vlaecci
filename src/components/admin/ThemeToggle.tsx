'use client'

export function ThemeToggle({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={onToggle}
      title={isDark ? 'İşıqlı rejim' : 'Qaranlıq rejim'}
      aria-label={isDark ? 'İşıqlı rejimə keç' : 'Qaranlıq rejimə keç'}
      aria-pressed={isDark}
      className="w-10 h-10 rounded-xl border border-sand-200/70 bg-white text-brown-300 hover:bg-sand-200/40 hover:border-brown-300/30 transition-colors flex items-center justify-center"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {/* Sun — fixed warm amber */}
        <g stroke="#E0A23B" strokeWidth="1.5">
          <circle cx="12" cy="8" r="3" fill={isDark ? 'none' : '#E0A23B22'} />
          <path d="M12 2.4v1.4M5.6 4.1l.9 1M18.4 4.1l-.9 1M3.4 8.5h1.3M19.3 8.5h1.3" />
        </g>
        {/* Hair — currentColor, whitens in dark mode */}
        <g stroke="currentColor" strokeWidth="1.6">
          <path d="M8.7 11.2c-.9 2.6-1.4 5.2-.7 8.6" />
          <path d="M12 11.6c-.2 2.9-.2 5.7.1 8.4" />
          <path d="M15.3 11.2c.9 2.6 1.4 5.2.7 8.6" />
          <path d="M10.4 11.8c-.3 2.4-.7 4.6-.2 7.4" opacity="0.7" />
          <path d="M13.6 11.8c.3 2.4.7 4.6.2 7.4" opacity="0.7" />
        </g>
      </svg>
    </button>
  )
}
