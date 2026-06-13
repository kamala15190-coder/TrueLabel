// ============================================================
// Sucht-Beschleuniger: legt die pg_trgm-GIN-Indizes für die
// Produktsuche an. Auf der vollimportierten Tabelle (Millionen
// Produkte) macht das aus `name ILIKE '%milch%'` (Full-Table-Scan,
// Sekunden) eine indexgestützte Abfrage (~40–200 ms).
//
// Einmalig ausführen — gefahrlos wiederholbar.
//
// ⚠️ SUPABASE: NICHT über den Supavisor-Pooler laufen lassen! Der Pooler
// kappt die minutenlange DDL-Verbindung mitten im Indexaufbau (INVALID-Index
// bzw. hängender Client). Stattdessen die DIREKTE Verbindung verwenden:
//   postgresql://postgres:<PW>@db.<REF>.supabase.co:5432/postgres
// (Hetzner muss IPv6 können — der Supabase-Direct-Host ist IPv6-only.)
// Zusätzlich hilft aggressives TCP-Keepalive gegen Idle-Drops:
//   sysctl -w net.ipv4.tcp_keepalive_time=20 net.ipv4.tcp_keepalive_intvl=20
//
// Aufruf (Server):
//   cd /opt/TrueLabel
//   export DATABASE_URL="postgresql://postgres:<PW>@db.<REF>.supabase.co:5432/postgres"
//   npx --yes tsx scripts/optimize-search.mts
//
// Standard ist ein NICHT-concurrent Build: zuverlässig (saubere
// Transaktion → Rollback statt INVALID-Index bei Abbruch) und schnell,
// sperrt aber für die Bauzeit (~3 min bei 4 Mio. Zeilen) die Schreibzugriffe
// auf `products`. Für unterbrechungsfreien Aufbau (kein Write-Lock, aber
// braucht eine stabile Verbindung): CONCURRENT=1 setzen.
// ============================================================
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL fehlt (zuerst .env laden bzw. Direct-URL setzen).");
  process.exit(1);
}

const CONCURRENT = process.env.CONCURRENT === "1";

// Eigener Client (kein Pool): SET wirkt sicher auf dieselbe Verbindung,
// und CREATE INDEX CONCURRENTLY läuft ohne implizite Transaktion.
// keepAlive: hält den Socket während des langen, serverseitigen Aufbaus offen,
// sonst kappt ihn eine Firewall/ein LB als „untätig".
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
});

const INDEXES: [string, string][] = [
  ["idx_products_name_trgm", "name"],
  ["idx_products_brand_trgm", "brand"],
];

async function main() {
  const t0 = Date.now();
  await client.connect();

  const c = await client.query<{ n: string }>("select count(*)::text n from products");
  console.log(
    `Produkte: ${Number(c.rows[0].n).toLocaleString()} — baue Suchindizes ` +
      `(${CONCURRENT ? "CONCURRENTLY" : "blockierend, schnell"}) …`
  );

  await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
  // Managed-DBs (Supabase) setzen ein statement_timeout (z. B. 2 min), das den
  // Aufbau auf Millionen Zeilen killt — für DIESE Session abschalten.
  await client.query(`SET statement_timeout = 0`);
  await client.query(`SET lock_timeout = 0`);
  try {
    await client.query(`SET maintenance_work_mem = '1GB'`); // schnellerer Build
  } catch {
    /* Managed-DB erlaubt den Wert evtl. nicht — dann mit Default weiter. */
  }

  for (const [name, col] of INDEXES) {
    // Reste eines früher abgebrochenen Laufs (INVALID) entfernen, sonst
    // überspringt IF NOT EXISTS den Neuaufbau.
    const bad = await client.query(
      `SELECT 1 FROM pg_class i JOIN pg_index x ON x.indexrelid = i.oid
        WHERE i.relname = $1 AND x.indisvalid = false`,
      [name]
    );
    if ((bad.rowCount ?? 0) > 0) {
      console.log(`  ⟲ ${name} war ungültig — wird neu gebaut`);
      await client.query(`DROP INDEX ${CONCURRENT ? "CONCURRENTLY " : ""}IF EXISTS ${name}`);
    }

    const s = Date.now();
    await client.query(
      `CREATE INDEX ${CONCURRENT ? "CONCURRENTLY " : ""}IF NOT EXISTS ${name}
         ON products USING gin (${col} gin_trgm_ops)`
    );
    console.log(`  ✓ ${name} (${((Date.now() - s) / 1000).toFixed(1)}s)`);
  }

  const s = Date.now();
  await client.query(`ANALYZE products`);
  console.log(`  ✓ ANALYZE products (${((Date.now() - s) / 1000).toFixed(1)}s)`);

  // Kurzer Probelauf, damit man den Effekt sofort sieht.
  const probe = Date.now();
  const r = await client.query(
    `SELECT barcode FROM products WHERE name ILIKE $1 OR brand ILIKE $1
     ORDER BY (name ILIKE $2) DESC, verified DESC, (scores->>'total')::int DESC LIMIT 12`,
    ["%milch%", "milch%"]
  );
  console.log(`Testsuche "milch": ${r.rowCount} Treffer in ${Date.now() - probe}ms`);
  console.log(`✓ Fertig in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await client.end();
}

main().catch(async (e) => {
  console.error("optimize-search fehlgeschlagen:", e);
  try {
    await client.end();
  } catch {
    /* egal */
  }
  process.exit(1);
});
