import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'
import { sanitizeImageUrls } from '@/lib/parse-image-urls'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    if (body.status != null && body.name == null) {
      const status = body.status
      if (!['draft', 'active', 'deactive'].includes(status)) {
        return NextResponse.json({ error: 'Status düzgün deyil' }, { status: 400 })
      }
      await query('UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2', [status, id])
      return NextResponse.json({ success: true })
    }

    const { name, slug, description, ingredients, howToUse, price, images, categoryId, status } = body
    const rounded = Math.round(Number(price) * 100) / 100

    await query(
      `UPDATE products SET name = $1, slug = $2, description = $3, ingredients = $4, how_to_use = $5,
       price = $6, images = $7, category_id = $8, status = COALESCE($9, status), updated_at = NOW()
       WHERE id = $10`,
      [
        name,
        slug,
        description,
        ingredients || '',
        howToUse || '',
        rounded,
        JSON.stringify(sanitizeImageUrls(images)),
        categoryId,
        status || null,
        id,
      ]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin products PUT error:', err)
    return NextResponse.json({ error: 'Yeniləmə uğursuz' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await query('DELETE FROM products WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin products DELETE error:', err)
    return NextResponse.json({ error: 'Silinmə uğursuz' }, { status: 500 })
  }
}
