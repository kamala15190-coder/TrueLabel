"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CATEGORIES } from "@/lib/scoring/data";
import type { ExtractedProduct } from "@/lib/types";

// ============================================================
// Produkt beitragen, 3 Schritte:
// 1) Fotos → KI extrahiert Daten (falls verfügbar, sonst manuell)
// 2) Daten prüfen/vervollständigen
// 3) Fertig — Produkt ist sofort in der Datenbank (+50 Punkte)
// ============================================================

const PHOTO_SLOTS = [
  { key: "front", label: "Vorderseite des Produkts", icon: "📷" },
  { key: "back", label: "Rückseite (Zutaten + Nährwerte)", icon: "🧾" },
  { key: "code", label: "Barcode", icon: "▦" },
] as const;

const ALLERGEN_OPTIONS: [string, string][] = [
  ["gluten", "Gluten"], ["milk", "Milch"], ["nuts", "Schalenfrüchte"],
  ["peanuts", "Erdnüsse"], ["soybeans", "Soja"], ["eggs", "Eier"],
];

/** Foto clientseitig auf ~900px JPEG komprimieren (schont Upload & KI-Kosten). */
async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export function AddWizard({ initialBarcode }: { initialBarcode: string }) {
  const [step, setStep] = useState(1);
  const [barcode, setBarcode] = useState(initialBarcode);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [points, setPoints] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const activeSlot = useRef<string>("front");

  // Formularfelder (Schritt 2)
  const [form, setForm] = useState({
    name: "", brand: "", quantity: "", category: "other",
    ingredientsText: "", originCountry: "unknown", packaging: "none",
    organic: false, fairtrade: false,
    energyKcal: "", fat: "", satFat: "", carbs: "", sugars: "", protein: "", salt: "", fiber: "",
  });
  const [allergens, setAllergens] = useState<string[]>([]);

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const pickPhoto = (slot: string) => {
    activeSlot.current = slot;
    fileInput.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const dataUrl = await compressImage(file);
    setPhotos((p) => ({ ...p, [activeSlot.current]: dataUrl }));
  };

  const analyze = async () => {
    if (!/^\d{6,14}$/.test(barcode)) {
      setError("Bitte zuerst einen gültigen Barcode eingeben.");
      return;
    }
    setError("");
    const images = Object.values(photos);
    if (images.length === 0) {
      // ohne Fotos direkt zum manuellen Formular
      setAiNote(null);
      setStep(2);
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode, images }),
      });
      const json = await res.json().catch(() => ({}));
      const extracted: ExtractedProduct | null = json.extracted ?? null;
      if (extracted) {
        setForm((f) => ({
          ...f,
          name: extracted.name ?? f.name,
          brand: extracted.brand ?? f.brand,
          quantity: extracted.quantity ?? f.quantity,
          ingredientsText: extracted.ingredientsText ?? f.ingredientsText,
          energyKcal: extracted.nutriments?.energyKcal?.toString() ?? f.energyKcal,
          fat: extracted.nutriments?.fat?.toString() ?? f.fat,
          satFat: extracted.nutriments?.satFat?.toString() ?? f.satFat,
          carbs: extracted.nutriments?.carbs?.toString() ?? f.carbs,
          sugars: extracted.nutriments?.sugars?.toString() ?? f.sugars,
          protein: extracted.nutriments?.protein?.toString() ?? f.protein,
          salt: extracted.nutriments?.salt?.toString() ?? f.salt,
          fiber: extracted.nutriments?.fiber?.toString() ?? f.fiber,
        }));
        if (extracted.allergens?.length) setAllergens(extracted.allergens);
        setAiNote("✓ Unsere KI hat die Daten aus deinen Fotos gelesen. Bitte kurz prüfen.");
      } else {
        setAiNote("Die KI-Analyse ist gerade nicht verfügbar. Bitte trage die Daten kurz manuell ein.");
      }
      setStep(2);
    } finally {
      setAnalyzing(false);
    }
  };

  const num = (s: string) => {
    const n = parseFloat(s.replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  };

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode,
          name: form.name,
          brand: form.brand,
          quantity: form.quantity,
          category: form.category,
          ingredientsText: form.ingredientsText || undefined,
          nutriments: {
            energyKcal: num(form.energyKcal), fat: num(form.fat),
            satFat: num(form.satFat), carbs: num(form.carbs),
            sugars: num(form.sugars), protein: num(form.protein),
            salt: num(form.salt), fiber: num(form.fiber),
          },
          allergens,
          originCountry: form.originCountry,
          packaging: form.packaging,
          organic: form.organic,
          fairtrade: form.fairtrade,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Etwas ist schiefgelaufen.");
        return;
      }
      setPoints(json.pointsAwarded ?? 0);
      setStep(3);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Schritt 3: Erfolg ----------
  if (step === 3) {
    return (
      <div className="empty" style={{ paddingTop: 60 }}>
        <div
          style={{
            width: 88, height: 88, borderRadius: "50%", background: "rgba(34,197,94,.14)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 44 }}>✓</span>
        </div>
        <h1 className="h-l">Produkt erfolgreich<br />hinzugefügt!</h1>
        <p className="body-l t2" style={{ maxWidth: 300 }}>
          Das Produkt ist ab sofort für die gesamte Community in der Datenbank
          verfügbar und wird von uns verifiziert.
        </p>
        {points > 0 && (
          <span className="badge badge-gold" style={{ fontSize: 14, padding: "9px 16px" }}>
            ★ +{points} Punkte für deinen Beitrag
          </span>
        )}
        <Link href={`/product/${barcode}`} style={{ width: "100%" }}>
          <span className="btn btn-primary">Produkt ansehen</span>
        </Link>
      </div>
    );
  }

  // ---------- Schritt 1: Fotos ----------
  if (step === 1) {
    return (
      <div>
        <span className="label">Schritt 1 von 3</span>
        <div className="dots mt12 mb24" style={{ justifyContent: "flex-start" }}>
          <i className="on" /><i /><i />
        </div>
        <h1 className="h-l mb8">Produktbilder</h1>
        <p className="body-m t2 mb20">
          Mach Fotos. Unsere KI liest Name, Zutaten und Nährwerte automatisch aus.
          Du kannst die Daten auch ohne Fotos eintragen.
        </p>

        {!initialBarcode && (
          <div className="field">
            <label>Barcode (EAN)</label>
            <input
              className="input"
              inputMode="numeric"
              placeholder="z. B. 4012345678901"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
        )}
        {initialBarcode && (
          <p className="micro mb16 tnum">Barcode: {barcode}</p>
        )}

        <input ref={fileInput} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
        {PHOTO_SLOTS.map((slot) => (
          <button key={slot.key} className={`up-tile${photos[slot.key] ? " done" : ""}`} onClick={() => pickPhoto(slot.key)}>
            <div className="up-ic">
              {photos[slot.key] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photos[slot.key]} alt="" />
              ) : (
                slot.icon
              )}
            </div>
            <div className="grow">
              <b style={{ fontSize: 14, fontWeight: 500 }}>{slot.label}</b>
              <div className="micro" style={photos[slot.key] ? { color: "#4ade80" } : undefined}>
                {photos[slot.key] ? "✓ Bereit" : "Tippen zum Fotografieren"}
              </div>
            </div>
          </button>
        ))}

        {error && <div className="banner banner-bad mb12">{error}</div>}

        <button className="btn btn-primary mt12" onClick={analyze} disabled={analyzing}>
          {analyzing ? (
            <>
              <span className="spinner sm" /> KI analysiert …
            </>
          ) : Object.keys(photos).length > 0 ? (
            "Mit KI analysieren"
          ) : (
            "Ohne Fotos fortfahren"
          )}
        </button>
      </div>
    );
  }

  // ---------- Schritt 2: Details ----------
  return (
    <div>
      <span className="label">Schritt 2 von 3</span>
      <div className="dots mt12 mb24" style={{ justifyContent: "flex-start" }}>
        <i /><i className="on" /><i />
      </div>
      <h1 className="h-l mb8">Produktdetails</h1>
      {aiNote && <div className="banner banner-info mb16">{aiNote}</div>}

      <div className="field">
        <label>Produktname *</label>
        <input className="input" placeholder="z. B. Bio Haferflocken" value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div className="field">
        <label>Marke</label>
        <input className="input" placeholder="z. B. Naturkind" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
      </div>
      <div className="row gap12">
        <div className="field grow">
          <label>Menge</label>
          <input className="input" placeholder="z. B. 500 g" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
        </div>
        <div className="field grow">
          <label>Kategorie *</label>
          <select className="select" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {Object.entries(CATEGORIES).map(([key, c]) => (
              <option key={key} value={key}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Zutatenliste</label>
        <textarea
          className="input"
          rows={4}
          placeholder="Zutaten wie auf der Packung, mit Komma getrennt"
          value={form.ingredientsText}
          onChange={(e) => set("ingredientsText", e.target.value)}
        />
      </div>

      <span className="label mb12" style={{ display: "block" }}>Nährwerte je 100 g/ml</span>
      <div className="cmp-grid">
        {(
          [
            ["energyKcal", "kcal"], ["fat", "Fett (g)"], ["satFat", "ges. Fett (g)"],
            ["carbs", "Kohlenhydr. (g)"], ["sugars", "Zucker (g)"], ["protein", "Protein (g)"],
            ["salt", "Salz (g)"], ["fiber", "Ballaststoffe (g)"],
          ] as const
        ).map(([key, label]) => (
          <div className="field" key={key}>
            <label>{label}</label>
            <input
              className="input"
              inputMode="decimal"
              placeholder="–"
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <span className="label mb12" style={{ display: "block" }}>Allergene</span>
      <div className="row gap8 mb16" style={{ flexWrap: "wrap" }}>
        {ALLERGEN_OPTIONS.map(([key, label]) => (
          <button
            key={key}
            className={`chip${allergens.includes(key) ? " on" : ""}`}
            onClick={() =>
              setAllergens((a) => (a.includes(key) ? a.filter((x) => x !== key) : [...a, key]))
            }
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="row gap12">
        <div className="field grow">
          <label>Herkunft</label>
          <select className="select" value={form.originCountry} onChange={(e) => set("originCountry", e.target.value)}>
            <option value="unknown">Unbekannt</option>
            <option value="de">🇩🇪 Deutschland</option>
            <option value="at">🇦🇹 Österreich</option>
            <option value="ch">🇨🇭 Schweiz</option>
            <option value="fr">🇫🇷 Frankreich</option>
            <option value="it">🇮🇹 Italien</option>
            <option value="es">🇪🇸 Spanien</option>
            <option value="pl">🇵🇱 Polen</option>
            <option value="nl">🇳🇱 Niederlande</option>
          </select>
        </div>
        <div className="field grow">
          <label>Verpackung</label>
          <select className="select" value={form.packaging} onChange={(e) => set("packaging", e.target.value)}>
            <option value="none">Keine Angabe</option>
            <option value="cardboard">Karton/Papier</option>
            <option value="glass">Glas</option>
            <option value="plastic">Kunststoff</option>
            <option value="metal">Metall/Dose</option>
            <option value="composite">Verbund (Tetra)</option>
          </select>
        </div>
      </div>

      <button
        className={`toggle-row${form.organic ? " on" : ""}`}
        onClick={() => set("organic", !form.organic)}
        type="button"
      >
        <span className="tl">EU-Bio-Siegel vorhanden</span>
        <span className="switch" />
      </button>
      <button
        className={`toggle-row${form.fairtrade ? " on" : ""}`}
        onClick={() => set("fairtrade", !form.fairtrade)}
        type="button"
      >
        <span className="tl">Fairtrade-Siegel vorhanden</span>
        <span className="switch" />
      </button>

      {error && <div className="banner banner-bad mb12 mt12">{error}</div>}

      <button
        className="btn btn-primary mt16"
        onClick={submit}
        disabled={submitting || form.name.trim().length < 2}
      >
        {submitting ? "Wird gespeichert …" : "Produkt veröffentlichen"}
      </button>
      <button className="btn btn-ghost btn-sm mt12" onClick={() => setStep(1)}>
        ‹ Zurück zu den Fotos
      </button>
    </div>
  );
}
