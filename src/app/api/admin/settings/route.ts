import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { getContactPhone, setContactPhone } from '@/lib/site-settings'
import { isValidAzPhone, toE164AzPhone } from '@/lib/phone'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    return NextResponse.json({ contactPhone: await getContactPhone() })
  } catch (err) {
    console.error('Admin settings GET error:', err)
    return NextResponse.json({ error: 'Ayarlar yüklənmədi' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { contactPhone } = await req.json()
    if (typeof contactPhone !== 'string' || !isValidAzPhone(contactPhone)) {
      return NextResponse.json(
        { error: 'Telefon nömrəsi düzgün deyil. Nümunə: +994 (055) 708-79-99' },
        { status: 400 }
      )
    }
    const phone = toE164AzPhone(contactPhone)
    await setContactPhone(phone)
    return NextResponse.json({ contactPhone: phone })
  } catch (err) {
    console.error('Admin settings PUT error:', err)
    return NextResponse.json({ error: 'Saxlanılmadı' }, { status: 500 })
  }
}
