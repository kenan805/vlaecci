import { NextRequest, NextResponse } from 'next/server'
import { runSeed } from '@/lib/seed'
import { getDatabaseEnvLabel, getRuntimeEnv } from '@/lib/app-env'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-setup-secret')
  const expected = process.env.SETUP_SECRET || process.env.JWT_SECRET

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runSeed()
    return NextResponse.json({
      success: true,
      message: 'Veritabanı hazırlandı',
      environment: getRuntimeEnv(),
      databaseEnv: getDatabaseEnvLabel(),
      adminEmail: result.adminEmail,
      note: 'Giriş üçün bu mühitdəki ADMIN_EMAIL və ADMIN_PASSWORD istifadə edin',
    })
  } catch (err) {
    console.error('Setup error:', err)
    return NextResponse.json(
      { error: 'Setup uğursuz. DATABASE_URL düzgün qurulubmu?' },
      { status: 500 }
    )
  }
}
