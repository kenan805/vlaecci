import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [questions, options, profiles, scores, profileProducts] = await Promise.all([
      query(`SELECT * FROM analysis_questions ORDER BY sort_order`),
      query(`SELECT * FROM analysis_options ORDER BY sort_order`),
      query(`SELECT * FROM analysis_profiles ORDER BY sort_order`),
      query(`SELECT * FROM analysis_profile_scores`),
      query(`SELECT app.*, p.name AS product_name FROM analysis_profile_products app JOIN products p ON p.id = app.product_id ORDER BY app.sort_order`),
    ])

    return NextResponse.json({
      questions: questions.rows,
      options: options.rows,
      profiles: profiles.rows,
      scores: scores.rows,
      profileProducts: profileProducts.rows,
    })
  } catch (err) {
    console.error('Admin analysis GET error:', err)
    return NextResponse.json({ questions: [], options: [], profiles: [], scores: [], profileProducts: [] })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { type, data } = body

    switch (type) {
      case 'question': {
        const d = data as Record<string, unknown>
        const id = d.id as string
        const prompt = (d.prompt as string) || ''
        const sortOrder = (d.sortOrder ?? d.sort_order ?? 0) as number
        const isActive = (d.isActive ?? d.is_active ?? true) as boolean
        const parentOptionId = (d.parentOptionId ?? d.parent_option_id ?? null) as string | null
        const imageUrl = (d.imageUrl ?? d.image_url ?? null) as string | null
        const icon = (d.icon ?? null) as string | null
        await query(
          `INSERT INTO analysis_questions (id, prompt, sort_order, is_active, parent_option_id, image_url, icon)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             prompt = $2, sort_order = $3, is_active = $4, parent_option_id = $5, image_url = $6, icon = $7`,
          [id, prompt, sortOrder, isActive, parentOptionId, imageUrl, icon]
        )
        break
      }
      case 'option': {
        const d = data as Record<string, unknown>
        const id = d.id as string
        const questionId = (d.questionId ?? d.question_id) as string
        const label = (d.label as string) || ''
        const sortOrder = (d.sortOrder ?? d.sort_order ?? 0) as number
        const isActive = (d.isActive ?? d.is_active ?? true) as boolean
        const imageUrl = (d.imageUrl ?? d.image_url ?? null) as string | null
        const icon = (d.icon ?? null) as string | null
        await query(
          `INSERT INTO analysis_options (id, question_id, label, sort_order, is_active, image_url, icon)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             question_id = $2, label = $3, sort_order = $4, is_active = $5, image_url = $6, icon = $7`,
          [id, questionId, label, sortOrder, isActive, imageUrl, icon]
        )
        break
      }
      case 'profile': {
        const d = data as Record<string, unknown>
        const id = d.id as string
        const name = (d.name as string) || ''
        const slug = (d.slug as string) || ''
        const title = (d.title as string) || ''
        const summary = (d.summary as string) || ''
        const explanation = (d.explanation as string) || ''
        const whyText = (d.whyText ?? d.why_text ?? '') as string
        const routineTitle = (d.routineTitle ?? d.routine_title ?? '') as string
        const routineDescription = (d.routineDescription ?? d.routine_description ?? '') as string
        const resultMessage = (d.resultMessage ?? d.result_message ?? '') as string
        const sortOrder = (d.sortOrder ?? d.sort_order ?? 0) as number
        const isActive = (d.isActive ?? d.is_active ?? true) as boolean
        await query(
          `INSERT INTO analysis_profiles (id, name, slug, title, summary, explanation, why_text, routine_title, routine_description, result_message, sort_order, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
             name = $2, slug = $3, title = $4, summary = $5, explanation = $6, why_text = $7,
             routine_title = $8, routine_description = $9, result_message = $10, sort_order = $11, is_active = $12`,
          [id, name, slug, title, summary, explanation, whyText, routineTitle, routineDescription, resultMessage, sortOrder, isActive]
        )
        break
      }
      case 'score': {
        const { profileId, optionId, points } = data
        await query(
          `INSERT INTO analysis_profile_scores (profile_id, option_id, points) VALUES ($1, $2, $3)
           ON CONFLICT (profile_id, option_id) DO UPDATE SET points = $3`,
          [profileId, optionId, points || 1]
        )
        break
      }
      case 'profileProduct': {
        const { profileId, productId, sortOrder } = data
        await query(
          `INSERT INTO analysis_profile_products (profile_id, product_id, sort_order) VALUES ($1, $2, $3)
           ON CONFLICT (profile_id, product_id) DO UPDATE SET sort_order = $3`,
          [profileId, productId, sortOrder || 0]
        )
        break
      }
      case 'batchOptions': {
        const { questionId, options } = data as {
          questionId: string
          options: Array<{ id: string; label: string; sortOrder: number }>
        }
        if (!questionId || !Array.isArray(options)) {
          return NextResponse.json({ error: 'Sual və cavablar tələb olunur' }, { status: 400 })
        }
        const validOptions = options.filter((o) => o.label?.trim())
        const ids = validOptions.map((o) => o.id)
        if (ids.length > 0) {
          await query(
            `DELETE FROM analysis_options WHERE question_id = $1 AND NOT (id = ANY($2::text[]))`,
            [questionId, ids]
          )
        } else {
          await query('DELETE FROM analysis_options WHERE question_id = $1', [questionId])
        }
        for (const opt of validOptions) {
          await query(
            `INSERT INTO analysis_options (id, question_id, label, sort_order, is_active)
             VALUES ($1, $2, $3, $4, true)
             ON CONFLICT (id) DO UPDATE SET label = $3, sort_order = $4, question_id = $2`,
            [opt.id, questionId, opt.label.trim(), opt.sortOrder]
          )
        }
        break
      }
      default:
        return NextResponse.json({ error: 'Naməlum tip' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin analysis POST error:', err)
    return NextResponse.json({ error: 'Saxlanıla bilmədi' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')
    const profileId = searchParams.get('profileId')
    const optionId = searchParams.get('optionId')
    const productId = searchParams.get('productId')

    switch (type) {
      case 'question':
        await query('DELETE FROM analysis_questions WHERE id = $1', [id])
        break
      case 'option':
        await query('DELETE FROM analysis_options WHERE id = $1', [id])
        break
      case 'profile':
        await query('DELETE FROM analysis_profiles WHERE id = $1', [id])
        break
      case 'score':
        await query('DELETE FROM analysis_profile_scores WHERE profile_id = $1 AND option_id = $2', [profileId, optionId])
        break
      case 'profileProduct':
        await query('DELETE FROM analysis_profile_products WHERE profile_id = $1 AND product_id = $2', [profileId, productId])
        break
      default:
        return NextResponse.json({ error: 'Naməlum tip' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin analysis DELETE error:', err)
    return NextResponse.json({ error: 'Silinmə uğursuz' }, { status: 500 })
  }
}
