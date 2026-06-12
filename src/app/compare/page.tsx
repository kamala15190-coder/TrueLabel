import type { Metadata } from "next";
import Link from "next/link";
import { BackBar } from "@/components/BackBar";
import { CompareClient } from "@/components/CompareClient";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Produkte vergleichen" };
export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  const user = await getSessionUser();

  if (!user?.premium) {
    return (
      <main className="page no-nav">
        <BackBar title="Vergleichen" />
        <div className="empty" style={{ paddingTop: 60 }}>
          <span className="ico" style={{ opacity: 1 }}>⚖️</span>
          <h1 className="h-l">Produkte nebeneinander</h1>
          <p className="body-l t2" style={{ maxWidth: 300 }}>
            Zwei Produkte, alle Scores, ein klarer Gewinner. Der Produktvergleich
            ist Teil von TrueLabel Premium.
          </p>
          <Link href="/premium" style={{ width: "100%" }}>
            <span className="btn btn-gold">👑 Premium entdecken</span>
          </Link>
          {!user && (
            <Link href="/login" style={{ width: "100%" }}>
              <span className="btn btn-ghost">Anmelden</span>
            </Link>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="page no-nav">
      <BackBar title="Vergleichen" />
      <CompareClient initialA={a} initialB={b} />
    </main>
  );
}
