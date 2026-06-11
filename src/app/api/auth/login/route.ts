import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { toSessionUser, userByEmail } from "@/lib/repo/users";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  const row = await userByEmail(parsed.data.email);
  // Identische Fehlermeldung für „User existiert nicht" und „Passwort falsch"
  const fail = NextResponse.json(
    { error: "E-Mail oder Passwort ist falsch." },
    { status: 401 }
  );
  if (!row || !row.password_hash) return fail;

  const ok = await bcrypt.compare(parsed.data.password, row.password_hash);
  if (!ok) return fail;

  const token = await createSessionToken(row.id);
  const res = NextResponse.json({ user: toSessionUser(row) });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
