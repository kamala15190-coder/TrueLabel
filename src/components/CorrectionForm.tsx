"use client";

import Link from "next/link";
import { useState } from "react";

const FIELDS: [string, string][] = [
  ["name", "Produktname"],
  ["brand", "Marke"],
  ["quantity", "Menge / Gewicht"],
  ["ingredientsText", "Zutatenliste"],
  ["nutriments", "Nährwerte"],
  ["score", "Score / Bewertung"],
  ["other", "Sonstiges"],
];

type Result = { status: "accepted" | "rejected" | "manual"; reason: string; points?: number };

export function CorrectionForm({
  barcode,
  productName,
}: {
  barcode: string;
  productName: string;
}) {
  const [field, setField] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!field) {
      setError("Bitte wähle aus, was du korrigieren möchtest.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode, field, message }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Etwas ist schiefgelaufen.");
        return;
      }
      setResult(json);
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    const meta =
      result.status === "accepted"
        ? { icon: "✅", title: "Korrektur übernommen!", cls: "banner-good" }
        : result.status === "rejected"
          ? { icon: "✕", title: "Korrektur abgelehnt", cls: "banner-bad" }
          : { icon: "✉️", title: "Danke für deinen Beitrag!", cls: "banner-info" };
    return (
      <div className="empty" style={{ paddingTop: 60 }}>
        <div
          style={{
            width: 88, height: 88, borderRadius: "50%", background: "var(--accent-soft)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 42 }}>{meta.icon}</span>
        </div>
        <h1 className="h-l">{meta.title}</h1>
        <div className={`banner ${meta.cls}`} style={{ textAlign: "left" }}>
          {result.status === "accepted" && "Unsere KI hat deine Korrektur geprüft und direkt übernommen. "}
          {result.status === "manual" && "Unsere KI hat deine Korrektur vorgeprüft — ein Mensch schaut sie sich nun an. Du erhältst Punkte, sobald sie übernommen wurde. "}
          {result.reason}
        </div>
        {result.points ? (
          <span className="badge badge-gold" style={{ fontSize: 14, padding: "9px 16px" }}>
            ★ +{result.points} Punkte
          </span>
        ) : null}
        <Link href={`/product/${barcode}`} style={{ width: "100%" }}>
          <span className="btn btn-primary">Zurück zum Produkt</span>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="card mb20" style={{ padding: "14px 16px" }}>
        <span className="label" style={{ fontSize: 10 }}>Produkt</span>
        <p className="body-m" style={{ marginTop: 4, fontWeight: 500 }}>{productName}</p>
      </div>

      <div className="field">
        <label>Was möchtest du korrigieren?</label>
        <select className="select" value={field} onChange={(e) => setField(e.target.value)}>
          <option value="">Bitte auswählen</option>
          {FIELDS.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Deine Korrektur</label>
        <textarea
          className="input"
          rows={5}
          maxLength={500}
          required
          minLength={10}
          placeholder="Beschreibe präzise, was nicht stimmt — z. B. „Der Zuckergehalt ist 14 g, nicht 22 g (steht auf der Packung)“"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <p className="micro" style={{ textAlign: "right", marginTop: 6 }}>{message.length}/500</p>
      </div>

      {error && <div className="banner banner-bad mb12">{error}</div>}

      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "KI prüft deine Korrektur …" : "Einreichen"}
      </button>
      <p className="micro center mt12">
        Eindeutige Korrekturen übernimmt unsere KI sofort — alles andere prüft ein Mensch.
      </p>
    </form>
  );
}
