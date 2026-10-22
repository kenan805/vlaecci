import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createHairType, listHairTypes, parseHairTypeLabel } from '@/lib/hair-types'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** All hair types (active and inactive) in display order. */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    return NextResponse.json({ hairTypes: await listHairTypes(false) })
  } catch (err) {
    console.error('Admin hair types GET error:', err)
    return NextResponse.json({ hairTypes: [] })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = parseHairTypeLabel(body.label)
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
    return NextResponse.json({ hairType: await createHairType(parsed.label) }, { status: 201 })
  } catch (err) {
    console.error('Admin hair types POST error:', err)
    return NextResponse.json({ error: 'Saç tipi əlavə edilə bilmədi' }, { status: 500 })
  }
}

/** Saves a new display order: body { ids: string[] } top to bottom. */
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { ids } = await req.json()
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) {
      return NextResponse.json({ error: 'Sıra düzgün deyil' }, { status: 400 })
    }
    await query(
      `UPDATE hair_types h SET sort_order = o.pos
       FROM unnest($1::text[]) WITH ORDINALITY AS o(id, pos)
       WHERE h.id = o.id`,
      [ids]
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin hair types PATCH error:', err)
    return NextResponse.json({ error: 'Sıra saxlanılmadı' }, { status: 500 })
  }
}
