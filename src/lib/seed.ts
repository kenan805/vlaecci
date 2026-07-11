import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { ensureDb, query } from './db'

export async function runSeed() {
  await ensureDb()

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@vlaecci.com').toLowerCase().trim()
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  const passwordHash = await bcrypt.hash(adminPassword, 10)

  const existingAdmin = await query('SELECT id FROM admins WHERE email = $1', [adminEmail])
  if (existingAdmin.rows.length === 0) {
    await query('INSERT INTO admins (id, email, password_hash) VALUES ($1, $2, $3)', [
      randomUUID(),
      adminEmail,
      passwordHash,
    ])
  } else {
    await query('UPDATE admins SET password_hash = $1 WHERE email = $2', [passwordHash, adminEmail])
  }

  const categories = [
    { id: randomUUID(), name: 'Serumlar', slug: 'serumlar' },
    { id: randomUUID(), name: 'Şampunlar', slug: 'sampunlar' },
    { id: randomUUID(), name: 'Maskalar', slug: 'maskalar' },
  ]

  const categoryIds: Record<string, string> = {}
  for (const cat of categories) {
    const existing = await query('SELECT id FROM categories WHERE slug = $1', [cat.slug])
    if (existing.rows.length === 0) {
      await query('INSERT INTO categories (id, name, slug) VALUES ($1, $2, $3)', [cat.id, cat.name, cat.slug])
      categoryIds[cat.slug] = cat.id
    } else {
      categoryIds[cat.slug] = existing.rows[0].id
    }
  }

  const products = [
    {
      name: 'Saç Böyümə Serumu',
      slug: 'sac-boyume-serumu',
      description: 'Saç köklərini gücləndirən, dökülməni azaldan intensiv serum. Dermatoloq təsdiqli formula.',
      price: 45,
      images: ['https://placehold.co/600x800/f5f0e8/5c4033?text=Serum'],
      categorySlug: 'serumlar',
    },
    {
      name: 'Həcm Verən Şampun',
      slug: 'hecm-veren-sampun',
      description: 'İncə və zəif saçlar üçün həcm verən, təbii komponentli şampun.',
      price: 28,
      images: ['https://placehold.co/600x800/f5f0e8/5c4033?text=Sampun'],
      categorySlug: 'sampunlar',
    },
    {
      name: 'Bərpaedici Saç Maskası',
      slug: 'berpaedici-sac-maskasi',
      description: 'Quru və zədələnmiş saçlar üçün dərin nəmləndirici maska.',
      price: 35,
      images: ['https://placehold.co/600x800/f5f0e8/5c4033?text=Maska'],
      categorySlug: 'maskalar',
    },
  ]

  for (const p of products) {
    const existing = await query('SELECT id FROM products WHERE slug = $1', [p.slug])
    if (existing.rows.length === 0) {
      await query(
        'INSERT INTO products (id, name, slug, description, price, images, category_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          randomUUID(),
          p.name,
          p.slug,
          p.description,
          p.price,
          JSON.stringify(p.images),
          categoryIds[p.categorySlug],
        ]
      )
    }
  }

  const discountExisting = await query('SELECT id FROM discount_codes WHERE code = $1', ['VLAECCI10'])
  if (discountExisting.rows.length === 0) {
    await query(
      'INSERT INTO discount_codes (id, code, percentage, is_active) VALUES ($1, $2, $3, $4)',
      [randomUUID(), 'VLAECCI10', 10, true]
    )
  }

  await seedAnalysisData()

  return { success: true, adminEmail }
}

export async function seedAnalysisData() {
  await ensureDb()

  const existing = await query('SELECT id FROM analysis_questions LIMIT 1')
  if (existing.rows.length > 0) return

  const q1Id = randomUUID()
  const q2Id = randomUUID()
  const q3Id = randomUUID()
  const q4Id = randomUUID()

  const o1a = randomUUID()
  const o1b = randomUUID()
  const o1c = randomUUID()
  const o2a = randomUUID()
  const o2b = randomUUID()
  const o2c = randomUUID()
  const o2d = randomUUID()
  const o3a = randomUUID()
  const o3b = randomUUID()
  const o3c = randomUUID()
  const o3d = randomUUID()
  const o4a = randomUUID()
  const o4b = randomUUID()
  const o4c = randomUUID()

  const profileLoss = randomUUID()
  const profileDry = randomUUID()
  const profileNormal = randomUUID()

  const products = await query<{ id: string; slug: string }>('SELECT id, slug FROM products')
  const serum = products.rows.find((p) => p.slug === 'sac-boyume-serumu')
  const shampoo = products.rows.find((p) => p.slug === 'hecm-veren-sampun')
  const mask = products.rows.find((p) => p.slug === 'berpaedici-sac-maskasi')

  await query(`INSERT INTO analysis_questions (id, prompt, sort_order, is_active) VALUES
    ($1, 'Əsas saç probleminiz nədir?', 0, true),
    ($2, 'Saç tipiniz necədir?', 1, true),
    ($3, 'Saçlı dərinizin vəziyyəti necədir?', 2, true),
    ($4, 'Saç dökülmə səviyyəniz necədir?', 3, true)`,
    [q1Id, q2Id, q3Id, q4Id]
  )

  await query(`UPDATE analysis_questions SET parent_option_id = $1 WHERE id = $2`, [o1a, q4Id])

  await query(`INSERT INTO analysis_options (id, question_id, label, sort_order) VALUES
    ($1, $2, 'Saç tökülməsi', 0), ($3, $2, 'Quru və zəif saç', 1), ($4, $2, 'Yağlı saçlı dəri', 2),
    ($5, $6, 'İncə və nazik', 0), ($7, $6, 'Normal', 1), ($8, $6, 'Qalın', 2), ($9, $6, 'Buruq', 3),
    ($10, $11, 'Yağlı', 0), ($12, $11, 'Quru', 1), ($13, $11, 'Normal', 2), ($14, $11, 'Həssas', 3),
    ($15, $16, 'Yüngül', 0), ($17, $16, 'Orta', 1), ($18, $16, 'Ciddi', 2)`,
    [o1a, q1Id, o1b, o1c, o2a, q2Id, o2b, o2c, o2d, o3a, q3Id, o3b, o3c, o3d, o4a, q4Id, o4b, o4c]
  )

  await query(`INSERT INTO analysis_profiles (id, name, slug, title, summary, explanation, why_text, routine_title, routine_description, result_message, sort_order) VALUES
    ($1, 'Saç tökülməsi', 'sac-tokulmesi', 'Saç tökülməsi profili',
     'Saç köklərinizi gücləndirmək və dökülməni azaltmaq lazımdır.',
     'Cavablarınıza əsasən saç folikullarınızın zəifləməsi və dökülmə tendensiyası müşahidə olunur.',
     'Saç tökülməsi problemi seçdiyiniz və dökülmə səviyyəniz bu nəticəni formalaşdırıb.',
     'Gündəlik qulluq rutini', '1. Böyümə serumu ilə saç köklərinə masaj edin.\n2. Zəiflədici şampundan istifadə edin.\n3. Həftədə 2 dəfə bərpaedici maska tətbiq edin.',
     'Bu rutin 4-6 həftə ərzində nəticə verməyə başlaya bilər.', 0),
    ($2, 'Quru saç', 'quru-sac', 'Quru saç profili',
     'Saçlarınızın dərin nəmləndirilməsi və bərpası lazımdır.',
     'Saçlarınız kifayət qədər nəmlənmir və zəifləyib.',
     'Quru saç tipi və saçlı dəri vəziyyətiniz bu profili göstərir.',
     'Nəmləndirici rutin', '1. Nəmləndirici şampun istifadə edin.\n2. Həftədə 2-3 dəfə bərpaedici maska tətbiq edin.',
     'Davamlı istifadə ilə saçlarınız daha yumşaq və parlaq olacaq.', 1),
    ($3, 'Normal saç', 'normal-sac', 'Balanslı saç profili',
     'Saçlarınız ümumilikdə sağlamdır, profilaktik qulluq tövsiyə olunur.',
     'Saç və saçlı dəriniz balanslı vəziyyətdədir.',
     'Cavablarınız sağlam saç strukturu göstərir.',
     'Profilaktik rutin', '1. Keyfiyyətli şampun istifadə edin.\n2. Həftədə bir dəfə maska tətbiq edin.',
     'Mövcud sağlamlığı qorumaq üçün davamlı qulluq vacibdir.', 2)`,
    [profileLoss, profileDry, profileNormal]
  )

  const scores: [string, string][] = [
    [profileLoss, o1a], [profileLoss, o4b], [profileLoss, o4c],
    [profileDry, o1b], [profileDry, o3b], [profileDry, o2a],
    [profileNormal, o2b], [profileNormal, o3c],
  ]
  for (const [pid, oid] of scores) {
    await query('INSERT INTO analysis_profile_scores (profile_id, option_id, points) VALUES ($1, $2, 1)', [pid, oid])
  }

  if (serum) await query('INSERT INTO analysis_profile_products (profile_id, product_id, sort_order) VALUES ($1, $2, 0)', [profileLoss, serum.id])
  if (shampoo) await query('INSERT INTO analysis_profile_products (profile_id, product_id, sort_order) VALUES ($1, $2, 1)', [profileLoss, shampoo.id])
  if (mask) await query('INSERT INTO analysis_profile_products (profile_id, product_id, sort_order) VALUES ($1, $2, 0)', [profileDry, mask.id])
  if (shampoo) await query('INSERT INTO analysis_profile_products (profile_id, product_id, sort_order) VALUES ($1, $2, 0)', [profileNormal, shampoo.id])
}
