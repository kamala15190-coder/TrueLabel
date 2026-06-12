// ============================================================
// Bulk-Import aus dem OpenFoodFacts-Voll-Dump (JSONL.gz, ~12 GB).
// Streamt den Dump (kein Voll-Download), filtert (Standard: DACH),
// mappt mit unserer eigenen Logik + Scoring und schreibt batchweise
// in Postgres/Supabase. Storage-bewusst: stoppt vor dem Quota.
//
// Start (auf dem Server, lädt .env vorher):
//   set -a; . /opt/TrueLabel/.env; set +a
//   npx --yes tsx scripts/import-off.mts
//
// Env-Schalter:
//   LIMIT=200000        max. einzufügende Produkte
//   MAX_DB_MB=430       Stopp, sobald die DB so groß ist (Disk!=DB beachten)
//   COUNTRIES=en:germany,en:austria,en:switzerland   ("" = weltweit)
//   BATCH=400           Insert-Batchgröße
//   REQUIRE_NUTRIMENTS=1  nur Produkte mit Nährwerten
// ============================================================
import { createGunzip } from "node:zlib";
import { Readable } from "node:stream";
import { createInterface } from "node:readline";
import pg from "pg";
import { mapOffProduct } from "../src/lib/off";
import { computeScores, SCORE_VERSION } from "../src/lib/scoring";

const DUMP = "https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz";
const LIMIT = Number(process.env.LIMIT ?? 200000);
const MAX_DB_BYTES = Number(process.env.MAX_DB_MB ?? 430) * 1024 * 1024;
const COUNTRIES = (process.env.COUNTRIES ?? "en:germany,en:austria,en:switzerland")
  .split(",").map((s) => s.trim()).filter(Boolean);
const BATCH = Number(process.env.BATCH ?? 400);
const REQUIRE_NUTRIMENTS = process.env.REQUIRE_NUTRIMENTS === "1";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL fehlt (zuerst .env laden).");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  ssl: { rejectUnauthorized: false },
});

// Postgres erlaubt keine Null-Bytes in text/jsonb — OFF-Daten haben vereinzelt
// welche. Vorher rausputzen, sonst stirbt der ganze Batch.
const NUL = String.fromCharCode(0);
const clean = (s: string) => (s.indexOf(NUL) >= 0 ? s.split(NUL).join("") : s);
const cleanJson = (o: unknown) => {
  const j = JSON.stringify(o);
  return j.indexOf("\\u0000") >= 0 ? j.split("\\u0000").join("") : j;
};

const COLS = 9;
async function flush(rows: { barcode: string; name: string; brand: string; category: string; data: unknown; scores: unknown }[]): Promise<number> {
  if (rows.length === 0) return 0;
  const values: unknown[] = [];
  const tuples = rows.map((r, i) => {
    const o = i * COLS;
    values.push(clean(r.barcode), clean(r.name), clean(r.brand), clean(r.category), cleanJson(r.data), cleanJson(r.scores), SCORE_VERSION, "off", false);
    return `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8},$${o + 9})`;
  }).join(",");
  const sql = `INSERT INTO products (barcode,name,brand,category,data,scores,score_version,source,verified)
     VALUES ${tuples} ON CONFLICT (barcode) DO NOTHING`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await pool.query(sql, values);
      return res.rowCount ?? 0;
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      // Read-only (Disk-/Quota-Limit erreicht) -> nicht retrien, sauber stoppen
      if (err.code === "25006" || /read-only/i.test(err.message ?? "")) {
        throw new Error("DB ist read-only — Speicherlimit erreicht. Importer stoppt sauber.");
      }
      if (attempt === 4) {
        console.warn("  ⚠ Batch nach 4 Versuchen übersprungen:", err.message);
        return 0;
      }
      await new Promise((r) => setTimeout(r, attempt * 1500));
    }
  }
  return 0;
}

async function dbBytes(): Promise<number> {
  const r = await pool.query<{ b: string }>("select pg_database_size(current_database())::text b");
  return Number(r.rows[0].b);
}

async function main() {
  console.log(`OFF-Import gestartet · Filter: ${COUNTRIES.join(",") || "weltweit"} · LIMIT=${LIMIT} · Stopp bei ${(MAX_DB_BYTES / 1048576).toFixed(0)} MB`);
  const res = await fetch(DUMP, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`Dump-Download fehlgeschlagen: HTTP ${res.status}`);

  const nodeStream = Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]);
  const rl = createInterface({ input: nodeStream.pipe(createGunzip()), crlfDelay: Infinity });

  let processed = 0, matched = 0, inserted = 0, skippedBad = 0;
  let batch: { barcode: string; name: string; brand: string; category: string; data: unknown; scores: unknown }[] = [];
  const t0 = Date.now();

  const logProgress = () => {
    const sec = ((Date.now() - t0) / 1000).toFixed(0);
    console.log(`  ${sec}s · gelesen ${processed.toLocaleString()} · passend ${matched.toLocaleString()} · eingefügt ${inserted.toLocaleString()} · übersprungen ${skippedBad}`);
  };

  for await (const line of rl) {
    processed++;
    if (processed % 200000 === 0) logProgress();
    if (!line) continue;

    let raw: Record<string, unknown>;
    try { raw = JSON.parse(line); } catch { continue; }

    if (!raw.code || !(raw.product_name_de || raw.product_name)) continue;
    if (COUNTRIES.length) {
      const ct = (raw.countries_tags as string[]) ?? [];
      if (!ct.some((c) => COUNTRIES.includes(c))) continue;
    }
    if (REQUIRE_NUTRIMENTS && (!raw.nutriments || Object.keys(raw.nutriments).length === 0)) continue;

    matched++;
    let data, scores;
    try {
      data = mapOffProduct(raw);
      if (!/^\d{6,14}$/.test(data.barcode)) { skippedBad++; continue; }
      scores = computeScores(data);
    } catch { skippedBad++; continue; }

    batch.push({ barcode: data.barcode, name: data.name, brand: data.brand, category: data.category, data, scores });

    if (batch.length >= BATCH) {
      inserted += await flush(batch);
      batch = [];
      if (inserted % (BATCH * 20) < BATCH) {
        const bytes = await dbBytes();
        if (bytes >= MAX_DB_BYTES) {
          console.log(`⛑  Storage-Limit erreicht (${(bytes / 1048576).toFixed(0)} MB) — stoppe sauber.`);
          break;
        }
      }
      if (inserted >= LIMIT) { console.log("LIMIT erreicht."); break; }
    }
  }
  inserted += await flush(batch);
  logProgress();

  const finalBytes = await dbBytes();
  const total = await pool.query<{ n: string }>("select count(*)::text n from products");
  console.log(`✓ Fertig. Eingefügt: ${inserted.toLocaleString()} · Produkte gesamt: ${Number(total.rows[0].n).toLocaleString()} · DB: ${(finalBytes / 1048576).toFixed(0)} MB`);
  await pool.end();
}

main().catch((e) => { console.error("Importer-Fehler:", e); process.exit(1); });
