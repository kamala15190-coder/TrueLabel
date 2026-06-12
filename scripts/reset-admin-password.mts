// ============================================================
// Admin-Passwort zurücksetzen.
// Setzt password_hash (bcrypt) für eine bestehende User-Zeile neu.
//
// Start (lädt .env vorher):
//   set -a; . .env.local; set +a
//   NEW_PASSWORD='deinNeuesPasswort' npx --yes tsx scripts/reset-admin-password.mts
//
// Env:
//   NEW_PASSWORD  (Pflicht) neues Klartext-Passwort
//   EMAIL         (optional) Ziel-Account; Default = ADMIN_EMAIL
// ============================================================
import pg from "pg";
import bcrypt from "bcryptjs";

const email = (process.env.EMAIL ?? process.env.ADMIN_EMAIL ?? "").trim();
const pw = process.env.NEW_PASSWORD ?? "";
const url = process.env.DATABASE_URL;

if (!url) throw new Error("DATABASE_URL fehlt (set -a; . .env.local; set +a)");
if (!email) throw new Error("EMAIL/ADMIN_EMAIL fehlt");
if (pw.length < 8) throw new Error("NEW_PASSWORD fehlt oder < 8 Zeichen");

const needsSsl = /supabase\.|sslmode=require|neon\.tech|\.pooler\./i.test(url);
const pool = new pg.Pool({ connectionString: url, ssl: needsSsl ? { rejectUnauthorized: false } : undefined });

const hash = await bcrypt.hash(pw, 12);
const res = await pool.query(
  `UPDATE users SET password_hash = $1 WHERE lower(email) = lower($2) RETURNING id, email, role`,
  [hash, email]
);

if (res.rowCount === 0) {
  console.error(`❌ Kein User mit E-Mail ${email} gefunden.`);
} else {
  const u = res.rows[0];
  console.log(`✅ Passwort gesetzt für ${u.email} (role=${u.role}, id=${u.id})`);
}
await pool.end();
