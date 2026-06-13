import { q } from "../db";
import { computeScores, SCORE_VERSION } from "../scoring";
import type { Product, ProductData, Scores } from "../types";

interface ProductRow {
  barcode: string;
  data: ProductData | string;
  scores: Scores | string;
  score_version: number;
  source: string;
  verified: boolean;
}

function parse<T>(v: T | string): T {
  return typeof v === "string" ? (JSON.parse(v) as T) : v;
}

function rowToProduct(row: ProductRow): Product {
  const data = parse(row.data);
  return {
    ...data,
    scores: parse(row.scores),
    source: row.source as Product["source"],
    verified: row.verified,
  };
}

export async function getProduct(barcode: string): Promise<Product | null> {
  const rows = await q<ProductRow>(`SELECT * FROM products WHERE barcode = $1`, [barcode]);
  if (rows.length === 0) return null;
  const row = rows[0];
  // Score-Logik geändert? → transparent neu bewerten.
  if (row.score_version !== SCORE_VERSION) {
    const data = parse(row.data);
    const scores = computeScores(data);
    await q(
      `UPDATE products SET scores = $1, score_version = $2, updated_at = now() WHERE barcode = $3`,
      [JSON.stringify(scores), SCORE_VERSION, barcode]
    );
    return { ...data, scores, source: row.source as Product["source"], verified: row.verified };
  }
  return rowToProduct(row);
}

export async function upsertProduct(
  data: ProductData,
  source: Product["source"],
  verified: boolean
): Promise<Product> {
  const scores = computeScores(data);
  await q(
    `INSERT INTO products (barcode, name, brand, category, data, scores, score_version, source, verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (barcode) DO UPDATE SET
       name = EXCLUDED.name,
       brand = EXCLUDED.brand,
       category = EXCLUDED.category,
       data = EXCLUDED.data,
       scores = EXCLUDED.scores,
       score_version = EXCLUDED.score_version,
       source = EXCLUDED.source,
       verified = EXCLUDED.verified,
       updated_at = now()`,
    [
      data.barcode,
      data.name,
      data.brand,
      data.category,
      JSON.stringify(data),
      JSON.stringify(scores),
      SCORE_VERSION,
      source,
      verified,
    ]
  );
  return { ...data, scores, source, verified };
}

// Manche Begriffe matchen als Substring riesige Mengen (z. B. "cola" steckt
// auch in "chocolate" → ~180k Treffer im Vollimport). Alle zu holen UND nach
// Score zu sortieren kostet zig Sekunden. Deshalb erst die Kandidaten kappen,
// dann unter diesen ranken: seltene Begriffe bleiben exakt, häufige werden
// aus einer großzügigen Stichprobe bedient — beides in ~40–150 ms.
const SEARCH_CANDIDATE_CAP = 2000;

export async function searchProducts(query: string, limit = 12): Promise<Product[]> {
  // LIKE-Metazeichen im Suchbegriff entschärfen (Backslash ist Default-Escape).
  const esc = query.replace(/[\\%_]/g, (c) => `\\${c}`);
  // Die `%term%`-Filter werden auf großen Tabellen vom pg_trgm-GIN-Index
  // bedient (siehe scripts/optimize-search.mts) — ohne ihn wäre das ein
  // Full-Table-Scan. Treffer, die mit dem Begriff *beginnen*, ranken zuerst.
  const rows = await q<ProductRow>(
    `SELECT * FROM (
       SELECT * FROM products
       WHERE name ILIKE $1 OR brand ILIKE $1
       LIMIT ${SEARCH_CANDIDATE_CAP}
     ) s
     ORDER BY (name ILIKE $2) DESC, verified DESC, (scores->>'total')::int DESC
     LIMIT $3`,
    [`%${esc}%`, `${esc}%`, limit]
  );
  return rows.map(rowToProduct);
}

export async function productsByCategory(
  category: string,
  excludeBarcode: string,
  limit = 8
): Promise<Product[]> {
  const rows = await q<ProductRow>(
    `SELECT * FROM products
     WHERE category = $1 AND barcode <> $2
     ORDER BY (scores->>'total')::int DESC
     LIMIT $3`,
    [category, excludeBarcode, limit]
  );
  return rows.map(rowToProduct);
}

export async function productsByBarcodes(barcodes: string[]): Promise<Product[]> {
  if (barcodes.length === 0) return [];
  const rows = await q<ProductRow>(
    `SELECT * FROM products WHERE barcode = ANY($1)`,
    [barcodes]
  );
  const map = new Map(rows.map((r) => [r.barcode, rowToProduct(r)]));
  return barcodes.map((b) => map.get(b)).filter((p): p is Product => p != null);
}

/** Korrektur anwenden: erlaubte Felder ändern + Scores neu berechnen. */
export async function applyFieldUpdate(
  barcode: string,
  field: string,
  value: string
): Promise<boolean> {
  const allowed = ["name", "brand", "quantity", "ingredientsText"] as const;
  if (!allowed.includes(field as (typeof allowed)[number])) return false;
  const product = await getProduct(barcode);
  if (!product) return false;
  const { scores: _s, source, verified, ...data } = product;
  const updated: ProductData = { ...data, [field]: value };
  await upsertProduct(updated, source, verified);
  return true;
}

export async function listUnverified(limit = 50): Promise<Product[]> {
  const rows = await q<ProductRow>(
    `SELECT * FROM products WHERE verified = false AND source = 'community'
     ORDER BY updated_at DESC LIMIT $1`,
    [limit]
  );
  return rows.map(rowToProduct);
}

export async function setVerified(barcode: string): Promise<void> {
  await q(`UPDATE products SET verified = true, updated_at = now() WHERE barcode = $1`, [barcode]);
}

export async function countProducts(): Promise<number> {
  const rows = await q<{ n: string }>(`SELECT count(*)::text AS n FROM products`);
  return Number(rows[0]?.n ?? 0);
}
