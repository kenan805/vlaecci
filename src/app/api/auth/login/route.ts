import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'
import { createSession, setAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email və parol tələb olunur' }, { status: 400 })
    }

    const result = await query<{ id: string; email: string; password_hash: string }>(
      'SELECT id, email, password_hash FROM admins WHERE email = $1',
      [email.toLowerCase().trim()]
    )

    const admin = result.rows[0]
    if (!admin) {
      return NextResponse.json({ error: 'Email və ya parol yanlışdır' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Email və ya parol yanlışdır' }, { status: 401 })
    }

    const token = await createSession(admin.id, admin.email)
    await setAuthCookie(token)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
