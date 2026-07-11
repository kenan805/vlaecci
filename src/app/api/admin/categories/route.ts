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
    const result = await query<{ id: string; name: string; slug: string }>(
      'SELECT id, name, slug FROM categories ORDER BY name'
    )
    return NextResponse.json({ categories: result.rows })
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
    const { name, slug } = body
    if (!name) return NextResponse.json({ error: 'Ad mütləqdir' }, { status: 400 })

    const id = randomUUID()
    const categorySlug = slug || slugify(name)

    await query('INSERT INTO categories (id, name, slug) VALUES ($1, $2, $3)', [id, name, categorySlug])
    return NextResponse.json({ id, slug: categorySlug }, { status: 201 })
  } catch (err) {
    console.error('Admin categories POST error:', err)
    return NextResponse.json({ error: 'Kateqoriya əlavə edilə bilmədi' }, { status: 500 })
  }
}
