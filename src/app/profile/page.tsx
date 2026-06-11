import type { Metadata } from "next";
import Link from "next/link";
import { ProfileClient } from "@/components/ProfileClient";
import { getSessionUser } from "@/lib/auth";
import { userStats } from "@/lib/repo/users";
import { stripeEnabled } from "@/lib/stripe";

export const metadata: Metadata = { title: "Profil" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <main className="page">
        <h1 className="h-l mb16" style={{ marginTop: 6 }}>Profil</h1>
        <div className="empty">
          <span className="ico">👤</span>
          <h2 className="h-m">Noch kein Konto</h2>
          <p className="body-m t2" style={{ maxWidth: 280 }}>
            Scannen geht auch ohne. Mit Konto sicherst du deinen Verlauf,
            sammelst Punkte und kannst Produkte beitragen.
          </p>
          <Link href="/register" style={{ width: "100%" }}>
            <span className="btn btn-primary">Konto erstellen</span>
          </Link>
          <Link href="/login" style={{ width: "100%" }}>
            <span className="btn btn-ghost">Anmelden</span>
          </Link>
          <div className="row gap12 mt16">
            <Link href="/legal/datenschutz" className="micro">Datenschutz</Link>
            <Link href="/legal/agb" className="micro">AGB</Link>
            <Link href="/legal/impressum" className="micro">Impressum</Link>
          </div>
        </div>
      </main>
    );
  }

  const stats = await userStats(user.id);

  return (
    <main className="page">
      <h1 className="h-l mb20" style={{ marginTop: 6 }}>Profil</h1>
      <ProfileClient user={user} stats={stats} stripeConfigured={stripeEnabled()} />
    </main>
  );
}
