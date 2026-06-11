import Link from "next/link";
import { Onboarding } from "@/components/Onboarding";
import { Scanner } from "@/components/Scanner";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <main className="page">
      <Onboarding />

      <div className="row between mb16" style={{ marginTop: 4 }}>
        <div className="logo-mark">
          <div className="lm-ico" style={{ width: 34, height: 34 }}>
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <path
                d="M8 20l8 8 16-16"
                stroke="#fff"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="logo-word" style={{ fontSize: 19 }}>
            True<b>Label</b>
          </span>
        </div>
        {user ? (
          <Link href="/profile">
            <span className="badge badge-accent">★ {user.points} Punkte</span>
          </Link>
        ) : (
          <Link href="/login">
            <span className="badge badge-accent">Anmelden</span>
          </Link>
        )}
      </div>

      <div className="mt12 mb20">
        <h1 className="h-xl">
          Was steckt<br />
          <em style={{ color: "var(--leaf)" }}>wirklich</em> drin?
        </h1>
        <p className="body-l t2 mt12" style={{ maxWidth: 320 }}>
          Ein Scan genügt — und du siehst in Sekunden, wie gesund, nachhaltig und
          fair dein Essen wirklich ist.
        </p>
      </div>

      <Scanner />

      <div className="center mt24">
        <Link href="/search" className="link">
          Produkt ohne Barcode suchen →
        </Link>
      </div>

      <p className="micro center mt24">
        Unbegrenzte Scans · Kostenlos · Keine Werbung
      </p>
    </main>
  );
}
