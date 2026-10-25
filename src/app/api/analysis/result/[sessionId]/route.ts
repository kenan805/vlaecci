import { NextResponse } from 'next/server'
import { getSessionProfile } from '@/lib/analysis'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Public: the current result (profile + recommended products) of an earlier analysis, so the
 * result page can be restored after the visitor navigates away. Only the profile is returned,
 * never the session's answers or email.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params
    if (!UUID.test(sessionId)) return NextResponse.json({ error: 'Nəticə tapılmadı' }, { status: 404 })

    const profile = await getSessionProfile(sessionId)
    if (!profile) return NextResponse.json({ error: 'Nəticə tapılmadı' }, { status: 404 })

    return NextResponse.json({ profile, sessionId })
  } catch (err) {
    console.error('Analysis result error:', err)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
