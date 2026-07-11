import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, contact, messageType, message } = body

    if (!name || !contact || !message) {
      return NextResponse.json({ error: 'Ad, əlaqə və mesaj mütləqdir' }, { status: 400 })
    }

    const id = randomUUID()
    await query(
      'INSERT INTO contact_messages (id, name, contact, message_type, message) VALUES ($1, $2, $3, $4, $5)',
      [id, name, contact, messageType || 'other', message]
    )

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Contact POST error:', err)
    return NextResponse.json({ error: 'Mesaj göndərilə bilmədi' }, { status: 500 })
  }
}
