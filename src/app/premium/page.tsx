import type { Metadata } from "next";
import { BackBar } from "@/components/BackBar";
import { PremiumClient } from "@/components/PremiumClient";
import { getSessionUser } from "@/lib/auth";
import { stripeEnabled } from "@/lib/stripe";

export const metadata: Metadata = { title: "Premium" };
export const dynamic = "force-dynamic";

const FEATURES = [
  "Intelligente Alternativen — bessere Produkte, abgestimmt auf dein Profil",
  "Detaillierter Score-Breakdown mit wissenschaftlichen Quellen",
  "Produktvergleich (2 Produkte nebeneinander)",
  "Einkaufsliste erstellen & als CSV exportieren",
  "Verlauf-Export (CSV)",
  "Offline-Zugriff auf zuletzt geöffnete Produkte",
  "Priorisierung deiner Community-Beiträge",
];

export default async function PremiumPage() {
  const user = await getSessionUser();

  return (
    <main className="page no-nav">
      <BackBar />
      <div className="center mb20">
        <div
          style={{
            width: 72, height: 72, borderRadius: 20, background: "var(--gold-soft)",
            border: "1px solid rgba(244,200,66,.3)", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 0 40px rgba(244,200,66,.2)",
          }}
        >
          <span style={{ fontSize: 36 }}>👑</span>
        </div>
        <h1 className="h-l" style={{ color: "var(--gold)" }}>TrueLabel Premium</h1>
        <p className="body-m t2 mt8" style={{ maxWidth: 280, marginInline: "auto" }}>
          Alles, was du brauchst. Nichts, was du nicht brauchst.
        </p>
      </div>

      <div className="card" style={{ padding: "8px 18px" }}>
        {FEATURES.map((f) => (
          <div className="feat" key={f}>
            <span className="fcheck">✓</span>
            <span className="ft">{f}</span>
          </div>
        ))}
      </div>

      <PremiumClient
        loggedIn={user != null}
        alreadyPremium={user?.premium ?? false}
        stripeConfigured={stripeEnabled()}
      />
    </main>
  );
}
