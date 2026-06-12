import type { Metadata } from "next";
import { BackBar } from "@/components/BackBar";
import { ForgotForm } from "@/components/ForgotForm";

export const metadata: Metadata = { title: "Passwort vergessen" };
export const dynamic = "force-dynamic";

export default function ForgotPage() {
  return (
    <main className="page no-nav">
      <BackBar />
      <h1 className="h-l mb8">Passwort vergessen</h1>
      <p className="body-m t2 mb24">
        Gib deine E-Mail-Adresse ein. Wir senden dir einen Link, mit dem du ein neues
        Passwort festlegen kannst.
      </p>
      <ForgotForm />
    </main>
  );
}
