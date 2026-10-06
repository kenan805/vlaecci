import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await query<{
      id: string
      name: string
      contact: string
      message_type: string
      message: string
      created_at: string
    }>(
      `SELECT id, name, contact, message_type, message, created_at
       FROM contact_messages
       ORDER BY created_at DESC`
    )
    const messages = result.rows.map((m) => ({
      id: m.id,
      name: m.name,
      contact: m.contact,
      messageType: m.message_type,
      message: m.message,
      createdAt: m.created_at,
    }))
    return NextResponse.json({ messages })
  } catch (err) {
    console.error('Admin messages error:', err)
    return NextResponse.json({ messages: [] })
  }
}
