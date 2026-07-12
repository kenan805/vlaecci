import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

const VALID_STATUSES = ['pending', 'contacted', 'done'] as const
type Status = (typeof VALID_STATUSES)[number]

function isValidStatus(value: unknown): value is Status {
  return typeof value === 'string' && (VALID_STATUSES as readonly string[]).includes(value)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const sets: string[] = []
    const values: unknown[] = []

    if (body.status != null) {
      if (!isValidStatus(body.status)) {
        return NextResponse.json({ error: 'Status düzgün deyil' }, { status: 400 })
      }
      values.push(body.status)
      sets.push(`status = $${values.length}`)
    }

    if (body.notes != null) {
      if (typeof body.notes !== 'string') {
        return NextResponse.json({ error: 'Qeyd düzgün deyil' }, { status: 400 })
      }
      values.push(body.notes)
      sets.push(`notes = $${values.length}`)
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'Yeniləmək üçün məlumat yoxdur' }, { status: 400 })
    }

    values.push(id)
    await query(`UPDATE consultations SET ${sets.join(', ')} WHERE id = $${values.length}`, values)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin consultations PUT error:', err)
    return NextResponse.json({ error: 'Yeniləmə uğursuz' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await query('DELETE FROM consultations WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin consultations DELETE error:', err)
    return NextResponse.json({ error: 'Silinmə uğursuz' }, { status: 500 })
  }
}
