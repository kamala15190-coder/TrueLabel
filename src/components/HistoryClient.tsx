"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getLocalHistory } from "@/lib/clientHistory";
import { CATEGORIES } from "@/lib/scoring/data";
import { MiniRing } from "./ScoreRings";

export interface HistoryEntry {
  barcode: string;
  name: string;
  brand: string;
  total: number;
  category: string;
  at: string;
}

type Filter = "all" | "week" | "month";

export function HistoryClient({
  serverScans,
  loggedIn,
  premium,
}: {
  serverScans: HistoryEntry[] | null;
  loggedIn: boolean;
  premium: boolean;
}) {
  const router = useRouter();
  const [local, setLocal] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!loggedIn) {
      setLocal(
        getLocalHistory().map((s) => ({
          barcode: s.barcode, name: s.name, brand: s.brand,
          total: s.total, category: s.category, at: s.at,
        }))
      );
    }
  }, [loggedIn]);

  const entries = loggedIn ? (serverScans ?? []) : local;

  const cutoff =
    filter === "week" ? Date.now() - 7 * 86400_000 :
    filter === "month" ? Date.now() - 30 * 86400_000 : 0;
  const filtered = entries.filter((e) => new Date(e.at).getTime() >= cutoff);

  const fmt = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400_000);
    const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === today.toDateString()) return `Heute · ${time}`;
    if (d.toDateString() === yesterday.toDateString()) return `Gestern · ${time}`;
    return `${d.toLocaleDateString("de-DE", { day: "numeric", month: "long" })} · ${time}`;
  };

  return (
    <div>
      <div className="row gap8 mb20" style={{ flexWrap: "wrap" }}>
        {(
          [
            ["all", "Alle"],
            ["week", "Diese Woche"],
            ["month", "Dieser Monat"],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            className={`chip${filter === key ? " on" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
        {premium && (
          <a href="/api/export/history" className="chip" style={{ marginLeft: "auto" }}>
            ⬇︎ CSV
          </a>
        )}
      </div>

      {!loggedIn && entries.length > 0 && (
        <div className="banner banner-info mb16">
          Dein Verlauf liegt nur auf diesem Gerät.{" "}
          <Link href="/register" style={{ textDecoration: "underline" }}>
            Konto erstellen
          </Link>{" "}
          und nichts mehr verlieren.
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty">
          <span className="ico">🕐</span>
          <h2 className="h-m">Noch keine gescannten Produkte</h2>
          <p className="body-m t2">Scanne deinen ersten Barcode. Das dauert nur zwei Sekunden.</p>
          <Link href="/" style={{ width: "100%" }}>
            <span className="btn btn-primary btn-sm">Jetzt scannen</span>
          </Link>
        </div>
      ) : (
        filtered.map((e, i) => (
          <button
            key={`${e.barcode}-${i}`}
            className="plist"
            onClick={() => router.push(`/product/${e.barcode}`)}
          >
            <div className="pthumb">{(CATEGORIES[e.category] ?? CATEGORIES.other).emoji}</div>
            <div className="grow">
              <div className="micro" style={{ color: "var(--text-3)", marginBottom: 2 }}>{fmt(e.at)}</div>
              <b style={{ fontSize: 15 }}>{e.name}</b>
              <div className="micro">{e.brand}</div>
            </div>
            <MiniRing score={e.total} />
          </button>
        ))
      )}
    </div>
  );
}
