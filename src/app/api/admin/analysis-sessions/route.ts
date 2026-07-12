import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

interface SessionRow {
  id: string
  email: string | null
  profile_title: string | null
  profile_name: string | null
  selected_option_ids: unknown
  created_at: string
}

interface OptionRow {
  id: string
  label: string
}

function parseOptionIds(raw: unknown): string[] {
  let value = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return []
    }
  }
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const optionsResult = await query<OptionRow>(`SELECT id, label FROM analysis_options`)
    const optionLabels = new Map<string, string>()
    for (const opt of optionsResult.rows) {
      optionLabels.set(opt.id, opt.label)
    }

    const sessionsResult = await query<SessionRow>(
      `SELECT s.id, s.email, p.title AS profile_title, p.name AS profile_name,
              s.selected_option_ids, s.created_at
       FROM analysis_sessions s
       LEFT JOIN analysis_profiles p ON p.id = s.profile_id
       ORDER BY s.created_at DESC`
    )

    const sessions = sessionsResult.rows.map((s) => {
      const optionIds = parseOptionIds(s.selected_option_ids)
      const answers = optionIds.map((id) => optionLabels.get(id) || id)
      return {
        id: s.id,
        email: s.email,
        resultTitle: s.profile_title || s.profile_name || '—',
        answers,
        answerCount: answers.length,
        createdAt: s.created_at,
      }
    })

    return NextResponse.json({ sessions })
  } catch (err) {
    console.error('Admin analysis-sessions GET error:', err)
    return NextResponse.json({ sessions: [] })
  }
}
