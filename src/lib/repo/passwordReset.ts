import { randomBytes } from "node:crypto";
import { q } from "../db";
import { sha256 } from "../util";

// ============================================================
// Passwort-Reset-Token. In der DB liegt nur der SHA-256-Hash des
// Tokens — der Klartext geht ausschließlich per Mail an den Nutzer.
// Tokens sind einmalig nutzbar und laufen nach TTL_MINUTES ab.
// ============================================================

const TTL_MINUTES = 60;

/** Erstellt ein Reset-Token, speichert dessen Hash, gibt das Klartext-Token zurück. */
export async function createResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TTL_MINUTES * 60_000);
  // Alte, noch offene Tokens des Nutzers entwerten (nur das jüngste gilt).
  await q(`UPDATE password_resets SET used = true WHERE user_id = $1 AND used = false`, [userId]);
  await q(
    `INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES ($1, $2, $3)`,
    [sha256(token), userId, expires]
  );
  return token;
}

/** Prüft ein Klartext-Token und gibt die User-ID zurück (oder null bei ungültig/abgelaufen/verbraucht). */
export async function userIdForResetToken(token: string): Promise<string | null> {
  const rows = await q<{ user_id: string }>(
    `SELECT user_id FROM password_resets
     WHERE token_hash = $1 AND used = false AND expires_at > now()`,
    [sha256(token)]
  );
  return rows[0]?.user_id ?? null;
}

/** Markiert ein Token als verbraucht. */
export async function consumeResetToken(token: string): Promise<void> {
  await q(`UPDATE password_resets SET used = true WHERE token_hash = $1`, [sha256(token)]);
}
