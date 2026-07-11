import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import { NavigationLoader } from '@/components/NavigationLoader'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'VLAECCI | Dermatoloq Təsdiqli Saç Baxımı',
  description: 'Saç dökülməsi, zəif saç və yavaş böyümə problemi yaşayan qadınlar üçün təbii, dermatoloq təsdiqli saç baxım məhsulları.',
  keywords: 'saç baxımı, saç serumu, saç dökülməsi, təbii saç baxımı, VLAECCI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="az" className={`scroll-smooth ${playfair.variable} ${dmSans.variable}`}>
      <body className="antialiased min-h-screen bg-cream-50 text-brown-100 font-sans">
        <NavigationLoader />
        {children}
      </body>
    </html>
  )
}
