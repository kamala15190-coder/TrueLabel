import { q } from "../db";
import type { CorrectionVerdict } from "../types";
import { uuid } from "../util";

// ------------------------------------------------------------
// Scans (Verlauf)
// ------------------------------------------------------------

export async function addScan(userId: string, barcode: string): Promise<void> {
  // Doppelscans innerhalb kurzer Zeit nicht stapeln
  await q(
    `DELETE FROM scans WHERE user_id = $1 AND barcode = $2
       AND created_at > now() - interval '10 minutes'`,
    [userId, barcode]
  );
  await q(`INSERT INTO scans (id, user_id, barcode) VALUES ($1, $2, $3)`, [
    uuid(),
    userId,
    barcode,
  ]);
}

export interface ScanRow {
  id: string;
  barcode: string;
  created_at: string | Date;
  name: string;
  brand: string;
  data: unknown;
  scores: unknown;
}

export async function listScans(userId: string, limit = 60): Promise<ScanRow[]> {
  return q<ScanRow>(
    `SELECT s.id, s.barcode, s.created_at, p.name, p.brand, p.data, p.scores
     FROM scans s JOIN products p ON p.barcode = s.barcode
     WHERE s.user_id = $1
     ORDER BY s.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
}

// ------------------------------------------------------------
// Beiträge (neue Produkte)
// ------------------------------------------------------------

export async function addContribution(userId: string, barcode: string): Promise<void> {
  await q(`INSERT INTO contributions (id, user_id, barcode) VALUES ($1, $2, $3)`, [
    uuid(),
    userId,
    barcode,
  ]);
}

// ------------------------------------------------------------
// Korrekturen
// ------------------------------------------------------------

export interface CorrectionRow {
  id: string;
  user_id: string;
  barcode: string;
  field: string;
  message: string;
  suggested_value: string | null;
  status: string;
  ai_verdict: CorrectionVerdict | string | null;
  resolution_note: string | null;
  created_at: string | Date;
  product_name?: string;
}

export async function createCorrection(opts: {
  userId: string;
  barcode: string;
  field: string;
  message: string;
  suggestedValue?: string;
  status: "pending" | "accepted" | "rejected" | "manual";
  aiVerdict?: CorrectionVerdict | null;
  resolutionNote?: string;
  resolved: boolean;
}): Promise<string> {
  const id = uuid();
  await q(
    `INSERT INTO corrections
       (id, user_id, barcode, field, message, suggested_value, status, ai_verdict, resolution_note, resolved_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ${"$10"})`,
    [
      id,
      opts.userId,
      opts.barcode,
      opts.field,
      opts.message,
      opts.suggestedValue ?? null,
      opts.status,
      opts.aiVerdict ? JSON.stringify(opts.aiVerdict) : null,
      opts.resolutionNote ?? null,
      opts.resolved ? new Date() : null,
    ]
  );
  return id;
}

export async function listCorrections(status?: string, limit = 100): Promise<CorrectionRow[]> {
  if (status) {
    return q<CorrectionRow>(
      `SELECT c.*, p.name AS product_name
       FROM corrections c LEFT JOIN products p ON p.barcode = c.barcode
       WHERE c.status = $1 ORDER BY c.created_at ASC LIMIT $2`,
      [status, limit]
    );
  }
  return q<CorrectionRow>(
    `SELECT c.*, p.name AS product_name
     FROM corrections c LEFT JOIN products p ON p.barcode = c.barcode
     ORDER BY c.created_at DESC LIMIT $1`,
    [limit]
  );
}

export async function getCorrection(id: string): Promise<CorrectionRow | null> {
  const rows = await q<CorrectionRow>(`SELECT * FROM corrections WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function resolveCorrection(
  id: string,
  status: "accepted" | "rejected",
  note: string
): Promise<void> {
  await q(
    `UPDATE corrections SET status = $1, resolution_note = $2, resolved_at = now() WHERE id = $3`,
    [status, note, id]
  );
}

export async function countPendingCorrections(): Promise<number> {
  const rows = await q<{ n: string }>(
    `SELECT count(*)::text AS n FROM corrections WHERE status IN ('manual', 'pending')`
  );
  return Number(rows[0]?.n ?? 0);
}
