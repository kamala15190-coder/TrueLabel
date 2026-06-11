import { decodeJwt } from "jose";

// ============================================================
// Google OAuth 2.0 (Authorization Code Flow), manuell implementiert.
// Endpunkte sind seit Jahren stabil. Nur aktiv, wenn Client-ID
// und Secret gesetzt sind — sonst wird der Button ausgeblendet.
// ============================================================

export function googleEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function redirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function googleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleProfile | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { id_token?: string };
  if (!json.id_token) return null;
  // id_token kommt direkt von Googles Token-Endpunkt über TLS — decode genügt.
  const payload = decodeJwt(json.id_token);
  if (!payload.email || !payload.sub) return null;
  return {
    sub: String(payload.sub),
    email: String(payload.email),
    name: String(payload.name ?? String(payload.email).split("@")[0]),
  };
}
