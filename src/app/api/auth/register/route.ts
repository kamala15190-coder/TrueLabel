import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { createUser, toSessionUser, userByEmail } from "@/lib/repo/users";

const schema = z.object({
  email: z.string().email("Bitte eine gültige E-Mail-Adresse angeben."),
  password: z.string().min(8, "Das Passwort braucht mindestens 8 Zeichen."),
  name: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 }
    );
  }
  const { email, password, name } = parsed.data;

  if (await userByEmail(email)) {
    return NextResponse.json(
      { error: "Für diese E-Mail existiert bereits ein Konto." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const row = await createUser({
    email,
    passwordHash,
    name: name?.trim() || email.split("@")[0],
  });

  const token = await createSessionToken(row.id);
  const res = NextResponse.json({ user: toSessionUser(row) });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
