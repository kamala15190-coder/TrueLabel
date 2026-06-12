import type { Metadata } from "next";
import { BackBar } from "@/components/BackBar";
import { ResetForm } from "@/components/ResetForm";

export const metadata: Metadata = { title: "Neues Passwort" };
export const dynamic = "force-dynamic";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <main className="page no-nav">
      <BackBar />
      <h1 className="h-l mb8">Neues Passwort</h1>
      <p className="body-m t2 mb24">Wähle ein neues Passwort für dein Konto.</p>
      <ResetForm token={token ?? ""} />
    </main>
  );
}
