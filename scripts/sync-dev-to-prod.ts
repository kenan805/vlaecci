/**
 * One-off: copy catalogue/content data from the dev database to the prod database
 * and reset prod's activity data.
 *
 *   Copied from dev (prod rows replaced): categories, products (+ size variants), hair types,
 *     hair analysis questions/options/profiles (+ scores, recommended products),
 *     before/after results (+ product links).
 *   Reset to empty on prod: orders, product reviews, analysis results, old quiz answers,
 *     contact messages, consultations, discount codes, product view stats, homepage testimonials.
 *   Untouched on prod: admins, site settings (contact number).
 *
 * Env:
 *   DEV_DATABASE_URL, PROD_DATABASE_URL           required
 *   DEV_BLOB_READ_WRITE_TOKEN, PROD_BLOB_READ_WRITE_TOKEN
 *                                                 needed to check/copy images between Blob stores
 *   SYNC_BACKUP_DIR                               default ./.sync-backups
 *
 * Usage (always in this order):
 *   npx tsx scripts/sync-dev-to-prod.ts                 dry run: reads only, prints the plan
 *   npx tsx scripts/sync-dev-to-prod.ts --apply         backs up prod, copies images, then
 *                                                       replaces data in ONE transaction
 *   npx tsx scripts/sync-dev-to-prod.ts --restore <dir> puts a backup made by --apply back
 */
import { Pool, types, type PoolClient } from 'pg'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { get, head, put } from '@vercel/blob'

// Keep timestamps/dates as Postgres text: JS Date would drop microseconds, so copies and
// backups would not be exact.
for (const oid of [1082 /* date */, 1114 /* timestamp */, 1184 /* timestamptz */]) {
  types.setTypeParser(oid, (value) => value)
}

type Row = Record<string, unknown>

/** Copied from dev, in insert order (parents before children). */
const COPY_TABLES = [
  'categories',
  'products',
  'product_variants',
  'hair_types',
  'analysis_profiles',
  'analysis_questions',
  'analysis_options',
  'analysis_profile_scores',
  'analysis_profile_products',
  'before_after_results',
  'before_after_products',
]

/** Emptied on prod. */
const CLEAR_TABLES = [
  'orders',
  'order_items',
  'product_reviews',
  'analysis_sessions',
  'quiz_responses',
  'contact_messages',
  'consultations',
  'discount_codes',
  'product_view_events',
  'testimonials',
]

/** Delete order on prod: children before parents. */
const DELETE_ORDER = [
  'order_items',
  'orders',
  'product_reviews',
  'product_view_events',
  'analysis_sessions',
  'analysis_profile_products',
  'analysis_profile_scores',
  'before_after_products',
  'product_variants',
  'quiz_responses',
  'contact_messages',
  'consultations',
  'discount_codes',
  'testimonials',
  'analysis_options',
  'analysis_questions',
  'analysis_profiles',
  'before_after_results',
  'products',
  'categories',
  'hair_types',
]

/** Insert order when restoring a backup (all tables the sync touches). */
const RESTORE_ORDER = [
  ...COPY_TABLES,
  'analysis_sessions',
  'orders',
  'order_items',
  'product_reviews',
  'product_view_events',
  'quiz_responses',
  'contact_messages',
  'consultations',
  'discount_codes',
  'testimonials',
]

const TOUCHED = Array.from(new Set(COPY_TABLES.concat(CLEAR_TABLES)))

function log(msg = '') {
  console.log(msg)
}

function fail(msg: string): never {
  console.error(`\n✖ ${msg}`)
  process.exit(1)
}

function makePool(url: string) {
  const local = /localhost|127\.0\.0\.1/.test(url)
  return new Pool({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: false }, max: 2 })
}

function hostOf(url: string) {
  try {
    return new URL(url).host
  } catch {
    return '(invalid url)'
  }
}

interface ColumnInfo {
  name: string
  json: boolean
  required: boolean // NOT NULL without default
}

async function columns(db: Pool | PoolClient, table: string): Promise<ColumnInfo[]> {
  const r = await db.query<{ column_name: string; data_type: string; is_nullable: string; column_default: string | null }>(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table]
  )
  return r.rows.map((c) => ({
    name: c.column_name,
    json: c.data_type === 'json' || c.data_type === 'jsonb',
    required: c.is_nullable === 'NO' && c.column_default === null,
  }))
}

async function count(db: Pool, table: string) {
  const r = await db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM ${table}`)
  return r.rows[0].n
}

async function selectAll(db: Pool, table: string): Promise<Row[]> {
  return (await db.query(`SELECT * FROM ${table}`)).rows
}

async function insertRows(client: PoolClient, table: string, rows: Row[], cols: ColumnInfo[]) {
  if (rows.length === 0 || cols.length === 0) return
  const names = cols.map((c) => `"${c.name}"`).join(', ')
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200)
    const values: unknown[] = []
    const tuples = chunk.map((row) => {
      const ph = cols.map((c) => {
        const v = row[c.name]
        values.push(c.json && v !== null && v !== undefined ? JSON.stringify(v) : v ?? null)
        return `$${values.length}`
      })
      return `(${ph.join(', ')})`
    })
    await client.query(`INSERT INTO ${table} (${names}) VALUES ${tuples.join(', ')}`, values)
  }
}

/* ------------------------------------------------------------------ */
/* Images                                                             */
/* ------------------------------------------------------------------ */

function collectImageUrls(data: Record<string, Row[]>): string[] {
  const urls = new Set<string>()
  const add = (v: unknown) => {
    if (typeof v === 'string' && v) urls.add(v)
    else if (Array.isArray(v)) v.forEach(add)
  }
  for (const r of data.products ?? []) add(r.images)
  for (const r of data.product_variants ?? []) add(r.images)
  for (const r of data.before_after_results ?? []) {
    add(r.before_image)
    add(r.after_image)
  }
  for (const r of data.analysis_questions ?? []) add(r.image_url)
  for (const r of data.analysis_options ?? []) add(r.image_url)
  return Array.from(urls)
}

/** vercel_blob_rw_<storeId>_<secret> */
function storeId(token: string | undefined) {
  return token?.split('_')[3] ?? null
}

async function blobExists(pathname: string, token: string) {
  try {
    await head(pathname, { token })
    return true
  } catch {
    return false
  }
}

async function copyBlob(pathname: string, devToken: string, prodToken: string) {
  let src: Awaited<ReturnType<typeof get>> = null
  for (const access of ['private', 'public'] as const) {
    try {
      src = await get(pathname, { access, token: devToken })
      if (src?.stream) break
    } catch {
      /* try the other access mode */
    }
  }
  if (!src?.stream) throw new Error(`not found in dev store: ${pathname}`)
  const body = Buffer.from(await new Response(src.stream).arrayBuffer())
  const contentType = src.blob.contentType || 'application/octet-stream'
  try {
    await put(pathname, body, { access: 'public', contentType, token: prodToken, addRandomSuffix: false, allowOverwrite: true })
  } catch {
    // private stores reject public uploads (same fallback as src/lib/blob-upload.ts)
    await put(pathname, body, { access: 'private', contentType, token: prodToken, addRandomSuffix: false, allowOverwrite: true })
  }
}

/* ------------------------------------------------------------------ */
/* Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  const args = process.argv.slice(2)
  const mode = args.includes('--apply') ? 'apply' : args.includes('--restore') ? 'restore' : 'dry-run'
  const devUrl = process.env.DEV_DATABASE_URL
  const prodUrl = process.env.PROD_DATABASE_URL
  if (!prodUrl) fail('PROD_DATABASE_URL is not set')
  if (mode !== 'restore' && !devUrl) fail('DEV_DATABASE_URL is not set')
  if (devUrl && devUrl === prodUrl) fail('DEV_DATABASE_URL and PROD_DATABASE_URL are the same database')

  const prod = makePool(prodUrl)

  if (mode === 'restore') {
    const dir = args[args.indexOf('--restore') + 1]
    if (!dir) fail('Usage: --restore <backup dir>')
    await restore(prod, dir)
    await prod.end()
    return
  }

  const dev = makePool(devUrl!)
  log(`Mode: ${mode.toUpperCase()}`)
  log(`dev : ${hostOf(devUrl!)}`)
  log(`prod: ${hostOf(prodUrl)}`)

  // 1. Schema check — both databases must already have the app's current tables.
  const plan: { table: string; cols: ColumnInfo[] }[] = []
  for (const table of TOUCHED) {
    const prodCols = await columns(prod, table)
    if (prodCols.length === 0) {
      fail(`Table "${table}" is missing on prod. Open the prod site once after deploying 1.2.0 (the app creates its tables on first request), then run again.`)
    }
    if (!COPY_TABLES.includes(table)) continue
    const devCols = await columns(dev, table)
    if (devCols.length === 0) fail(`Table "${table}" is missing on dev.`)
    const devNames = new Set(devCols.map((c) => c.name))
    const shared = prodCols.filter((c) => devNames.has(c.name))
    const missingRequired = prodCols.filter((c) => c.required && !devNames.has(c.name))
    if (missingRequired.length) {
      fail(`prod.${table} requires column(s) dev does not have: ${missingRequired.map((c) => c.name).join(', ')}`)
    }
    const devOnly = devCols.filter((c) => !prodCols.some((p) => p.name === c.name))
    if (devOnly.length) log(`  ! ${table}: dev-only column(s) skipped: ${devOnly.map((c) => c.name).join(', ')}`)
    plan.push({ table, cols: shared })
  }

  // 2. Read dev data.
  const devData: Record<string, Row[]> = {}
  for (const { table } of plan) devData[table] = await selectAll(dev, table)

  // 3. Plan table.
  log('\nTable                        prod now  →  prod after')
  for (const table of DELETE_ORDER.slice().reverse()) {
    const now = await count(prod, table)
    const after = COPY_TABLES.includes(table) ? devData[table].length : 0
    log(`  ${table.padEnd(27)}${String(now).padStart(8)}  →  ${after}${COPY_TABLES.includes(table) ? '  (from dev)' : '  (reset)'}`)
  }
  log(`  ${'admins, site_settings'.padEnd(27)}   untouched`)

  // 4. Images.
  const urls = collectImageUrls(devData)
  const blobPaths = urls.filter((u) => u.startsWith('/api/media/')).map((u) => u.slice('/api/media/'.length))
  const localUploads = urls.filter((u) => u.startsWith('/uploads/'))
  const external = urls.filter((u) => /^https?:\/\//.test(u))
  log(`\nImages referenced: ${urls.length} (Blob: ${blobPaths.length}, external links: ${external.length}, local /uploads: ${localUploads.length})`)
  if (localUploads.length) {
    log(`  ! ${localUploads.length} image(s) point to /uploads/ (a developer's local disk) — they will not load on prod:`)
    localUploads.slice(0, 10).forEach((u) => log(`      ${u}`))
  }

  const devToken = process.env.DEV_BLOB_READ_WRITE_TOKEN
  const prodToken = process.env.PROD_BLOB_READ_WRITE_TOKEN
  let toCopy: string[] = []
  if (blobPaths.length) {
    if (!devToken || !prodToken) {
      log('  ! DEV_/PROD_BLOB_READ_WRITE_TOKEN not set — cannot check whether prod can show these images.')
      if (mode === 'apply' && !args.includes('--skip-images')) {
        fail('Set both Blob tokens (or pass --skip-images if dev and prod share one Blob store).')
      }
    } else if (storeId(devToken) === storeId(prodToken)) {
      log('  ✓ dev and prod use the SAME Blob store — image files are already in place.')
    } else {
      log('  dev and prod use DIFFERENT Blob stores — checking which files prod is missing...')
      for (const p of blobPaths) if (!(await blobExists(p, prodToken))) toCopy.push(p)
      log(`  ${toCopy.length} of ${blobPaths.length} file(s) must be copied to the prod store.`)
    }
  }

  if (mode === 'dry-run') {
    log('\nDry run only — nothing was changed. Re-run with --apply to perform the sync.')
    await Promise.all([dev.end(), prod.end()])
    return
  }

  // 5. Backup everything this run will delete on prod.
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.resolve(process.env.SYNC_BACKUP_DIR || '.sync-backups', `prod-${stamp}`)
  await mkdir(backupDir, { recursive: true })
  for (const table of TOUCHED) {
    await writeFile(path.join(backupDir, `${table}.json`), JSON.stringify(await selectAll(prod, table)))
  }
  log(`\nProd backup written: ${backupDir}`)

  // 6. Copy images first (additive, safe to repeat) so products never point at missing files.
  for (let i = 0; i < toCopy.length; i++) {
    const p = toCopy[i]
    await copyBlob(p, devToken!, prodToken!)
    if ((i + 1) % 10 === 0 || i + 1 === toCopy.length) log(`  images copied: ${i + 1}/${toCopy.length}`)
  }

  // 7. Replace data in one transaction — any error rolls everything back.
  const client = await prod.connect()
  try {
    await client.query('BEGIN')
    for (const table of DELETE_ORDER) await client.query(`DELETE FROM ${table}`)
    for (const { table, cols } of plan) await insertRows(client, table, devData[table], cols)
    // Fresh stats: no views, no reviews.
    const productCols = new Set((await columns(client, 'products')).map((c) => c.name))
    const resets = ['total_views', 'unique_views', 'rating_avg', 'rating_count'].filter((c) => productCols.has(c))
    if (resets.length) await client.query(`UPDATE products SET ${resets.map((c) => `${c} = 0`).join(', ')}`)
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    fail(`Sync failed, prod was rolled back unchanged (images copied so far stay). ${err instanceof Error ? err.message : err}`)
  } finally {
    client.release()
  }

  log('\n✓ Sync complete. Prod now:')
  for (const table of [...COPY_TABLES, ...CLEAR_TABLES]) log(`  ${table.padEnd(27)}${String(await count(prod, table)).padStart(8)}`)
  log(`\nTo undo: npx tsx scripts/sync-dev-to-prod.ts --restore ${backupDir}`)
  await Promise.all([dev.end(), prod.end()])
}

async function restore(prod: Pool, dir: string) {
  const data: Record<string, Row[]> = {}
  for (const table of RESTORE_ORDER) {
    try {
      data[table] = JSON.parse(await readFile(path.join(dir, `${table}.json`), 'utf8'))
    } catch {
      fail(`Backup file missing or unreadable: ${path.join(dir, `${table}.json`)}`)
    }
  }
  log(`Restoring prod (${hostOf(process.env.PROD_DATABASE_URL!)}) from ${dir}`)
  const client = await prod.connect()
  try {
    await client.query('BEGIN')
    for (const table of DELETE_ORDER) await client.query(`DELETE FROM ${table}`)
    for (const table of RESTORE_ORDER) {
      const cols = await columns(client, table)
      const present = new Set(Object.keys(data[table][0] ?? {}))
      await insertRows(client, table, data[table], cols.filter((c) => present.has(c.name)))
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    fail(`Restore failed and was rolled back: ${err instanceof Error ? err.message : err}`)
  } finally {
    client.release()
  }
  log('✓ Restore complete.')
}

main().catch((err) => fail(err instanceof Error ? err.stack || err.message : String(err)))
