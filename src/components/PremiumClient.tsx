"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PremiumClient({
  loggedIn,
  alreadyPremium,
  stripeConfigured,
}: {
  loggedIn: boolean;
  alreadyPremium: boolean;
  stripeConfigured: boolean;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const checkout = async () => {
    if (!loggedIn) {
      router.push("/register");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/premium/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Etwas ist schiefgelaufen.");
        return;
      }
      if (json.url) window.location.href = json.url;
    } finally {
      setBusy(false);
    }
  };

  if (alreadyPremium) {
    return (
      <div className="banner banner-good mt20">
        👑 Premium ist aktiv. Danke, dass du TrueLabel möglich machst!
      </div>
    );
  }

  return (
    <div>
      <div className="cmp-grid mt20 mb16">
        <button
          className="cmp-col"
          style={plan === "monthly" ? { borderColor: "rgba(244,200,66,.55)", boxShadow: "0 0 0 1px rgba(244,200,66,.35)" } : undefined}
          onClick={() => setPlan("monthly")}
        >
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px" }}>2,49 €</div>
          <div className="micro">pro Monat</div>
        </button>
        <button
          className="cmp-col"
          style={plan === "yearly" ? { borderColor: "rgba(244,200,66,.55)", boxShadow: "0 0 0 1px rgba(244,200,66,.35)" } : undefined}
          onClick={() => setPlan("yearly")}
        >
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px" }}>19,99 €</div>
          <div className="micro">pro Jahr · <span style={{ color: "var(--gold)" }}>2 Monate gratis</span></div>
        </button>
      </div>

      {error && <div className="banner banner-bad mb12">{error}</div>}
      {!stripeConfigured && (
        <div className="banner banner-info mb12">
          Zahlungen werden gerade eingerichtet. Premium ist in Kürze buchbar.
        </div>
      )}

      <button className="btn btn-gold" onClick={checkout} disabled={busy || !stripeConfigured}>
        {busy ? "Einen Moment …" : "👑 Premium starten"}
      </button>
      <p className="micro center mt12 mb16">
        Jederzeit kündbar. Keine versteckten Kosten. Abwicklung über Stripe.
      </p>
      <Link href="/">
        <span className="btn btn-ghost btn-sm">Vielleicht später</span>
      </Link>
    </div>
  );
}
