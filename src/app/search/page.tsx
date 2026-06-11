import type { Metadata } from "next";
import { SearchClient } from "@/components/SearchClient";

export const metadata: Metadata = { title: "Suche" };

export default function SearchPage() {
  return (
    <main className="page">
      <h1 className="h-l mb16" style={{ marginTop: 6 }}>Suche</h1>
      <SearchClient />
    </main>
  );
}
