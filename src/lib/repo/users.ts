import { q } from "../db";
import type { DietPrefs, SessionUser } from "../types";
import { uuid } from "../util";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  google_sub: string | null;
  name: string;
  role: string;
  points: number;
  premium_until: string | Date | null;
  stripe_customer_id: string | null;
  diet_prefs: DietPrefs | string;
}

export function toSessionUser(row: UserRow): SessionUser {
  const prefs: DietPrefs =
    typeof row.diet_prefs === "string" ? JSON.parse(row.diet_prefs) : (row.diet_prefs ?? {});
  const premiumUntil = row.premium_until ? new Date(row.premium_until) : null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role === "admin" ? "admin" : "user",
    points: row.points,
    premium: row.role === "admin" || (premiumUntil != null && premiumUntil > new Date()),
    dietPrefs: prefs,
  };
}

export async function userById(id: string): Promise<UserRow | null> {
  const rows = await q<UserRow>(`SELECT * FROM users WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function userByEmail(email: string): Promise<UserRow | null> {
  const rows = await q<UserRow>(`SELECT * FROM users WHERE lower(email) = lower($1)`, [email]);
  return rows[0] ?? null;
}

export async function userByStripeCustomer(customerId: string): Promise<UserRow | null> {
  const rows = await q<UserRow>(`SELECT * FROM users WHERE stripe_customer_id = $1`, [customerId]);
  return rows[0] ?? null;
}

export async function createUser(opts: {
  email: string;
  passwordHash?: string;
  name: string;
  googleSub?: string;
}): Promise<UserRow> {
  const id = uuid();
  const admin =
    process.env.ADMIN_EMAIL &&
    opts.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
  const rows = await q<UserRow>(
    `INSERT INTO users (id, email, password_hash, google_sub, name, role)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [id, opts.email, opts.passwordHash ?? null, opts.googleSub ?? null, opts.name, admin ? "admin" : "user"]
  );
  return rows[0];
}

export async function linkGoogle(userId: string, googleSub: string): Promise<void> {
  await q(`UPDATE users SET google_sub = $1 WHERE id = $2`, [googleSub, userId]);
}

export async function setPassword(userId: string, passwordHash: string): Promise<void> {
  await q(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, userId]);
}

export async function updateDietPrefs(userId: string, prefs: DietPrefs): Promise<void> {
  await q(`UPDATE users SET diet_prefs = $1 WHERE id = $2`, [JSON.stringify(prefs), userId]);
}

export async function addPoints(userId: string, delta: number, reason: string): Promise<void> {
  await q(`UPDATE users SET points = points + $1 WHERE id = $2`, [delta, userId]);
  await q(
    `INSERT INTO points_ledger (id, user_id, delta, reason) VALUES ($1, $2, $3, $4)`,
    [uuid(), userId, delta, reason]
  );
}

export async function setStripeCustomer(userId: string, customerId: string): Promise<void> {
  await q(`UPDATE users SET stripe_customer_id = $1 WHERE id = $2`, [customerId, userId]);
}

export async function setPremiumUntil(userId: string, until: Date | null): Promise<void> {
  await q(`UPDATE users SET premium_until = $1 WHERE id = $2`, [until, userId]);
}

export interface UserStats {
  scans: number;
  contributions: number;
  corrections: number;
}

export async function userStats(userId: string): Promise<UserStats> {
  const [s, c, k] = await Promise.all([
    q<{ n: string }>(`SELECT count(*)::text AS n FROM scans WHERE user_id = $1`, [userId]),
    q<{ n: string }>(`SELECT count(*)::text AS n FROM contributions WHERE user_id = $1`, [userId]),
    q<{ n: string }>(`SELECT count(*)::text AS n FROM corrections WHERE user_id = $1`, [userId]),
  ]);
  return {
    scans: Number(s[0]?.n ?? 0),
    contributions: Number(c[0]?.n ?? 0),
    corrections: Number(k[0]?.n ?? 0),
  };
}
