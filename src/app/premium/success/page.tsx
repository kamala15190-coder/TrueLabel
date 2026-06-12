import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Willkommen bei Premium" };

export default function PremiumSuccessPage() {
  return (
    <main className="page no-nav">
      <div className="empty" style={{ paddingTop: 100 }}>
        <span className="ico" style={{ opacity: 1 }}>👑</span>
        <h1 className="h-l">Willkommen bei Premium!</h1>
        <p className="body-l t2" style={{ maxWidth: 300 }}>
          Deine Zahlung wird verarbeitet. Alle Premium-Funktionen sind in wenigen
          Sekunden freigeschaltet: Alternativen, Vergleich, Listen und Quellen.
        </p>
        <Link href="/" style={{ width: "100%" }}>
          <span className="btn btn-primary">Weiter scannen</span>
        </Link>
      </div>
    </main>
  );
}
