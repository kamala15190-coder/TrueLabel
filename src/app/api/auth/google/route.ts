import { NextResponse } from "next/server";
import { googleAuthUrl, googleEnabled } from "@/lib/google";
import { uuid } from "@/lib/util";

export async function GET() {
  if (!googleEnabled()) {
    return NextResponse.json({ error: "Google-Login ist nicht konfiguriert." }, { status: 404 });
  }
  const state = uuid();
  const res = NextResponse.redirect(googleAuthUrl(state));
  res.cookies.set("tl_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
