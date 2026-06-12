"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CorrectionVerdict, Product } from "@/lib/types";

interface CorrectionItem {
  id: string;
  barcode: string;
  field: string;
  message: string;
  suggested_value: string | null;
  status: string;
  ai_verdict: CorrectionVerdict | string | null;
  resolution_note: string | null;
  created_at: string;
  product_name?: string;
}

interface Overview {
  pendingCorrections: CorrectionItem[];
  recentCorrections: CorrectionItem[];
  unverifiedProducts: Product[];
  productCount: number;
  ai: { available: boolean; reason?: string; spentCents: number; budgetCents: number; calls: number };
  cache: { entries: number };
}

type Tab = "corrections" | "products" | "budget";

export function AdminClient() {
  const [data, setData] = useState<Overview | null>(null);
  const [tab, setTab] = useState<Tab>("corrections");
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = async () => {
    const res = await fetch("/api/admin/overview");
    if (res.ok) setData(await res.json());
  };

  useEffect(() => {
    reload();
  }, []);

  if (!data) return <div className="spinner mt32" />;

  const decide = async (id: string, action: "accept" | "reject", value?: string) => {
    setBusyId(id);
    await fetch(`/api/admin/corrections/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, value }),
    }).catch(() => {});
    setBusyId(null);
    reload();
  };

  const verify = async (barcode: string) => {
    setBusyId(barcode);
    await fetch(`/api/admin/products/${barcode}/verify`, { method: "POST" }).catch(() => {});
    setBusyId(null);
    reload();
  };

  const euro = (cents: number) => (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

  return (
    <div>
      <div className="admin-tabs">
        <button className={`chip${tab === "corrections" ? " on" : ""}`} onClick={() => setTab("corrections")}>
          Korrekturen ({data.pendingCorrections.length})
        </button>
        <button className={`chip${tab === "products" ? " on" : ""}`} onClick={() => setTab("products")}>
          Produkte ({data.unverifiedProducts.length})
        </button>
        <button className={`chip${tab === "budget" ? " on" : ""}`} onClick={() => setTab("budget")}>
          KI-Budget
        </button>
      </div>

      {tab === "corrections" && (
        <div>
          {data.pendingCorrections.length === 0 && (
            <div className="empty"><span className="ico">✅</span><p className="body-m t2">Keine offenen Korrekturen. Alles sauber.</p></div>
          )}
          {data.pendingCorrections.map((c) => {
            const verdict = typeof c.ai_verdict === "string" ? (JSON.parse(c.ai_verdict) as CorrectionVerdict) : c.ai_verdict;
            return (
              <div key={c.id} className="card mb12" style={{ padding: 16 }}>
                <div className="row between mb8">
                  <b style={{ fontSize: 14 }}>{c.product_name ?? c.barcode}</b>
                  <span className="badge badge-med">{c.field}</span>
                </div>
                <p className="body-m t2 mb8">„{c.message}“</p>
                {verdict && (
                  <p className="micro mb8">KI-Einschätzung: {verdict.reason}{verdict.suggestedValue ? ` → Vorschlag: „${verdict.suggestedValue}“` : ""}</p>
                )}
                <div className="row gap8">
                  <button
                    className="btn btn-primary btn-sm grow"
                    disabled={busyId === c.id}
                    onClick={() => decide(c.id, "accept", verdict?.suggestedValue)}
                  >
                    Übernehmen
                  </button>
                  <button
                    className="btn btn-danger btn-sm grow"
                    disabled={busyId === c.id}
                    onClick={() => decide(c.id, "reject")}
                  >
                    Ablehnen
                  </button>
                </div>
              </div>
            );
          })}

          <span className="label mb12 mt24" style={{ display: "block" }}>Zuletzt entschieden</span>
          {data.recentCorrections
            .filter((c) => c.status === "accepted" || c.status === "rejected")
            .slice(0, 10)
            .map((c) => (
              <div key={c.id} className="src">
                {c.status === "accepted" ? "✅" : "✕"}{" "}
                <span className="grow">
                  {c.product_name ?? c.barcode} · {c.field} · {c.resolution_note}
                </span>
              </div>
            ))}
        </div>
      )}

      {tab === "products" && (
        <div>
          {data.unverifiedProducts.length === 0 && (
            <div className="empty"><span className="ico">📦</span><p className="body-m t2">Keine unverifizierten Community-Produkte.</p></div>
          )}
          {data.unverifiedProducts.map((p) => (
            <div key={p.barcode} className="card mb12" style={{ padding: 16 }}>
              <div className="row between mb8">
                <Link href={`/product/${p.barcode}`}>
                  <b style={{ fontSize: 14 }}>{p.name}</b>
                </Link>
                <span className="tnum micro">{p.barcode}</span>
              </div>
              <p className="micro mb8">
                {p.brand || "ohne Marke"} · Score {p.scores.total} · {p.ingredientsText ? "mit Zutaten" : "ohne Zutaten"}
              </p>
              <button
                className="btn btn-primary btn-sm"
                disabled={busyId === p.barcode}
                onClick={() => verify(p.barcode)}
              >
                ✓ Verifizieren
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "budget" && (
        <div>
          <div className="stats mb16">
            <div className="st"><b className="tnum">{euro(data.ai.spentCents)}</b><span>diesen Monat</span></div>
            <div className="st"><b className="tnum">{data.ai.calls}</b><span>KI-Calls</span></div>
            <div className="st"><b className="tnum">{data.cache.entries}</b><span>Cache-Treffer möglich</span></div>
          </div>
          <div className="card mb16" style={{ padding: 16 }}>
            <div className="row between mb8">
              <span className="body-m t2">Budget</span>
              <b className="tnum">{euro(data.ai.spentCents)} / {euro(data.ai.budgetCents)}</b>
            </div>
            <div className="bd-bar">
              <i
                style={{
                  width: `${Math.min(100, (data.ai.spentCents / data.ai.budgetCents) * 100)}%`,
                  background: data.ai.spentCents / data.ai.budgetCents > 0.8 ? "var(--bad)" : "var(--accent)",
                }}
              />
            </div>
            <p className="micro mt8">
              {data.ai.available
                ? "KI aktiv. Bei Erreichen des Limits degradieren Community-Features automatisch in den manuellen Modus."
                : data.ai.reason === "no-key"
                  ? "Kein MISTRAL_API_KEY gesetzt. KI-Features laufen im manuellen Modus."
                  : "Budget erreicht. KI pausiert bis zum Monatswechsel."}
            </p>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="row between">
              <span className="body-m t2">Produkte in der Datenbank</span>
              <b className="tnum">{data.productCount}</b>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
