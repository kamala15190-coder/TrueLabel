import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminClient } from "@/components/AdminClient";
import { BackBar } from "@/components/BackBar";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/");

  return (
    <main className="page no-nav">
      <BackBar title="Admin-Panel" />
      <AdminClient />
    </main>
  );
}
