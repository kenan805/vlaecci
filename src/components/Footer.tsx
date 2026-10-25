'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Instagram, MessageCircle, Phone } from 'lucide-react'
import { displayPhone, telHref, whatsappHref } from '@/lib/contact-phone'
import { useContactPhone } from '@/lib/use-contact-phone'

const instagramHandle = process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME || 'vlaecci'

const footerLinks = [
  { href: '/mehsullar', label: 'Məhsullar' },
  { href: '/analiz', label: 'Saç Analizi' },
  { href: '/elaqe', label: 'Əlaqə' },
]

const contactLinkClass =
  'inline-flex min-h-[40px] items-center gap-2.5 whitespace-nowrap text-cream-200/80 hover:text-cream-50 text-sm transition-colors'

export function Footer() {
  const phone = useContactPhone()
  return (
    <footer className="bg-brown-400 text-cream-200 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* 1 column on phones, 2 on tablets (brand on its own row), 4 from lg */}
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo-mark-light.png"
                alt=""
                width={44}
                height={44}
                className="w-11 h-11 object-contain"
              />
              <Image
                src="/wordmark-light.png"
                alt="VLAECCI"
                width={747}
                height={137}
                className="h-5 w-auto object-contain"
              />
            </div>
            <p className="text-cream-200/80 text-sm max-w-md">
              Dermatoloq təsdiqli saç baxım məhsulları. Saç dökülməsi, zəif saç və yavaş böyümə problemlərinə təbii həll.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-cream-50 mb-4">Keçidlər</h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-cream-200/80 hover:text-cream-50 text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-cream-50 mb-3">Əlaqə</h4>
            <ul className="space-y-1">
              <li>
                {phone ? (
                  <a href={telHref(phone)} className={`${contactLinkClass} tabular-nums`}>
                    <Phone size={18} className="shrink-0" />
                    {displayPhone(phone)}
                  </a>
                ) : (
                  // Reserve the row while the number loads so the footer doesn't jump.
                  <span className="flex min-h-[40px] items-center" aria-hidden>
                    <span className="h-4 w-40 rounded bg-cream-200/10" />
                  </span>
                )}
              </li>
              <li>
                {phone ? (
                  <a href={whatsappHref(phone)} target="_blank" rel="noopener noreferrer" className={contactLinkClass}>
                    <MessageCircle size={18} className="shrink-0" />
                    WhatsApp-da yazın
                  </a>
                ) : (
                  <span className="flex min-h-[40px] items-center" aria-hidden>
                    <span className="h-4 w-32 rounded bg-cream-200/10" />
                  </span>
                )}
              </li>
              <li>
                <a
                  href={`https://instagram.com/${instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={contactLinkClass}
                >
                  <Instagram size={18} className="shrink-0" />
                  @{instagramHandle}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Stacked and centred on phones; copyright left, credit right from sm */}
        <div className="mt-12 flex flex-col items-center gap-2 border-t border-brown-300/30 pt-8 text-center text-sm text-cream-200/60 sm:flex-row sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} VLAECCI. Bütün hüquqlar qorunur.</p>
          <p>
            Site by{' '}
            {/* No nofollow/noreferrer: the credit is meant to pass link value and show up in Newasoft's referrals */}
            <a
              href="https://newasoft.tech"
              target="_blank"
              rel="noopener"
              className="-my-2.5 inline-block py-2.5 font-medium text-cream-200/80 underline-offset-4 transition-colors hover:text-cream-50 hover:underline"
            >
              Newasoft
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
