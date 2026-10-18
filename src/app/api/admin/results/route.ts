import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'
import { isAllowedImage, listResults } from '@/lib/home-content'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const results = await listResults(false)
    return NextResponse.json({ results })
  } catch (err) {
    console.error('Admin results error:', err)
    return NextResponse.json({ results: [] })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { beforeImage, afterImage, title, description, sortOrder, isActive } = body

    if (!isAllowedImage(beforeImage) || !isAllowedImage(afterImage)) {
      return NextResponse.json({ error: 'Əvvəl və sonra şəkilləri mütləqdir' }, { status: 400 })
    }

    const id = randomUUID()
    await query(
      `INSERT INTO before_after_results (id, before_image, after_image, title, description, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        beforeImage.trim(),
        afterImage.trim(),
        typeof title === 'string' ? title.trim() : '',
        typeof description === 'string' ? description.trim() : '',
        Number.isFinite(Number(sortOrder)) ? Math.round(Number(sortOrder)) : 0,
        typeof isActive === 'boolean' ? isActive : true,
      ]
    )
    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    console.error('Admin results POST error:', err)
    return NextResponse.json({ error: 'Nəticə əlavə edilə bilmədi' }, { status: 500 })
  }
}
