import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { randomUUID } from 'crypto'
import { query, ensureDb } from '../src/lib/db'

// --- load .env.local (copied from scripts/seed.ts) -------------------------
function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvLocal()

// --- helpers ---------------------------------------------------------------
function slugify(input: string): string {
  const map: Record<string, string> = {
    ə: 'e', Ə: 'e',
    ı: 'i', I: 'i', İ: 'i', i: 'i',
    ö: 'o', Ö: 'o',
    ü: 'u', Ü: 'u',
    ş: 's', Ş: 's',
    ç: 'c', Ç: 'c',
    ğ: 'g', Ğ: 'g',
  }
  const replaced = input.replace(/[əƏıIİöÖüÜşŞçÇğĞ]/g, (ch) => map[ch] ?? ch)
  return replaced
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function placeholder(text: string): string {
  return `https://placehold.co/600x800/EDE6DA/4A3D32?text=${encodeURIComponent(text)}`
}

// --- data ------------------------------------------------------------------
const CATEGORIES = [
  { name: 'Şampunlar', slug: 'sampunlar' },
  { name: 'Serumlar', slug: 'serumlar' },
  { name: 'Maskalar', slug: 'maskalar' },
  { name: 'Kondisionerlər', slug: 'kondisionerler' },
  { name: 'Saç Yağları', slug: 'sac-yaglari' },
  { name: 'Vitamin və Əlavələr', slug: 'vitamin-elaveler' },
]

interface ProductSeed {
  name: string
  short: string
  categorySlug: string
  description: string
  ingredients: string
  how_to_use: string
  price: number
}

const PRODUCTS: ProductSeed[] = [
  {
    name: 'Kofeinli Saç Tökülməsinə Qarşı Şampun',
    short: 'Kofein Şampun',
    categorySlug: 'sampunlar',
    description:
      'Kofein və biotinlə zənginləşdirilmiş bu şampun saç köklərini stimullaşdırır və tökülməni azaldır. Saçlı dərini canlandıraraq daha güclü və sıx saç görünüşü yaradır. Gündəlik istifadə üçün uyğundur.',
    ingredients: 'Kofein, Biotin, Niasinamid, Pantenol, Arginin, Saw Palmetto ekstraktı',
    how_to_use:
      '1. Saçınızı isladın və şampunu saçlı dəriyə yayın.\n2. 2-3 dəqiqə dairəvi hərəkətlərlə masaj edin.\n3. Bol su ilə yaxalayın, gündə və ya gündən-günə təkrarlayın.',
    price: 32,
  },
  {
    name: 'Kəpəyə Qarşı Çay Ağacı Şampunu',
    short: 'Çay Ağacı Şampun',
    categorySlug: 'sampunlar',
    description:
      'Çay ağacı yağı və salisil turşusu ilə saçlı dərini kəpəkdən təmizləyir və qıcıqlanmanı sakitləşdirir. Yağlı saçlı dəri üçün balanslaşdırıcı təsir göstərir. Sərinləşdirici mentol hissi verir.',
    ingredients: 'Çay ağacı yağı, Salisil turşusu, Sink piriton, Mentol, Aloe Vera',
    how_to_use:
      '1. Nəm saça tətbiq edərək köpük əmələ gətirin.\n2. Saçlı dəriyə yüngülcə masaj edin və 3 dəqiqə gözləyin.\n3. Yaxalayın, həftədə 2-3 dəfə istifadə edin.',
    price: 27,
  },
  {
    name: 'Saç Böyümə Serumu',
    short: 'Böyümə Serumu',
    categorySlug: 'serumlar',
    description:
      'Saç köklərini gücləndirən və böyümə fazasını dəstəkləyən intensiv gecə serumu. Rozmarin yağı və biotin qan dövranını artıraraq yeni tüklərin çıxmasını təşviq edir. Yağsız formulası ağırlıq hissi yaratmır.',
    ingredients: 'Biotin, Kofein, Rozmarin yağı, Niasinamid, Keratin, Pantenol',
    how_to_use:
      '1. Təmiz və qurudulmuş saçlı dəriyə bir neçə damcı tətbiq edin.\n2. Barmaq ucları ilə masaj edərək hopdurun.\n3. Yaxalamayın, gecə boyu saxlayın, hər gün istifadə edin.',
    price: 48,
  },
  {
    name: 'Kofein Saç Serumu',
    short: 'Kofein Serumu',
    categorySlug: 'serumlar',
    description:
      'Yüngül teksturlu kofein serumu saçlı dərini enerjiləndirir və zəif saçları canlandırır. Niasinamid saçlı dərinin sağlamlığını dəstəkləyir. Nəmləndirici hialuron turşusu ilə tarazlanmışdır.',
    ingredients: 'Kofein, Niasinamid, Hialuron turşusu, Pantenol, B5 vitamini',
    how_to_use:
      '1. Yuyulmuş, tövşəmiş saçlı dəriyə tətbiq edin.\n2. Bir dəqiqə masaj edin.\n3. Adi qulluğunuza davam edin, gün aşırı istifadə edin.',
    price: 39,
  },
  {
    name: 'Keratin Bərpa Maskası',
    short: 'Keratin Maska',
    categorySlug: 'maskalar',
    description:
      'Zədələnmiş və kövrək saçları keratinlə yenidən quran dərin bərpa maskası. Argan yağı və protein saç lifini içəridən gücləndirir. Boyalı və isti alətlə formalaşdırılan saçlar üçün idealdır.',
    ingredients: 'Keratin, Argan yağı, Şi yağı, Pantenol, Hidrolizə olunmuş protein',
    how_to_use:
      '1. Yuduqdan sonra saçın uzunluğuna tətbiq edin.\n2. 5-10 dəqiqə gözləyin.\n3. Yaxalayın, həftədə 2 dəfə istifadə edin.',
    price: 42,
  },
  {
    name: 'Dərin Nəmləndirici Saç Maskası',
    short: 'Nəm Maska',
    categorySlug: 'maskalar',
    description:
      'Quru və cansız saçlara intensiv nəmləndirmə bəxş edən qidalandırıcı maska. Şi yağı və kokos yağı saçı yumşaldır və parlaqlıq qatır. Elektriklənmə və dolaşmanı azaldır.',
    ingredients: 'Şi yağı, Kokos yağı, Aloe Vera, Gliserin, E vitamini',
    how_to_use:
      '1. Nəm saça bərabər şəkildə yayın.\n2. 10 dəqiqə təsir etməsini gözləyin.\n3. Ilıq su ilə yaxalayın, həftədə 2-3 dəfə tətbiq edin.',
    price: 36,
  },
  {
    name: 'Həcm Verən Kondisioner',
    short: 'Həcm Kondisioner',
    categorySlug: 'kondisionerler',
    description:
      'İncə və həcmsiz saçlara dolğunluq qazandıran yüngül kondisioner. Buğda proteini saç lifini qalınlaşdırır, ağırlıq yaratmadan həcm verir. Saçı yumşaq və idarəolunan edir.',
    ingredients: 'Biotin, Buğda proteini, Pantenol, Bambuk ekstraktı, Argan yağı',
    how_to_use:
      '1. Şampundan sonra saçın uc hissəsinə tətbiq edin.\n2. 2 dəqiqə gözləyin.\n3. Yaxalayın, hər yuyunmada istifadə edin.',
    price: 29,
  },
  {
    name: 'Argan Saç Yağı',
    short: 'Argan Yağı',
    categorySlug: 'sac-yaglari',
    description:
      'Mərakeş argan yağı əsaslı bu qidalandırıcı yağ saça parlaqlıq və yumşaqlıq bəxş edir. Ucları qorumaqla dolaşma və qırılmanın qarşısını alır. Yağlanma hissi yaratmadan hopur.',
    ingredients: 'Argan yağı, Jojoba yağı, E vitamini, F vitamini',
    how_to_use:
      '1. Nəm və ya quru saçın uc hissəsinə bir neçə damcı tətbiq edin.\n2. Ovucda isidib saça yayın.\n3. Yaxalamayın, gündəlik istifadə oluna bilər.',
    price: 34,
  },
  {
    name: 'Rozmarin Saçlı Dəri Yağı',
    short: 'Rozmarin Yağı',
    categorySlug: 'sac-yaglari',
    description:
      'Rozmarin və nanə yağı ilə saçlı dərinin qan dövranını artıran canlandırıcı yağ. Saç köklərini qidalandırır və sağlam böyüməni dəstəkləyir. Həftəlik masaj rutini üçün idealdır.',
    ingredients: 'Rozmarin yağı, Nanə yağı, Ricinus (kastor) yağı, Jojoba yağı',
    how_to_use:
      '1. Yuyunmadan əvvəl saçlı dəriyə tətbiq edin.\n2. 5-10 dəqiqə dairəvi masaj edin, 30 dəqiqə saxlayın.\n3. Şampunla yaxalayın, həftədə 1-2 dəfə təkrarlayın.',
    price: 31,
  },
  {
    name: 'Biotin Saç Vitaminləri',
    short: 'Biotin Vitamin',
    categorySlug: 'vitamin-elaveler',
    description:
      'Saç, dəri və dırnağı içəridən dəstəkləyən biotin əsaslı qida əlavəsi. Sink və vitaminlər saç köklərinin qidalanmasına kömək edir. Gündəlik bir kapsul ilə sağlam saç böyüməsini dəstəkləyir.',
    ingredients: 'Biotin, Sink, Selen, C vitamini, D vitamini, Folik turşu',
    how_to_use:
      '1. Gündə 1 kapsul qəbul edin.\n2. Yeməklə birlikdə su ilə için.\n3. Ən yaxşı nəticə üçün ən azı 3 ay davam etdirin.',
    price: 45,
  },
]

interface ReviewSeed {
  author: string
  hair_type: string
  rating: number
  comment: string
}

const REVIEWS: Record<string, ReviewSeed[]> = {
  'kofeinli-sac-tokulmesine-qarsi-sampun': [
    { author: 'Leyla', hair_type: 'incə', rating: 5, comment: 'Bir aydır istifadə edirəm, tökülmə nəzərəçarpacaq dərəcədə azalıb. Çox məmnunam.' },
    { author: 'Aysel', hair_type: 'normal', rating: 4, comment: 'Saçlarım daha güclü hiss olunur, qoxusu da çox xoşdur.' },
    { author: 'Nigar', hair_type: 'yagli', rating: 5, comment: 'Saçlı dərim təmiz qalır və düşən tüklərin sayı azaldı.' },
  ],
  'kepeye-qarsi-cay-agaci-sampunu': [
    { author: 'Günel', hair_type: 'yagli', rating: 5, comment: 'Kəpəyim demək olar ki, tamamilə keçdi. Sərinləşdirici hissi çox xoşuma gəlir.' },
    { author: 'Səbinə', hair_type: 'normal', rating: 4, comment: 'İlk həftədən qaşınma dayandı, saçlarım daha yüngüldür.' },
    { author: 'Mələk', hair_type: 'quru', rating: 4, comment: 'Kəpəyə qarşı təsirlidir, amma quru saç üçün maska ilə birlikdə istifadə edirəm.' },
  ],
  'sac-boyume-serumu': [
    { author: 'Fidan', hair_type: 'incə', rating: 5, comment: 'İki ay sonra alın hissəmdə yeni tüklər çıxmağa başladı, inanılmazdır!' },
    { author: 'Zəhra', hair_type: 'normal', rating: 5, comment: 'Saçlarım daha sıx görünür, yağlı qalmır və rahat hopur.' },
    { author: 'Aygün', hair_type: 'quru', rating: 4, comment: 'Nəticə üçün səbir lazımdır, amma dəyər. Tökülmə azaldı.' },
    { author: 'Türkan', hair_type: 'buruq', rating: 5, comment: 'Hər gecə istifadə edirəm, saç köklərim möhkəmlənib.' },
  ],
  'kofein-sac-serumu': [
    { author: 'Leyla', hair_type: 'yagli', rating: 4, comment: 'Yüngül teksturu var, saçlı dərimi ağırlaşdırmır. Bəyəndim.' },
    { author: 'Nigar', hair_type: 'incə', rating: 5, comment: 'Saçlarım daha canlı və enerjili görünür. Davam edəcəyəm.' },
  ],
  'keratin-berpa-maskasi': [
    { author: 'Aysel', hair_type: 'quru', rating: 5, comment: 'Boyadılmış saçlarım ilk istifadədən sonra ipək kimi oldu.' },
    { author: 'Mələk', hair_type: 'buruq', rating: 5, comment: 'Qırıq uclarım azaldı, saçlarım daha asan daranır.' },
    { author: 'Günel', hair_type: 'quru', rating: 4, comment: 'Ütü istifadə etsəm də saçlarım zədələnmir artıq. Əla məhsuldur.' },
  ],
  'derin-nemlendirici-sac-maskasi': [
    { author: 'Səbinə', hair_type: 'quru', rating: 5, comment: 'Quru saçlarım üçün xilaskardır, elektriklənmə tamamilə bitdi.' },
    { author: 'Fidan', hair_type: 'buruq', rating: 4, comment: 'Saçlarım yumşaldı və parlaqlıq qazandı, qoxusu da təbiidir.' },
    { author: 'Aygün', hair_type: 'normal', rating: 5, comment: 'Həftədə iki dəfə istifadə edirəm, saçlarım çox nəmləndi.' },
  ],
  'hecm-veren-kondisioner': [
    { author: 'Türkan', hair_type: 'incə', rating: 5, comment: 'Nəhayət saçlarıma həcm verən bir məhsul tapdım! Ağırlaşdırmır.' },
    { author: 'Zəhra', hair_type: 'incə', rating: 4, comment: 'Saçlarım daha dolğun görünür, darağı asan keçir.' },
    { author: 'Leyla', hair_type: 'normal', rating: 4, comment: 'Yüngüldür və saçlarımı yumşaq edir, bəyəndim.' },
  ],
  'argan-sac-yagi': [
    { author: 'Nigar', hair_type: 'quru', rating: 5, comment: 'Uclarıma sürtürəm, parlaqlıq verir və heç yağlı qalmır.' },
    { author: 'Mələk', hair_type: 'buruq', rating: 5, comment: 'Buruq saçlarımı idarə etmək asanlaşdı, dolaşma bitdi.' },
    { author: 'Aysel', hair_type: 'normal', rating: 4, comment: 'Az miqdar kifayət edir, uzun müddət davam edir.' },
  ],
  'rozmarin-sacli-deri-yagi': [
    { author: 'Günel', hair_type: 'normal', rating: 5, comment: 'Həftədə iki dəfə masaj edirəm, saçlı dərim daha sağlam hiss olunur.' },
    { author: 'Fidan', hair_type: 'yagli', rating: 4, comment: 'Qoxusu təravətlidir, saç köklərim güclənib. Tövsiyə edirəm.' },
  ],
  'biotin-sac-vitaminleri': [
    { author: 'Aygün', hair_type: 'incə', rating: 5, comment: 'Üç ay istifadədən sonra saçlarım və dırnaqlarım çox möhkəmləndi.' },
    { author: 'Zəhra', hair_type: 'normal', rating: 4, comment: 'Saç tökülməm azaldı, gündə bir kapsul rahatdır.' },
    { author: 'Səbinə', hair_type: 'quru', rating: 5, comment: 'Kompleks qulluğun bir hissəsi kimi əla nəticə verir.' },
  ],
}

// --- main ------------------------------------------------------------------
async function main() {
  await ensureDb()
  await query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true')

  // Clear existing content (FK-safe order). Keep admins + discount_codes.
  await query('DELETE FROM analysis_sessions')
  await query('DELETE FROM analysis_profile_products')
  await query('DELETE FROM analysis_profile_scores')
  await query('DELETE FROM product_reviews')
  await query('DELETE FROM product_view_events')
  await query('DELETE FROM analysis_options')
  await query('DELETE FROM analysis_questions')
  await query('DELETE FROM analysis_profiles')
  await query('DELETE FROM products')
  await query('DELETE FROM categories')

  // Categories
  const categoryIds: Record<string, string> = {}
  for (const cat of CATEGORIES) {
    const id = randomUUID()
    categoryIds[cat.slug] = id
    await query('INSERT INTO categories (id, name, slug, is_active) VALUES ($1, $2, $3, $4)', [
      id,
      cat.name,
      cat.slug,
      true,
    ])
  }

  // Products
  const productIds: Record<string, string> = {} // slug -> id
  for (const p of PRODUCTS) {
    const id = randomUUID()
    const slug = slugify(p.name)
    productIds[slug] = id
    const total = rand(40, 900)
    const unique = Math.round(total * (0.6 + Math.random() * 0.2))
    await query(
      `INSERT INTO products
        (id, name, slug, description, ingredients, how_to_use, price, images, category_id, status, total_views, unique_views, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, NOW())`,
      [
        id,
        p.name,
        slug,
        p.description,
        p.ingredients,
        p.how_to_use,
        p.price,
        JSON.stringify([placeholder(p.short)]),
        categoryIds[p.categorySlug],
        'active',
        total,
        unique,
      ]
    )
  }

  // Reviews
  let reviewCount = 0
  for (const [slug, reviews] of Object.entries(REVIEWS)) {
    const productId = productIds[slug]
    if (!productId) {
      throw new Error(`Review references unknown product slug: ${slug}`)
    }
    for (const r of reviews) {
      const daysAgo = rand(1, 120)
      await query(
        `INSERT INTO product_reviews (id, product_id, author_name, hair_type, rating, comment, is_active, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, NOW() - ($8 || ' days')::interval)`,
        [randomUUID(), productId, r.author, r.hair_type, r.rating, r.comment, true, String(daysAgo)]
      )
      reviewCount++
    }
  }

  // --- Analysis quiz -------------------------------------------------------
  // Root questions
  const qProblem = randomUUID()
  const qType = randomUUID()
  const qScalp = randomUUID()
  const qWash = randomUUID()
  // Sub-questions
  const qLossSince = randomUUID()
  const qHeat = randomUUID()

  // Options (declare ids)
  // Q: Əsas saç probleminiz nədir?
  const oLoss = randomUUID()
  const oDry = randomUUID()
  const oOily = randomUUID()
  const oThin = randomUUID()
  // Q: Saç tipiniz necədir?
  const oTypeFine = randomUUID()
  const oTypeNormal = randomUUID()
  const oTypeThick = randomUUID()
  const oTypeCurly = randomUUID()
  // Q: Saçlı dərinizin vəziyyəti?
  const oScalpOily = randomUUID()
  const oScalpDry = randomUUID()
  const oScalpNormal = randomUUID()
  const oScalpDandruff = randomUUID()
  // Q: Nə qədər tez-tez yuyursunuz?
  const oWashDaily = randomUUID()
  const oWashEveryOther = randomUUID()
  const oWash23 = randomUUID()
  const oWashWeekly = randomUUID()
  // Sub Q: Saç tökülməsi nə vaxtdan?
  const oSinceWeeks = randomUUID()
  const oSinceMonths = randomUUID()
  const oSinceYear = randomUUID()
  // Sub Q: İsti alət istifadəsi?
  const oHeatDaily = randomUUID()
  const oHeatSometimes = randomUUID()
  const oHeatNever = randomUUID()

  // Insert root questions
  await query(
    `INSERT INTO analysis_questions (id, prompt, sort_order, is_active) VALUES
      ($1,'Əsas saç probleminiz nədir?',0,true),
      ($2,'Saç tipiniz necədir?',1,true),
      ($3,'Saçlı dərinizin vəziyyəti necədir?',2,true),
      ($4,'Saçınızı nə qədər tez-tez yuyursunuz?',3,true)`,
    [qProblem, qType, qScalp, qWash]
  )

  // Insert sub-questions (parent_option_id set after we know option ids;
  // insert with parent references — options are inserted below, but the
  // parent_option_id is a plain TEXT column with no FK, so order is flexible)
  await query(
    `INSERT INTO analysis_questions (id, prompt, sort_order, is_active, parent_option_id) VALUES
      ($1,'Saç tökülməsi nə vaxtdan başlayıb?',4,true,$2),
      ($3,'Saçınızı nə qədər tez-tez isti alətlə (fen, ütü) formalaşdırırsınız?',5,true,$4)`,
    [qLossSince, oLoss, qHeat, oDry]
  )

  // Insert options
  await query(
    `INSERT INTO analysis_options (id, question_id, label, sort_order, is_active) VALUES
      ($1,$2,'Saç tökülməsi',0,true),
      ($3,$2,'Quru və zədələnmiş saç',1,true),
      ($4,$2,'Yağlı saçlı dəri',2,true),
      ($5,$2,'Həcmsizlik / incə saç',3,true),

      ($6,$7,'İncə və nazik',0,true),
      ($8,$7,'Normal',1,true),
      ($9,$7,'Qalın',2,true),
      ($10,$7,'Buruq',3,true),

      ($11,$12,'Yağlı',0,true),
      ($13,$12,'Quru / qıcıqlanmış',1,true),
      ($14,$12,'Normal',2,true),
      ($15,$12,'Kəpəkli',3,true),

      ($16,$17,'Hər gün',0,true),
      ($18,$17,'Gündən-günə',1,true),
      ($19,$17,'Həftədə 2-3 dəfə',2,true),
      ($20,$17,'Həftədə 1 dəfə',3,true),

      ($21,$22,'Son bir neçə həftə',0,true),
      ($23,$22,'Bir neçə aydır',1,true),
      ($24,$22,'Bir ildən çoxdur',2,true),

      ($25,$26,'Bəli, demək olar hər gün',0,true),
      ($27,$26,'Bəzən',1,true),
      ($28,$26,'Xeyr, demək olar heç vaxt',2,true)`,
    [
      oLoss, qProblem, oDry, oOily, oThin,
      oTypeFine, qType, oTypeNormal, oTypeThick, oTypeCurly,
      oScalpOily, qScalp, oScalpDry, oScalpNormal, oScalpDandruff,
      oWashDaily, qWash, oWashEveryOther, oWash23, oWashWeekly,
      oSinceWeeks, qLossSince, oSinceMonths, oSinceYear,
      oHeatDaily, qHeat, oHeatSometimes, oHeatNever,
    ]
  )

  // Profiles
  const pLoss = randomUUID()
  const pDry = randomUUID()
  const pOily = randomUUID()
  const pThin = randomUUID()
  const pHealthy = randomUUID()

  await query(
    `INSERT INTO analysis_profiles
      (id, name, slug, title, summary, explanation, why_text, routine_title, routine_description, result_message, sort_order, is_active) VALUES
      ($1,'Saç tökülməsi','sac-tokulmesi','Saç tökülməsi profili',
        'Saç köklərinizi gücləndirmək və tökülməni azaltmaq üçün hədəflənmiş qulluq lazımdır.',
        'Cavablarınıza əsasən saç folikullarınız zəifləyib və tökülmə tendensiyası müşahidə olunur. Köklərin qidalanması və qan dövranının artırılması prioritetdir.',
        'Əsas problem olaraq saç tökülməsini seçdiniz və tökülmənin müddəti bu nəticəni formalaşdırdı.',
        'Saç tökülməsinə qarşı rutin',
        '1. Kofeinli şampunla saçlı dəriyə masaj edərək yuyun.\n2. Böyümə serumunu hər gecə köklərə tətbiq edin.\n3. Rozmarin yağı ilə həftədə 2 dəfə saçlı dəri masajı edin.\n4. Biotin vitaminlərini gündəlik qəbul edin.',
        'Bu rutin 6-8 həftə ərzində nəzərəçarpacaq nəticə verməyə başlaya bilər.',0,true),

      ($2,'Quru & zədələnmiş saç','quru-zedelenmis-sac','Quru və zədələnmiş saç profili',
        'Saçlarınızın dərin nəmləndirilməsi və protein bərpası lazımdır.',
        'Saç lifiniz nəmini itirib və isti alət, boya kimi amillərdən zədələnib. Nəmləndirmə və keratin bərpası əsas fokusdur.',
        'Quru/zədələnmiş saç problemi və isti alət istifadə vərdişiniz bu profili göstərir.',
        'Nəmləndirici bərpa rutini',
        '1. Yumşaq şampunla yuyun, saçlı dərini qıcıqlandırmayın.\n2. Hər yuyunmada nəmləndirici maskadan istifadə edin.\n3. Həftədə 2 dəfə keratin bərpa maskası tətbiq edin.\n4. Uclara argan yağı sürtərək qırılmanı önləyin.',
        'Davamlı istifadə ilə saçlarınız 3-4 həftədə daha yumşaq və parlaq olacaq.',1,true),

      ($3,'Yağlı saçlı dəri','yagli-sacli-deri','Yağlı saçlı dəri profili',
        'Saçlı dərinin yağ balansını tənzimləmək və təravəti qorumaq lazımdır.',
        'Saçlı dəriniz artıq piy ifraz edir və bu, tez yağlanmaya, bəzən kəpəyə səbəb olur. Balanslaşdırıcı və dərini sakitləşdirən qulluq tövsiyə olunur.',
        'Yağlı saçlı dəri və tez-tez yuyunma vərdişiniz bu nəticəyə gətirdi.',
        'Balanslaşdırıcı rutin',
        '1. Çay ağacı şampunu ilə saçlı dərini nəzakətlə təmizləyin.\n2. Kondisioneri yalnız uclara tətbiq edin.\n3. Rozmarin yağı ilə həftədə 1 dəfə yüngül masaj edin.\n4. Saçlı dəriyə ağır yağlar sürtməkdən çəkinin.',
        'Doğru qulluqla saçlı dəriniz daha uzun müddət təravətli qalacaq.',2,true),

      ($4,'İncə & həcmsiz saç','ince-hecmsiz-sac','İncə və həcmsiz saç profili',
        'Saçlarınıza ağırlıq yaratmadan həcm və dolğunluq qazandırmaq lazımdır.',
        'Saç lifiniz nazikdir və tez yastılaşır. Yüngül, həcm verən məhsullar və kökləri gücləndirən qulluq uyğundur.',
        'İncə saç tipiniz və həcmsizlik şikayətiniz bu profili müəyyən etdi.',
        'Həcm verən rutin',
        '1. Həcm verən kondisioneri yalnız uclara tətbiq edin.\n2. Kofein serumu ilə köklərə enerji verin.\n3. Biotin vitaminlərini gündəlik qəbul edin.\n4. Ağır yağlardan çəkinin, yüngül formulaları seçin.',
        'Bu rutin saçlarınıza gözlə görünən dolğunluq və canlılıq qazandıracaq.',3,true),

      ($5,'Sağlam & balanslı saç','saglam-balansli-sac','Sağlam və balanslı saç profili',
        'Saçlarınız sağlamdır; mövcud tarazlığı qorumaq üçün profilaktik qulluq tövsiyə olunur.',
        'Saç və saçlı dəriniz balanslı vəziyyətdədir. Məqsəd sağlamlığı qorumaq və mövsümi stress amillərindən qorunmaqdır.',
        'Cavablarınız sağlam saç strukturu və balanslı saçlı dəri göstərir.',
        'Profilaktik qulluq rutini',
        '1. Keyfiyyətli şampunla müntəzəm yuyun.\n2. Həftədə 1 dəfə nəmləndirici maska tətbiq edin.\n3. Uclara az miqdarda argan yağı sürtün.\n4. Balanslı qidalanma ilə saç sağlamlığını dəstəkləyin.',
        'Mövcud sağlamlığı qorumaq üçün davamlı və yüngül qulluq kifayətdir.',4,true)`,
    [pLoss, pDry, pOily, pThin, pHealthy]
  )

  // Profile scores (option -> profile, points 1)
  const scores: Array<[string, string]> = [
    // Saç tökülməsi
    [pLoss, oLoss],
    [pLoss, oSinceMonths],
    [pLoss, oSinceYear],
    // Quru & zədələnmiş
    [pDry, oDry],
    [pDry, oScalpDry],
    [pDry, oHeatDaily],
    // Yağlı saçlı dəri
    [pOily, oOily],
    [pOily, oScalpOily],
    [pOily, oWashDaily],
    // İncə & həcmsiz
    [pThin, oThin],
    [pThin, oTypeFine],
    // Sağlam & balanslı
    [pHealthy, oTypeNormal],
    [pHealthy, oScalpNormal],
  ]
  for (const [pid, oid] of scores) {
    await query(
      'INSERT INTO analysis_profile_scores (profile_id, option_id, points) VALUES ($1, $2, 1)',
      [pid, oid]
    )
  }

  // Profile -> products recommendations
  const recs: Array<[string, string[]]> = [
    [pLoss, ['sac-boyume-serumu', 'kofeinli-sac-tokulmesine-qarsi-sampun', 'biotin-sac-vitaminleri']],
    [pDry, ['keratin-berpa-maskasi', 'derin-nemlendirici-sac-maskasi', 'argan-sac-yagi']],
    [pOily, ['kepeye-qarsi-cay-agaci-sampunu', 'rozmarin-sacli-deri-yagi']],
    [pThin, ['hecm-veren-kondisioner', 'kofein-sac-serumu', 'biotin-sac-vitaminleri']],
    [pHealthy, ['argan-sac-yagi', 'derin-nemlendirici-sac-maskasi']],
  ]
  for (const [pid, slugs] of recs) {
    let order = 0
    for (const slug of slugs) {
      const productId = productIds[slug]
      if (!productId) throw new Error(`Recommendation references unknown product slug: ${slug}`)
      await query(
        'INSERT INTO analysis_profile_products (profile_id, product_id, sort_order) VALUES ($1, $2, $3)',
        [pid, productId, order++]
      )
    }
  }

  // --- summary -------------------------------------------------------------
  const counts = {
    categories: (await query('SELECT COUNT(*)::int AS c FROM categories')).rows[0].c,
    products: (await query('SELECT COUNT(*)::int AS c FROM products')).rows[0].c,
    reviews: (await query('SELECT COUNT(*)::int AS c FROM product_reviews')).rows[0].c,
    questions: (await query('SELECT COUNT(*)::int AS c FROM analysis_questions')).rows[0].c,
    options: (await query('SELECT COUNT(*)::int AS c FROM analysis_options')).rows[0].c,
    profiles: (await query('SELECT COUNT(*)::int AS c FROM analysis_profiles')).rows[0].c,
    scores: (await query('SELECT COUNT(*)::int AS c FROM analysis_profile_scores')).rows[0].c,
    profileProducts: (await query('SELECT COUNT(*)::int AS c FROM analysis_profile_products')).rows[0].c,
  }

  console.log('\n=== VLAECCI demo content seed tamamlandı ===')
  console.log(`Kateqoriyalar:            ${counts.categories}`)
  console.log(`Məhsullar:                ${counts.products}`)
  console.log(`Rəylər (reviews):         ${counts.reviews} (planlanan: ${reviewCount})`)
  console.log(`Suallar (questions):      ${counts.questions}`)
  console.log(`Variantlar (options):     ${counts.options}`)
  console.log(`Profillər (profiles):     ${counts.profiles}`)
  console.log(`Profil-xal (scores):      ${counts.scores}`)
  console.log(`Profil-məhsul (products): ${counts.profileProducts}`)
  console.log('============================================\n')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed-content xətası:', err)
    process.exit(1)
  })
