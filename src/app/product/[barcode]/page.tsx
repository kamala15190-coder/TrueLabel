import type { Metadata } from "next";
import Link from "next/link";
import { BackBar } from "@/components/BackBar";
import { ProductView } from "@/components/ProductView";
import { getSessionUser } from "@/lib/auth";
import { checkPersonal } from "@/lib/personal";
import { getOrFetchProduct } from "@/lib/productService";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ barcode: string }>;
  searchParams: Promise<{ scan?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { barcode } = await params;
  const product = await getOrFetchProduct(barcode).catch(() => null);
  if (!product) return { title: "Produkt nicht gefunden" };
  return {
    title: `${product.name} · Score ${product.scores.total}/100`,
    description: `Gesundheit ${product.scores.health.score} · Umwelt ${product.scores.eco.score} · Soziales ${product.scores.social.score}. Jetzt selbst scannen mit TrueLabel.`,
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { barcode } = await params;
  const { scan } = await searchParams;

  if (!/^\d{6,14}$/.test(barcode)) {
    return <InvalidOrMissing barcode={barcode} invalid />;
  }

  const product = await getOrFetchProduct(barcode).catch(() => null);
  if (!product) {
    return <InvalidOrMissing barcode={barcode} />;
  }

  const user = await getSessionUser();
  const personal = user ? checkPersonal(product, user.dietPrefs) : [];

  return (
    <main className="page no-nav">
      <BackBar title="Produkt" />
      <ProductView
        product={product}
        personal={personal}
        user={user}
        scanned={scan === "1"}
      />
    </main>
  );
}

function InvalidOrMissing({ barcode, invalid = false }: { barcode: string; invalid?: boolean }) {
  return (
    <main className="page no-nav">
      <BackBar />
      <div className="empty" style={{ paddingTop: 80 }}>
        <span className="ico">📦</span>
        <h1 className="h-l">
          {invalid ? "Ungültiger Barcode" : "Produkt nicht in unserer Datenbank"}
        </h1>
        <p className="body-l t2" style={{ maxWidth: 290 }}>
          {invalid
            ? "Dieser Code sieht nicht wie ein Produkt-Barcode aus."
            : "Du kannst dieses Produkt in einer Minute hinzufügen und hilfst damit der gesamten Community."}
        </p>
        {!invalid && (
          <Link href={`/add?barcode=${barcode}`} style={{ width: "100%" }}>
            <span className="btn btn-primary">＋ Produkt hinzufügen</span>
          </Link>
        )}
        <Link href="/" style={{ width: "100%" }}>
          <span className="btn btn-ghost">Weiter scannen</span>
        </Link>
      </div>
    </main>
  );
}
