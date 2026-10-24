import { query } from './db'
import { loadVariants, parseImages } from './products'
import type { ProductVariant } from './variants'

export interface AnalysisOption {
  id: string
  questionId: string
  label: string
  imageUrl: string | null
  icon: string | null
  sortOrder: number
}

export interface AnalysisQuestion {
  id: string
  prompt: string
  sortOrder: number
  parentOptionId: string | null
  imageUrl: string | null
  icon: string | null
  options: AnalysisOption[]
}

export interface AnalysisProfile {
  id: string
  name: string
  slug: string
  title: string
  summary: string
  explanation: string
  whyText: string
  routineTitle: string
  routineDescription: string
  resultMessage: string
  products: AnalysisProduct[]
}

/** A recommended product, with what the result page needs to add it to the cart directly. */
export interface AnalysisProduct {
  id: string
  name: string
  slug: string
  price: number
  images: string[]
  /** Active size/volume variants; empty when the product has none. */
  variants: ProductVariant[]
  variantImages: boolean
}

export async function getAnalysisQuestions(): Promise<AnalysisQuestion[]> {
  const questionsResult = await query<{
    id: string
    prompt: string
    sort_order: number
    parent_option_id: string | null
    image_url: string | null
    icon: string | null
  }>(
    `SELECT id, prompt, sort_order, parent_option_id, image_url, icon
     FROM analysis_questions
     WHERE is_active = true
     ORDER BY sort_order ASC`
  )

  const optionsResult = await query<{
    id: string
    question_id: string
    label: string
    image_url: string | null
    icon: string | null
    sort_order: number
  }>(
    `SELECT id, question_id, label, image_url, icon, sort_order
     FROM analysis_options
     WHERE is_active = true
     ORDER BY sort_order ASC`
  )

  const optionsByQuestion = new Map<string, AnalysisOption[]>()
  for (const opt of optionsResult.rows) {
    const list = optionsByQuestion.get(opt.question_id) || []
    list.push({
      id: opt.id,
      questionId: opt.question_id,
      label: opt.label,
      imageUrl: opt.image_url,
      icon: opt.icon,
      sortOrder: opt.sort_order,
    })
    optionsByQuestion.set(opt.question_id, list)
  }

  return questionsResult.rows.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    sortOrder: q.sort_order,
    parentOptionId: q.parent_option_id,
    imageUrl: q.image_url,
    icon: q.icon,
    options: optionsByQuestion.get(q.id) || [],
  }))
}

export async function scoreAnalysisProfile(selectedOptionIds: string[]): Promise<AnalysisProfile | null> {
  if (selectedOptionIds.length === 0) return null

  const scoresResult = await query<{ profile_id: string; points: number }>(
    `SELECT profile_id, SUM(points) AS points
     FROM analysis_profile_scores
     WHERE option_id = ANY($1::text[])
     GROUP BY profile_id
     ORDER BY points DESC
     LIMIT 1`,
    [selectedOptionIds]
  )

  const profileId = scoresResult.rows[0]?.profile_id
  if (!profileId) return null
  return loadAnalysisProfile(profileId)
}

/** The result of an earlier analysis (so a returning visitor sees current products and prices). */
export async function getSessionProfile(sessionId: string): Promise<AnalysisProfile | null> {
  const session = await query<{ profile_id: string | null }>(
    'SELECT profile_id FROM analysis_sessions WHERE id = $1',
    [sessionId]
  )
  const profileId = session.rows[0]?.profile_id
  return profileId ? loadAnalysisProfile(profileId) : null
}

async function loadAnalysisProfile(profileId: string): Promise<AnalysisProfile | null> {
  const profileResult = await query<{
    id: string
    name: string
    slug: string
    title: string
    summary: string
    explanation: string | null
    why_text: string | null
    routine_title: string | null
    routine_description: string | null
    result_message: string | null
  }>(
    `SELECT id, name, slug, title, summary, explanation, why_text,
            routine_title, routine_description, result_message
     FROM analysis_profiles
     WHERE id = $1 AND is_active = true`,
    [profileId]
  )

  const profile = profileResult.rows[0]
  if (!profile) return null

  const productsResult = await query<{
    id: string
    name: string
    slug: string
    price: string
    images: unknown
    variant_images: boolean | null
  }>(
    `SELECT p.id, p.name, p.slug, p.price, p.images, p.variant_images
     FROM analysis_profile_products app
     JOIN products p ON p.id = app.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE app.profile_id = $1
       AND COALESCE(p.status, 'active') = 'active'
       AND COALESCE(c.is_active, true) = true
     ORDER BY app.sort_order ASC`,
    [profileId]
  )
  const variantsByProduct = await loadVariants(
    productsResult.rows.map((p) => p.id),
    true
  )

  return {
    id: profile.id,
    name: profile.name,
    slug: profile.slug,
    title: profile.title,
    summary: profile.summary,
    explanation: profile.explanation || '',
    whyText: profile.why_text || '',
    routineTitle: profile.routine_title || '',
    routineDescription: profile.routine_description || '',
    resultMessage: profile.result_message || '',
    products: productsResult.rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      images: parseImages(p.images),
      variants: variantsByProduct.get(p.id) ?? [],
      variantImages: p.variant_images ?? false,
    })),
  }
}
