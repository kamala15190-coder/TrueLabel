import type { Metadata } from "next";
import Link from "next/link";
import { BackBar } from "@/components/BackBar";
import { CorrectionForm } from "@/components/CorrectionForm";
import { getSessionUser } from "@/lib/auth";
import { getProduct } from "@/lib/repo/products";

export const metadata: Metadata = { title: "Korrektur vorschlagen" };
export const dynamic = "force-dynamic";

export default async function CorrectPage({
  params,
}: {
  params: Promise<{ barcode: string }>;
}) {
  const { barcode } = await params;
  const [user, product] = await Promise.all([getSessionUser(), getProduct(barcode)]);

  if (!product) {
    return (
      <main className="page no-nav">
        <BackBar />
        <div className="empty"><span className="ico">📦</span><p className="body-m t2">Produkt nicht gefunden.</p></div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page no-nav">
        <BackBar title="Korrektur vorschlagen" />
        <div className="empty" style={{ paddingTop: 60 }}>
          <span className="ico">✎</span>
          <h1 className="h-l">Kurz anmelden, dann korrigieren</h1>
          <p className="body-l t2" style={{ maxWidth: 300 }}>
            Korrekturen brauchen ein kostenloses Konto — so bleibt die Datenbank
            vertrauenswürdig und du bekommst Punkte für übernommene Korrekturen.
          </p>
          <Link href="/login" style={{ width: "100%" }}>
            <span className="btn btn-primary">Anmelden</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page no-nav">
      <BackBar title="Korrektur vorschlagen" />
      <CorrectionForm
        barcode={product.barcode}
        productName={`${product.name}${product.brand ? ` — ${product.brand}` : ""}`}
      />
    </main>
  );
}
