import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { googleEnabled } from "@/lib/google";
import { userStats } from "@/lib/repo/users";
import { stripeEnabled } from "@/lib/stripe";

export async function GET() {
  const user = await getSessionUser();
  const providers = { google: googleEnabled(), stripe: stripeEnabled() };
  if (!user) return NextResponse.json({ user: null, providers });
  const stats = await userStats(user.id);
  return NextResponse.json({ user, stats, providers });
}
