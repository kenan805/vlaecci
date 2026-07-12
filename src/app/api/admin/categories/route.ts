import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await query<{ id: string; name: string; slug: string; is_active: boolean }>(
      'SELECT id, name, slug, COALESCE(is_active, true) AS is_active FROM categories ORDER BY name'
    )
    const categories = result.rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      isActive: c.is_active,
    }))
    return NextResponse.json({ categories })
  } catch (err) {
    console.error('Admin categories error:', err)
    return NextResponse.json({ categories: [] })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { name, slug, isActive } = body
    if (!name) return NextResponse.json({ error: 'Ad mütləqdir' }, { status: 400 })

    const id = randomUUID()
    const categorySlug = slug || slugify(name)
    const active = typeof isActive === 'boolean' ? isActive : true

    await query('INSERT INTO categories (id, name, slug, is_active) VALUES ($1, $2, $3, $4)', [
      id,
      name,
      categorySlug,
      active,
    ])
    return NextResponse.json({ id, slug: categorySlug }, { status: 201 })
  } catch (err) {
    console.error('Admin categories POST error:', err)
    return NextResponse.json({ error: 'Kateqoriya əlavə edilə bilmədi' }, { status: 500 })
  }
}
