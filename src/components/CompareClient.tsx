"use client";

import { useEffect, useRef, useState } from "react";
import { getLocalHistory } from "@/lib/clientHistory";
import { de, scoreColor } from "@/lib/shared";
import { CATEGORIES, COUNTRY_FLAGS, COUNTRY_NAMES } from "@/lib/scoring/data";
import type { Product } from "@/lib/types";
import { ScoreRings } from "./ScoreRings";

type Slot = "a" | "b";

export function CompareClient({ initialA, initialB }: { initialA?: string; initialB?: string }) {
  const [a, setA] = useState<Product | null>(null);
  const [b, setB] = useState<Product | null>(null);
  const [picking, setPicking] = useState<Slot | null>(null);

  const load = async (barcode: string, slot: Slot) => {
    try {
      const res = await fetch(`/api/products/${barcode}`);
      if (!res.ok) return;
      const json = await res.json();
      if (slot === "a") setA(json.product);
      else setB(json.product);
    } catch {
      /* ignorieren */
    }
  };

  useEffect(() => {
    if (initialA) load(initialA, "a");
    if (initialB) load(initialB, "b");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const winner: Slot | null =
    a && b ? (a.scores.total === b.scores.total ? null : a.scores.total > b.scores.total ? "a" : "b") : null;

  return (
    <div>
      <div className="cmp-grid mb20">
        <CompareCol product={a} winner={winner === "a"} onPick={() => setPicking("a")} />
        <CompareCol product={b} winner={winner === "b"} onPick={() => setPicking("b")} />
      </div>

      {a && b && (
        <>
          <span className="label mb8" style={{ display: "block" }}>Scores</span>
          <div className="card mb20" style={{ padding: "4px 16px" }}>
            {(
              [
                ["health", "🫀 Gesundheit"],
                ["eco", "🌍 Umwelt"],
                ["social", "🤝 Soziales"],
              ] as const
            ).map(([key, label]) => (
              <div className="cmp-row" key={key}>
                <span className="cmp-mini" style={{ color: scoreColor(a.scores[key].score) }}>
                  {a.scores[key].score}
                </span>
                <span className="lbl">{label}</span>
                <span className="cmp-mini" style={{ color: scoreColor(b.scores[key].score) }}>
                  {b.scores[key].score}
                </span>
              </div>
            ))}
          </div>

          <span className="label mb8" style={{ display: "block" }}>Details</span>
          <div className="card" style={{ padding: "4px 16px" }}>
            <div className="cmp-row">
              <span className="body-m tnum">{de(a.nutriments.sugars)} g</span>
              <span className="lbl">Zucker</span>
              <span className="body-m tnum">{de(b.nutriments.sugars)} g</span>
            </div>
            <div className="cmp-row">
              <span className="body-m tnum">{de(a.nutriments.energyKcal, 0)}</span>
              <span className="lbl">kcal</span>
              <span className="body-m tnum">{de(b.nutriments.energyKcal, 0)}</span>
            </div>
            <div className="cmp-row">
              <span className="body-m">{originLabel(a)}</span>
              <span className="lbl">Herkunft</span>
              <span className="body-m">{originLabel(b)}</span>
            </div>
            <div className="cmp-row">
              <span className="body-m">{a.labels.includes("organic") ? "✓ Bio" : "—"}</span>
              <span className="lbl">Bio</span>
              <span className="body-m">{b.labels.includes("organic") ? "✓ Bio" : "—"}</span>
            </div>
            <div className="cmp-row">
              <span className="body-m">{a.labels.includes("fairtrade") ? "✓ Fair" : "—"}</span>
              <span className="lbl">Fairtrade</span>
              <span className="body-m">{b.labels.includes("fairtrade") ? "✓ Fair" : "—"}</span>
            </div>
          </div>
          <p className="disclaimer center mt16">
            Scores sind algorithmisch berechnet und ersetzen keine medizinische oder behördliche Auskunft.
          </p>
        </>
      )}

      {picking && (
        <Picker
          onClose={() => setPicking(null)}
          onPick={(barcode) => {
            load(barcode, picking);
            setPicking(null);
          }}
        />
      )}
    </div>
  );
}

function originLabel(p: Product): string {
  const o = p.originCountry ?? "unknown";
  return `${COUNTRY_FLAGS[o] ?? ""} ${o === "unknown" ? "—" : (COUNTRY_NAMES[o] ?? o)}`.trim();
}

function CompareCol({
  product,
  winner,
  onPick,
}: {
  product: Product | null;
  winner: boolean;
  onPick: () => void;
}) {
  if (!product) {
    return (
      <button
        className="cmp-col"
        style={{
          border: "1.5px dashed var(--border-active)", background: "transparent",
          minHeight: 220, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer",
        }}
        onClick={onPick}
      >
        <span
          style={{
            width: 46, height: 46, borderRadius: "50%", border: "1.5px solid var(--border-active)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, color: "var(--accent)",
          }}
        >
          ＋
        </span>
        <span className="body-m t2">Produkt wählen</span>
      </button>
    );
  }
  const cat = CATEGORIES[product.category] ?? CATEGORIES.other;
  return (
    <div className={`cmp-col${winner ? " winner" : ""}`}>
      {winner && <span className="win-tag">Besser</span>}
      <div className="prod-thumb" style={{ margin: "0 auto 12px", width: 52, height: 52, fontSize: 24 }}>
        {cat.emoji}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
        <ScoreRings scores={product.scores} size={108} interactive={false} />
      </div>
      <b style={{ fontSize: 13, display: "block", lineHeight: 1.3 }}>{product.name}</b>
      <span className="micro">{product.brand}</span>
      <button className="link" style={{ display: "block", margin: "8px auto 0", fontSize: 12 }} onClick={onPick}>
        Ändern
      </button>
    </div>
  );
}

function Picker({ onClose, onPick }: { onClose: () => void; onPick: (barcode: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const history = getLocalHistory().slice(0, 5);

  const onInput = (value: string) => {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`);
        const json = await res.json();
        setResults(json.products ?? []);
      } catch {
        setResults([]);
      }
    }, 350);
  };

  return (
    <>
      <div className="sheet-veil" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-grip" />
        <h2 className="h-m mb16">Produkt wählen</h2>
        <input
          className="input mb16"
          placeholder="Suchen …"
          value={query}
          onChange={(e) => onInput(e.target.value)}
          autoFocus
        />
        {results.map((p) => (
          <button key={p.barcode} className="plist" onClick={() => onPick(p.barcode)}>
            <div className="pthumb">{(CATEGORIES[p.category] ?? CATEGORIES.other).emoji}</div>
            <div className="grow">
              <b style={{ fontSize: 15 }}>{p.name}</b>
              <div className="micro">{p.brand}</div>
            </div>
            <b style={{ color: scoreColor(p.scores.total) }} className="tnum">{p.scores.total}</b>
          </button>
        ))}
        {results.length === 0 && history.length > 0 && (
          <>
            <span className="label mb12" style={{ display: "block" }}>Aus deinem Verlauf</span>
            {history.map((h) => (
              <button key={h.barcode} className="plist" onClick={() => onPick(h.barcode)}>
                <div className="pthumb">{(CATEGORIES[h.category] ?? CATEGORIES.other).emoji}</div>
                <div className="grow">
                  <b style={{ fontSize: 15 }}>{h.name}</b>
                  <div className="micro">{h.brand}</div>
                </div>
                <b style={{ color: scoreColor(h.total) }} className="tnum">{h.total}</b>
              </button>
            ))}
          </>
        )}
      </div>
    </>
  );
}
