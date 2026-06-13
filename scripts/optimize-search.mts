// ============================================================
// Sucht-Beschleuniger: legt die pg_trgm-GIN-Indizes für die
// Produktsuche an. Auf der vollimportierten Tabelle (Hunderttausende
// Produkte) macht das aus `name ILIKE '%milch%'` (Full-Table-Scan,
// Sekunden) eine indexgestützte Abfrage (Millisekunden).
//
// Einmalig auf dem Server ausführen — gefahrlos wiederholbar:
//   set -a; . /opt/TrueLabel/.env; set +a
//   npx --yes tsx scripts/optimize-search.mts
//
// CONCURRENTLY = baut die Indizes OHNE Schreibsperre, die App läuft
// während des Aufbaus normal weiter.
// ============================================================
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL fehlt (zuerst .env laden).");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  ssl: { rejectUnauthorized: false },
});

// CREATE INDEX CONCURRENTLY darf nicht in einer Transaktion laufen —
// pg führt einzelne Statements ohne BEGIN aus, also passt das.
const STEPS: [string, string][] = [
  ["pg_trgm-Erweiterung", `CREATE EXTENSION IF NOT EXISTS pg_trgm`],
  [
    "GIN-Index auf name",
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_trgm
       ON products USING gin (name gin_trgm_ops)`,
  ],
  [
    "GIN-Index auf brand",
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_brand_trgm
       ON products USING gin (brand gin_trgm_ops)`,
  ],
  ["Statistiken aktualisieren", `ANALYZE products`],
];

async function main() {
  const t0 = Date.now();
  const c = await pool.query<{ n: string }>("select count(*)::text n from products");
  console.log(`Produkte: ${Number(c.rows[0].n).toLocaleString()} — lege Suchindizes an …`);

  for (const [label, sql] of STEPS) {
    const s = Date.now();
    try {
      await pool.query(sql);
      console.log(`  ✓ ${label} (${((Date.now() - s) / 1000).toFixed(1)}s)`);
    } catch (e) {
      console.error(`  ✗ ${label}:`, (e as Error).message);
      throw e;
    }
  }

  // Kurzer Probelauf, damit man den Effekt sofort sieht.
  const probe = Date.now();
  const r = await pool.query(
    `SELECT barcode FROM products WHERE name ILIKE $1 OR brand ILIKE $1
     ORDER BY (name ILIKE $2) DESC, verified DESC, (scores->>'total')::int DESC LIMIT 12`,
    ["%milch%", "milch%"]
  );
  console.log(`Testsuche "milch": ${r.rowCount} Treffer in ${Date.now() - probe}ms`);
  console.log(`✓ Fertig in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await pool.end();
}

main().catch((e) => {
  console.error("optimize-search fehlgeschlagen:", e);
  process.exit(1);
});
