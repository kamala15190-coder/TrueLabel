import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { updateDietPrefs } from "@/lib/repo/users";

const prefsSchema = z
  .object({
    vegan: z.boolean().optional(),
    vegetarisch: z.boolean().optional(),
    glutenfrei: z.boolean().optional(),
    laktosefrei: z.boolean().optional(),
    nussfrei: z.boolean().optional(),
    sojafrei: z.boolean().optional(),
    palmoelfrei: z.boolean().optional(),
    zuckerarm: z.boolean().optional(),
    bio: z.boolean().optional(),
    fairtrade: z.boolean().optional(),
  })
  .strict();

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const parsed = prefsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  await updateDietPrefs(user.id, parsed.data);
  return NextResponse.json({ ok: true });
}
