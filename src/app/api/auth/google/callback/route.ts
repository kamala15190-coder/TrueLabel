import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { exchangeGoogleCode, googleEnabled } from "@/lib/google";
import { createUser, linkGoogle, userByEmail } from "@/lib/repo/users";

function redirectWithError(origin: string, message: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  if (!googleEnabled()) return redirectWithError(origin, "Google-Login ist nicht konfiguriert.");

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieHeader = req.headers.get("cookie") ?? "";
  const stateCookie = /(?:^|;\s*)tl_oauth_state=([^;]+)/.exec(cookieHeader)?.[1];

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return redirectWithError(origin, "Anmeldung abgebrochen oder ungültig.");
  }

  const profile = await exchangeGoogleCode(code).catch(() => null);
  if (!profile) return redirectWithError(origin, "Google-Anmeldung fehlgeschlagen.");

  let row = await userByEmail(profile.email);
  if (!row) {
    row = await createUser({ email: profile.email, name: profile.name, googleSub: profile.sub });
  } else if (!row.google_sub) {
    await linkGoogle(row.id, profile.sub);
  }

  const token = await createSessionToken(row.id);
  const res = NextResponse.redirect(new URL("/", origin));
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  res.cookies.set("tl_oauth_state", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
