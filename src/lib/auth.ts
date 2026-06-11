import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { toSessionUser, userById } from "./repo/users";
import type { SessionUser } from "./types";

// ============================================================
// Session-Auth: signiertes JWT im httpOnly-Cookie, 30 Tage.
// Bewusst ohne Auth-Framework: volle Kontrolle, keine
// Breaking-Change-Lotterie bei einem sicherheitskritischen Teil.
// ============================================================

export const SESSION_COOKIE = "tl_session";
const MAX_AGE_S = 60 * 60 * 24 * 30;

let warned = false;

function secret(): Uint8Array {
  let value = process.env.AUTH_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET fehlt — in Produktion zwingend erforderlich.");
    }
    if (!warned) {
      console.warn("[truelabel] AUTH_SECRET nicht gesetzt — Dev-Fallback aktiv.");
      warned = true;
    }
    value = "truelabel-dev-secret-nicht-fuer-produktion";
  }
  return new TextEncoder().encode(value);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_S}s`)
    .sign(secret());
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S,
  };
}

/** User-ID aus dem Session-Cookie (oder null). */
export async function readSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const userId = await readSessionUserId();
  if (!userId) return null;
  const row = await userById(userId);
  return row ? toSessionUser(row) : null;
}
