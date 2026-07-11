import { Pool, type QueryResultRow } from 'pg'

let pool: Pool | null = null
let schemaReady: Promise<void> | null = null

function getConnectionString(): string {
  const fromEnv =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING
  if (fromEnv) return fromEnv
  const host = process.env.POSTGRES_HOST || 'localhost'
  const port = process.env.POSTGRES_PORT || '5432'
  const user = process.env.POSTGRES_USER || 'postgres'
  const password = process.env.POSTGRES_PASSWORD || 'postgres'
  const database = process.env.POSTGRES_DB || 'vlaecci'
  return `postgresql://${user}:${password}@${host}:${port}/${database}`
}

function needsSsl(connectionString: string): boolean {
  if (process.env.DATABASE_SSL === 'true') return true
  if (process.env.NODE_ENV === 'production') return true
  return /neon\.tech|supabase\.co|render\.com|railway\.app/i.test(connectionString)
}

export function getPool(): Pool {
  if (!pool) {
    const connectionString = getConnectionString()
    pool = new Pool({
      connectionString,
      ssl: needsSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    })
  }
  return pool
}

async function initSchema() {
  const db = getPool()
  await db.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price NUMERIC(10,2) NOT NULL,
      images JSONB DEFAULT '[]',
      category_id TEXT REFERENCES categories(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quiz_responses (
      id TEXT PRIMARY KEY,
      hair_loss_level TEXT NOT NULL,
      hair_type TEXT NOT NULL,
      scalp_condition TEXT NOT NULL,
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      hair_issue TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS discount_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      percentage INTEGER NOT NULL,
      expires_at TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS product_reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      hair_type TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      comment TEXT NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      message_type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS analysis_questions (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      parent_option_id TEXT,
      image_url TEXT,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS analysis_options (
      id TEXT PRIMARY KEY,
      question_id TEXT REFERENCES analysis_questions(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      image_url TEXT,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS analysis_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      explanation TEXT,
      why_text TEXT,
      routine_title TEXT,
      routine_description TEXT,
      result_message TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS analysis_profile_scores (
      profile_id TEXT REFERENCES analysis_profiles(id) ON DELETE CASCADE,
      option_id TEXT REFERENCES analysis_options(id) ON DELETE CASCADE,
      points INTEGER DEFAULT 1,
      PRIMARY KEY (profile_id, option_id)
    );

    CREATE TABLE IF NOT EXISTS analysis_profile_products (
      profile_id TEXT REFERENCES analysis_profiles(id) ON DELETE CASCADE,
      product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
      sort_order INTEGER DEFAULT 0,
      PRIMARY KEY (profile_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS analysis_sessions (
      id TEXT PRIMARY KEY,
      profile_id TEXT REFERENCES analysis_profiles(id),
      selected_option_ids JSONB DEFAULT '[]',
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  await db.query(`
    ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients TEXT DEFAULT '';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS how_to_use TEXT DEFAULT '';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER;
    ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
    ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS limit_type TEXT DEFAULT 'none';
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS product_view_events (
      id TEXT PRIMARY KEY,
      product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
      ip_address TEXT NOT NULL,
      country TEXT,
      viewed_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_product_view_events_product ON product_view_events(product_id);
  `)

  await db.query(`
    ALTER TABLE products ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS unique_views INTEGER DEFAULT 0;
  `)

  await db.query(`UPDATE products SET status = 'active' WHERE status IS NULL OR status = ''`)
}

export async function ensureDb() {
  if (!schemaReady) {
    schemaReady = initSchema()
  }
  await schemaReady
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) {
  await ensureDb()
  return getPool().query<T>(text, params)
}
