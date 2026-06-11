import type { Metadata } from "next";
import Link from "next/link";
import { AddWizard } from "@/components/AddWizard";
import { BackBar } from "@/components/BackBar";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Produkt hinzufügen" };
export const dynamic = "force-dynamic";

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ barcode?: string }>;
}) {
  const { barcode } = await searchParams;
  const user = await getSessionUser();

  if (!user) {
    return (
      <main className="page no-nav">
        <BackBar title="Produkt hinzufügen" />
        <div className="empty" style={{ paddingTop: 60 }}>
          <span className="ico">📦</span>
          <h1 className="h-l">Kurz anmelden, dann beitragen</h1>
          <p className="body-l t2" style={{ maxWidth: 300 }}>
            Damit Beiträge der Community zugeordnet werden können (und du deine
            +50 Punkte bekommst), brauchst du ein kostenloses Konto.
          </p>
          <Link href="/register" style={{ width: "100%" }}>
            <span className="btn btn-primary">Konto erstellen</span>
          </Link>
          <Link href="/login" style={{ width: "100%" }}>
            <span className="btn btn-ghost">Anmelden</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page no-nav">
      <BackBar title="Produkt hinzufügen" />
      <AddWizard initialBarcode={barcode ?? ""} />
    </main>
  );
}
