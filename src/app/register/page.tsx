import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { BackBar } from "@/components/BackBar";
import { googleEnabled } from "@/lib/google";

export const metadata: Metadata = { title: "Konto erstellen" };
export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <main className="page no-nav">
      <BackBar />
      <h1 className="h-l mb8">Konto erstellen</h1>
      <p className="body-m t2 mb24">
        Kostenlos, für immer. Dein Verlauf wird automatisch übernommen.
      </p>
      <AuthForm mode="register" googleEnabled={googleEnabled()} />
    </main>
  );
}
