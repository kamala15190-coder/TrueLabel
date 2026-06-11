import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { BackBar } from "@/components/BackBar";
import { googleEnabled } from "@/lib/google";

export const metadata: Metadata = { title: "Anmelden" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="page no-nav">
      <BackBar />
      <h1 className="h-l mb8">Willkommen zurück</h1>
      <p className="body-m t2 mb24">Schön, dich wiederzusehen.</p>
      <AuthForm mode="login" googleEnabled={googleEnabled()} initialError={error} />
    </main>
  );
}
