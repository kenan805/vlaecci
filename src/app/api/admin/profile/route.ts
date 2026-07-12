import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

async function ensureAvatarColumn() {
  await query('ALTER TABLE admins ADD COLUMN IF NOT EXISTS avatar_url TEXT')
}

export async function GET(req: NextRequest) {
  await ensureAvatarColumn()

  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await query<{ email: string; avatar_url: string | null }>(
      'SELECT email, avatar_url FROM admins WHERE id = $1',
      [admin.adminId]
    )

    const row = result.rows[0]
    if (!row) return NextResponse.json({ error: 'Admin tapılmadı' }, { status: 404 })

    return NextResponse.json({ email: row.email, avatarUrl: row.avatar_url })
  } catch (err) {
    console.error('Admin profile GET error:', err)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  await ensureAvatarColumn()

  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await req.json()) as {
      currentPassword?: string
      newPassword?: string
      avatarUrl?: string | null
    }

    if (typeof body.newPassword === 'string' && body.newPassword.length > 0) {
      if (typeof body.currentPassword !== 'string' || body.currentPassword.length === 0) {
        return NextResponse.json({ error: 'Cari parol tələb olunur' }, { status: 400 })
      }

      const result = await query<{ password_hash: string }>(
        'SELECT password_hash FROM admins WHERE id = $1',
        [admin.adminId]
      )
      const row = result.rows[0]
      if (!row) return NextResponse.json({ error: 'Admin tapılmadı' }, { status: 404 })

      const valid = await bcrypt.compare(body.currentPassword, row.password_hash)
      if (!valid) {
        return NextResponse.json({ error: 'Cari parol yanlışdır' }, { status: 400 })
      }

      if (body.newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Yeni parol ən azı 6 simvol olmalıdır' },
          { status: 400 }
        )
      }

      const hash = await bcrypt.hash(body.newPassword, 10)
      await query('UPDATE admins SET password_hash = $1 WHERE id = $2', [hash, admin.adminId])
    }

    if ('avatarUrl' in body) {
      const avatarUrl =
        typeof body.avatarUrl === 'string' && body.avatarUrl.trim().length > 0
          ? body.avatarUrl.trim()
          : null
      await query('UPDATE admins SET avatar_url = $1 WHERE id = $2', [avatarUrl, admin.adminId])
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin profile PUT error:', err)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
