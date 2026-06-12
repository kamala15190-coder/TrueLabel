"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/scoring/data";
import type { Product } from "@/lib/types";
import { MiniRing } from "./ScoreRings";

const RECENT_KEY = "tl_recent_searches";
const POPULAR_CATS = ["milk", "snacks", "beverages", "frozen", "sweets", "bread"] as const;

export function SearchClient() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {
      /* egal */
    }
  }, []);

  const remember = (q: string) => {
    const next = [q, ...recent.filter((r) => r !== q)].slice(0, 5);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* egal */
    }
  };

  const run = async (url: string, rememberAs?: string) => {
    setBusy(true);
    try {
      const res = await fetch(url);
      const json = await res.json();
      setResults(json.products ?? []);
      if (rememberAs) remember(rememberAs);
    } catch {
      setResults([]);
    } finally {
      setBusy(false);
    }
  };

  const onInput = (value: string) => {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setResults(null);
      return;
    }
    timer.current = setTimeout(() => {
      run(`/api/search?q=${encodeURIComponent(value.trim())}`, value.trim());
    }, 350);
  };

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 22 }}>
        <svg
          style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}
          width="18" height="18" viewBox="0 0 18 18" fill="none"
        >
          <circle cx="8" cy="8" r="6" stroke="#8A8A8A" strokeWidth="1.6" />
          <path d="M12.5 12.5L16 16" stroke="#8A8A8A" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          className="input"
          style={{ paddingLeft: 44 }}
          placeholder="Produkt oder Marke suchen …"
          value={query}
          onChange={(e) => onInput(e.target.value)}
          autoFocus
        />
      </div>

      {busy && <div className="spinner" />}

      {!busy && results != null && (
        <>
          <p className="micro mb12">{results.length} Ergebnisse</p>
          {results.map((p) => (
            <button key={p.barcode} className="plist" onClick={() => router.push(`/product/${p.barcode}`)}>
              <div className="pthumb">{(CATEGORIES[p.category] ?? CATEGORIES.other).emoji}</div>
              <div className="grow">
                <b style={{ fontSize: 15 }}>{p.name}</b>
                <div className="micro">{p.brand || (CATEGORIES[p.category] ?? CATEGORIES.other).label}</div>
              </div>
              <MiniRing score={p.scores.total} />
            </button>
          ))}
          {results.length === 0 && (
            <div className="empty">
              <span className="ico">🔍</span>
              <p className="body-m t2">
                Nichts gefunden. Scanne den Barcode oder füge das Produkt selbst hinzu.
              </p>
            </div>
          )}
        </>
      )}

      {!busy && results == null && (
        <>
          {recent.length > 0 && (
            <>
              <span className="label mb12" style={{ display: "block" }}>Zuletzt gesucht</span>
              <div className="row gap8 mb24" style={{ flexWrap: "wrap" }}>
                {recent.map((r) => (
                  <button key={r} className="chip" onClick={() => { setQuery(r); run(`/api/search?q=${encodeURIComponent(r)}`); }}>
                    {r}
                  </button>
                ))}
              </div>
            </>
          )}
          <span className="label mb12" style={{ display: "block" }}>Beliebte Kategorien</span>
          <div className="cat-grid">
            {POPULAR_CATS.map((key) => (
              <button key={key} className="cat-tile" onClick={() => run(`/api/search?cat=${key}`)}>
                <span className="e">{CATEGORIES[key].emoji}</span>
                {CATEGORIES[key].label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
