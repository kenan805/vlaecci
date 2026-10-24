import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { deleteHairType, parseHairTypeLabel } from '@/lib/hair-types'
import { query } from '@/lib/db'

/** Rename and/or activate / deactivate a hair type. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    let label: string | null = null
    if (body.label !== undefined) {
      const parsed = parseHairTypeLabel(body.label)
      if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
      label = parsed.label
    }
    const isActive = typeof body.isActive === 'boolean' ? body.isActive : null

    const result = await query(
      `UPDATE hair_types SET label = COALESCE($1, label), is_active = COALESCE($2, is_active)
       WHERE id = $3`,
      [label, isActive, id]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Saç tipi tapılmadı' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin hair type PUT error:', err)
    return NextResponse.json({ error: 'Yeniləmə uğursuz' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const deleted = await deleteHairType(id)
    if (!deleted) return NextResponse.json({ error: 'Saç tipi tapılmadı' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin hair type DELETE error:', err)
    return NextResponse.json({ error: 'Silinmə uğursuz' }, { status: 500 })
  }
}
