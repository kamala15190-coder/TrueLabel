"use client";

// Anonymer Scan-Verlauf in localStorage — Scannen funktioniert ohne Konto.
// Beim Login wird der lokale Verlauf ins Konto übernommen (Merge-API).

export interface LocalScan {
  barcode: string;
  name: string;
  brand: string;
  total: number;
  category: string;
  at: string; // ISO
}

const KEY = "tl_history";
const MAX = 60;

export function getLocalHistory(): LocalScan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalScan[]) : [];
  } catch {
    return [];
  }
}

export function addLocalScan(scan: Omit<LocalScan, "at">): void {
  if (typeof window === "undefined") return;
  const list = getLocalHistory().filter((s) => s.barcode !== scan.barcode);
  list.unshift({ ...scan, at: new Date().toISOString() });
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* Speicher voll → ignorieren */
  }
}

export function clearLocalHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

/** Lokalen Verlauf nach Login ins Konto übernehmen. */
export async function mergeLocalHistory(): Promise<void> {
  const items = getLocalHistory().map((s) => ({ barcode: s.barcode, at: s.at }));
  if (items.length === 0) return;
  try {
    await fetch("/api/history/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
  } catch {
    /* Merge ist best-effort */
  }
}
