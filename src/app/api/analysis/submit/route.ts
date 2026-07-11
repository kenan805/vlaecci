import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { query } from '@/lib/db'
import { scoreAnalysisProfile } from '@/lib/analysis'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { selectedOptionIds, email } = body

    if (!Array.isArray(selectedOptionIds) || selectedOptionIds.length === 0) {
      return NextResponse.json({ error: 'Cavablar tələb olunur' }, { status: 400 })
    }

    const profile = await scoreAnalysisProfile(selectedOptionIds)
    if (!profile) {
      return NextResponse.json({ error: 'Nəticə tapılmadı' }, { status: 404 })
    }

    const sessionId = randomUUID()
    await query(
      'INSERT INTO analysis_sessions (id, profile_id, selected_option_ids, email) VALUES ($1, $2, $3, $4)',
      [sessionId, profile.id, JSON.stringify(selectedOptionIds), email || null]
    )

    return NextResponse.json({ profile, sessionId })
  } catch (err) {
    console.error('Analysis submit error:', err)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
