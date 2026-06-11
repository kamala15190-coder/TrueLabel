import type { Metadata } from "next";
import { HistoryClient, type HistoryEntry } from "@/components/HistoryClient";
import { getSessionUser } from "@/lib/auth";
import { listScans } from "@/lib/repo/community";
import type { Scores } from "@/lib/types";

export const metadata: Metadata = { title: "Verlauf" };
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getSessionUser();
  let serverScans: HistoryEntry[] | null = null;

  if (user) {
    const rows = await listScans(user.id);
    serverScans = rows.map((r) => {
      const data = (typeof r.data === "string" ? JSON.parse(r.data) : r.data) as {
        category?: string;
      };
      const scores = (typeof r.scores === "string" ? JSON.parse(r.scores) : r.scores) as Scores;
      return {
        barcode: r.barcode,
        name: r.name,
        brand: r.brand,
        total: scores.total,
        category: data.category ?? "other",
        at: new Date(r.created_at).toISOString(),
      };
    });
  }

  return (
    <main className="page">
      <h1 className="h-l mb16" style={{ marginTop: 6 }}>Dein Verlauf</h1>
      <HistoryClient
        serverScans={serverScans}
        loggedIn={user != null}
        premium={user?.premium ?? false}
      />
    </main>
  );
}
