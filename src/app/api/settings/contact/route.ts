import { NextResponse } from 'next/server'
import { getContactPhone } from '@/lib/site-settings'
import { DEFAULT_CONTACT_PHONE } from '@/lib/contact-phone'

export const dynamic = 'force-dynamic'

/** Public: the shop's contact number (footer, WhatsApp orders). Briefly cached at the CDN. */
export async function GET() {
  try {
    const phone = await getContactPhone()
    return NextResponse.json(
      { phone },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' } }
    )
  } catch (err) {
    console.error('Contact settings error:', err)
    return NextResponse.json({ phone: DEFAULT_CONTACT_PHONE })
  }
}
