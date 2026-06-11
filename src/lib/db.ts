// ============================================================
// Datenbank-Layer.
// Produktion: Postgres via DATABASE_URL (Neon empfohlen).
// Entwicklung ohne DATABASE_URL: eingebettete PGlite-DB in ./.data
// — null Setup, echte Postgres-Semantik.
// Lazy-Init (kein Modul-Scope-Client): build-sicher.
// ============================================================

type Rows<T> = { rows: T[] };

export interface Driver {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<Rows<T>>;
}

declare global {
  // eslint-disable-next-line no-var
  var __tlDriver: Promise<Driver> | undefined;
  // eslint-disable-next-line no-var
  var __tlReady: Promise<void> | undefined;
}

const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    google_sub TEXT,
    name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user',
    points INTEGER NOT NULL DEFAULT 0,
    premium_until TIMESTAMPTZ,
    stripe_customer_id TEXT,
    diet_prefs JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    barcode TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'other',
    data JSONB NOT NULL,
    scores JSONB NOT NULL,
    score_version INTEGER NOT NULL DEFAULT 1,
    source TEXT NOT NULL DEFAULT 'off',
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`,
  `CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    barcode TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_scans_user ON scans(user_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS corrections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    barcode TEXT NOT NULL,
    field TEXT NOT NULL,
    message TEXT NOT NULL,
    suggested_value TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    ai_verdict JSONB,
    resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
  )`,
  `CREATE TABLE IF NOT EXISTS contributions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    barcode TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS list_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    barcode TEXT NOT NULL,
    checked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, barcode)
  )`,
  `CREATE TABLE IF NOT EXISTS ai_cache (
    key TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    response JSONB NOT NULL,
    cost_cents DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS ai_budget (
    month TEXT PRIMARY KEY,
    spent_cents DOUBLE PRECISION NOT NULL DEFAULT 0,
    calls INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS points_ledger (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
];

async function createDriver(): Promise<Driver> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import("pg");
    // Managed-Postgres (Supabase/Neon u. a.) erfordert TLS. Der Supabase-
    // Pooler nutzt ein Zertifikat, das ohne CA-Bundle nicht verifizierbar ist
    // -> rejectUnauthorized:false (Transport bleibt verschlüsselt).
    const needsSsl = /supabase\.|sslmode=require|neon\.tech|\.pooler\./i.test(url);
    const pool = new Pool({
      connectionString: url,
      max: 5,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    });
    return {
      query: async <T>(text: string, params: unknown[] = []) => {
        const res = await pool.query(text, params as never[]);
        return { rows: res.rows as T[] };
      },
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const path = await import("node:path");
  const { mkdir } = await import("node:fs/promises");
  const dir = path.join(process.cwd(), ".data", "pglite");
  await mkdir(dir, { recursive: true });
  const lite = new PGlite(dir);
  return {
    query: async <T>(text: string, params: unknown[] = []) => {
      const res = await lite.query(text, params as never[]);
      return { rows: res.rows as T[] };
    },
  };
}

async function migrateAndSeed(driver: Driver): Promise<void> {
  for (const stmt of SCHEMA) {
    await driver.query(stmt);
  }
  // Erststart: Demo-/Basisprodukte einspielen, damit die App sofort lebt.
  const existing = await driver.query<{ n: string }>(`SELECT count(*)::text AS n FROM products`);
  if (Number(existing.rows[0]?.n ?? 0) === 0) {
    const { seedProducts } = await import("./seed");
    await seedProducts(driver);
  }
}

async function getDriver(): Promise<Driver> {
  if (!globalThis.__tlDriver) {
    globalThis.__tlDriver = createDriver();
  }
  const driver = await globalThis.__tlDriver;
  if (!globalThis.__tlReady) {
    globalThis.__tlReady = migrateAndSeed(driver);
  }
  await globalThis.__tlReady;
  return driver;
}

/** Query-Helfer: q<Row>("SELECT ... WHERE x = $1", [x]) */
export async function q<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const driver = await getDriver();
  const res = await driver.query<T>(text, params);
  return res.rows;
}
