'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart'

const navLinks = [
  { href: '/', label: 'Ana Səhifə' },
  { href: '/mehsullar', label: 'Məhsullar' },
  { href: '/analiz', label: 'Saç Analizi' },
  { href: '/elaqe', label: 'Əlaqə' },
]

function CartLink() {
  const { count, ready } = useCart()
  return (
    <Link
      href="/sebet"
      className="relative p-2 text-brown-300 hover:text-accent-rose transition-colors"
      aria-label="Səbət"
    >
      <ShoppingBag size={22} />
      {ready && count > 0 && (
        <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-accent-rose text-cream-50 text-[10px] font-semibold leading-none tabular-nums">
          {count}
        </span>
      )}
    </Link>
  )
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream-50/95 backdrop-blur-sm border-b border-sand-200/50">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 md:h-20">
        <Link href="/" className="flex items-center gap-2.5" aria-label="VLAECCI">
          <Image
            src="/logo-mark.png"
            alt=""
            width={44}
            height={44}
            priority
            className="w-9 h-9 md:w-11 md:h-11 object-contain"
          />
          <Image
            src="/wordmark.png"
            alt="VLAECCI"
            width={747}
            height={137}
            priority
            className="h-4 md:h-5 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-1 md:gap-6">
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-brown-100 hover:text-accent-rose transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <CartLink />

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-brown-300"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden bg-cream-100 border-t border-sand-200 py-4 px-4 animate-fade-in">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-brown-100 font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
