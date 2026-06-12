import type { Metadata } from "next";
import Link from "next/link";
import { BackBar } from "@/components/BackBar";
import { ListClient } from "@/components/ListClient";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Einkaufsliste" };
export const dynamic = "force-dynamic";

export default async function ListsPage() {
  const user = await getSessionUser();

  if (!user?.premium) {
    return (
      <main className="page no-nav">
        <BackBar title="Einkaufsliste" />
        <div className="empty" style={{ paddingTop: 60 }}>
          <span className="ico" style={{ opacity: 1 }}>🛒</span>
          <h1 className="h-l">Deine Einkaufsliste</h1>
          <p className="body-l t2" style={{ maxWidth: 300 }}>
            Produkte direkt vom Scan auf die Liste, abhaken im Markt, als CSV
            exportieren. Das gehört zu TrueLabel Premium.
          </p>
          <Link href="/premium" style={{ width: "100%" }}>
            <span className="btn btn-gold">👑 Premium entdecken</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page no-nav">
      <BackBar title="Einkaufsliste" />
      <ListClient />
    </main>
  );
}
