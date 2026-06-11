"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addLocalScan } from "@/lib/clientHistory";
import { lookupIngredient } from "@/lib/ingredientInfo";
import { de, scoreColor, scoreWord } from "@/lib/shared";
import { CATEGORIES, SOURCES } from "@/lib/scoring/data";
import type { Factor, PersonalEntry, Product, SessionUser } from "@/lib/types";
import { MiniRing, RingLegend, ScoreRings, SingleRing } from "./ScoreRings";
import { Sheet } from "./Sheet";

type Dimension = "health" | "eco" | "social";

const DIM_META: Record<Dimension, { emoji: string; title: string }> = {
  health: { emoji: "🫀", title: "Gesundheits-Score" },
  eco: { emoji: "🌍", title: "Umwelt-Score" },
  social: { emoji: "🤝", title: "Sozial-Score" },
};

interface Alternative {
  product: Product;
  matches: PersonalEntry[];
  delta: number;
}

export function ProductView({
  product,
  personal,
  user,
  scanned,
}: {
  product: Product;
  personal: PersonalEntry[];
  user: SessionUser | null;
  scanned: boolean;
}) {
  const router = useRouter();
  const [sheet, setSheet] = useState<Dimension | null>(null);
  const [ingredient, setIngredient] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<Alternative[] | null>(null);
  const [altMode, setAltMode] = useState<string>("better-score");
  const [inList, setInList] = useState(false);
  const premium = user?.premium ?? false;
  const cat = CATEGORIES[product.category] ?? CATEGORIES.other;

  // Verlauf: lokal immer, serverseitig nur nach echtem Scan + Login
  useEffect(() => {
    addLocalScan({
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      total: product.scores.total,
      category: product.category,
    });
    if (scanned && user) {
      fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: product.barcode }),
      }).catch(() => {});
    }
  }, [product, scanned, user]);

  // Intelligente Alternativen (Premium)
  useEffect(() => {
    if (!premium) return;
    fetch(`/api/alternatives/${product.barcode}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json) {
          setAlternatives(json.alternatives);
          setAltMode(json.mode);
        }
      })
      .catch(() => {});
  }, [premium, product.barcode]);

  const addToList = async () => {
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode: product.barcode }),
    });
    if (res.status === 402 || res.status === 401) {
      router.push(res.status === 401 ? "/login" : "/premium");
      return;
    }
    if (res.ok) setInList(true);
  };

  const conflicts = personal.filter((p) => p.level === "conflict");
  const notes = personal.filter((p) => p.level === "note");
  const matches = personal.filter((p) => p.level === "match");

  const dims: { key: Dimension; emoji: string; label: string }[] = [
    { key: "health", emoji: "🫀", label: "Gesundheit" },
    { key: "eco", emoji: "🌍", label: "Umwelt" },
    { key: "social", emoji: "🤝", label: "Soziales" },
  ];

  return (
    <div>
      {/* Kopf */}
      <div className="row gap16 mb20">
        <div className="prod-thumb">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt="" />
          ) : (
            cat.emoji
          )}
        </div>
        <div className="grow">
          <h1 className="h-m" style={{ lineHeight: 1.2 }}>{product.name}</h1>
          <p className="body-m t2">
            {[product.brand, product.quantity].filter(Boolean).join(" · ") || cat.label}
          </p>
          <p className="micro tnum" style={{ marginTop: 3 }}>
            EAN {product.barcode}
            {product.source === "community" && !product.verified && " · Community (in Prüfung)"}
            {product.verified && " · ✓ verifiziert"}
          </p>
        </div>
      </div>

      {/* Signatur-Ringe */}
      <ScoreRings scores={product.scores} />
      <RingLegend scores={product.scores} />
      <p className="center micro mt8 mb20">{scoreWord(product.scores.total)}</p>

      {/* Persönliche Hinweise */}
      {conflicts.length > 0 && (
        <div className="banner banner-bad mb12">
          {conflicts.map((c) => (
            <div key={c.pref}>⛔ <strong>{c.label}.</strong> {c.detail}</div>
          ))}
        </div>
      )}
      {notes.length > 0 && (
        <div className="banner banner-warn mb12">
          {notes.map((n) => (
            <div key={n.pref}>⚠️ <strong>{n.label}.</strong> {n.detail}</div>
          ))}
        </div>
      )}
      {matches.length > 0 && (
        <div className="row gap8 mb16" style={{ flexWrap: "wrap" }}>
          {matches.map((m) => (
            <span key={m.pref} className="badge badge-good">✓ {m.label}</span>
          ))}
        </div>
      )}

      {/* Score-Karten */}
      {dims.map(({ key, emoji, label }) => {
        const s = product.scores[key].score;
        return (
          <button key={key} className="score-card" onClick={() => setSheet(key)}>
            <div className="score-emoji">{emoji}</div>
            <div className="grow">
              <div className="row between">
                <b style={{ fontSize: 14 }}>{label}</b>
                <div>
                  <span className="sc-val" style={{ color: scoreColor(s) }}>{s}</span>
                  <span className="sc-100">/100 · {scoreWord(s)}</span>
                </div>
              </div>
              <div className="score-bar">
                <i style={{ width: `${s}%`, background: scoreColor(s) }} />
              </div>
            </div>
            <span className="chev">›</span>
          </button>
        );
      })}

      {/* Aktionen */}
      <div className="row gap8 mt16">
        <Link href={`/compare?a=${product.barcode}`} className="grow">
          <span className="btn btn-subtle btn-sm">⚖️ Vergleichen {!premium && "👑"}</span>
        </Link>
        <button className="btn btn-subtle btn-sm grow" onClick={addToList} disabled={inList}>
          {inList ? "✓ Auf der Liste" : <>🛒 Zur Liste {!premium && "👑"}</>}
        </button>
      </div>

      <hr className="divider" />

      {/* Intelligente Alternativen */}
      <div className="alt-head">
        <span className="label">Bessere Alternativen</span>
        {!premium && <span className="badge badge-gold">👑 Premium</span>}
      </div>
      {premium ? (
        alternatives == null ? (
          <p className="micro mb12">Alternativen werden geladen …</p>
        ) : alternatives.length === 0 ? (
          <p className="body-m t2 mb12">
            Stark — in dieser Kategorie kennen wir aktuell nichts Besseres, das zu deinem Profil passt.
          </p>
        ) : (
          <>
            {altMode === "conflict-free" && (
              <p className="micro mb12">Dieses Produkt passt nicht zu deinem Profil — diese hier schon:</p>
            )}
            {alternatives.map((alt) => (
              <button
                key={alt.product.barcode}
                className="plist"
                onClick={() => router.push(`/product/${alt.product.barcode}`)}
              >
                <div className="pthumb">{(CATEGORIES[alt.product.category] ?? CATEGORIES.other).emoji}</div>
                <div className="grow">
                  <b style={{ fontSize: 15 }}>{alt.product.name}</b>
                  <div className="micro">
                    {alt.product.brand}
                    {alt.delta > 0 && <span className="delta-up"> · +{alt.delta} Punkte</span>}
                  </div>
                </div>
                <MiniRing score={alt.product.scores.total} />
              </button>
            ))}
          </>
        )
      ) : (
        <div className="locked">
          <div className="plist" style={{ marginBottom: 0 }}>
            <div className="pthumb">🥇</div>
            <div className="grow">
              <b style={{ fontSize: 15 }}>Passendere Produkte entdecken</b>
              <div className="micro">Bessere Scores, abgestimmt auf dein Ernährungsprofil</div>
            </div>
          </div>
          <Link href="/premium" className="lock-veil">
            <span style={{ fontSize: 20 }}>🔒</span>
            <span className="lk">👑 Mit Premium freischalten</span>
          </Link>
        </div>
      )}

      <hr className="divider" />

      {/* Zutaten */}
      <div className="row between mb12">
        <span className="label">Zutaten</span>
        <span className="micro">{product.ingredients.length || "—"}</span>
      </div>
      {product.ingredients.length > 0 ? (
        product.ingredients.slice(0, 10).map((ing, i) => (
          <button key={i} className="ingredient" onClick={() => setIngredient(ing.name)}>
            <span style={{ fontWeight: 500 }}>{ing.name}</span>
            <span className="row gap8">
              {ing.percent != null && <span className="micro tnum">{ing.percent} %</span>}
              <span className="chev">›</span>
            </span>
          </button>
        ))
      ) : product.ingredientsText ? (
        <p className="body-m t2">{product.ingredientsText}</p>
      ) : (
        <p className="body-m t3">Keine Zutatenliste hinterlegt. Hilf mit einer Korrektur!</p>
      )}
      {product.allergens.length > 0 && (
        <div className="banner banner-warn mt12">
          ⚠️ Allergene: {product.allergens.map(allergenLabel).join(", ")}
        </div>
      )}

      <hr className="divider" />

      {/* Nährwerte */}
      <div className="row between mb12">
        <span className="label">Nährwerte</span>
        <span className="micro">je 100 g/ml</span>
      </div>
      <div className="nutri-table">
        <div className="nr"><span className="t2">Energie</span><b>{de(product.nutriments.energyKcal, 0)} kcal</b></div>
        <div className="nr"><span className="t2">Fett</span><b>{de(product.nutriments.fat)} g</b></div>
        <div className="nr"><span className="t2">davon gesättigt</span><b>{de(product.nutriments.satFat)} g</b></div>
        <div className="nr"><span className="t2">Kohlenhydrate</span><b>{de(product.nutriments.carbs)} g</b></div>
        <div className="nr"><span className="t2">davon Zucker</span><b>{de(product.nutriments.sugars)} g</b></div>
        <div className="nr"><span className="t2">Protein</span><b>{de(product.nutriments.protein)} g</b></div>
        <div className="nr"><span className="t2">Salz</span><b>{de(product.nutriments.salt, 2)} g</b></div>
      </div>

      <Link href={`/correct/${product.barcode}`}>
        <span className="btn btn-ghost btn-sm mt20">✎ Korrektur einreichen</span>
      </Link>

      <p className="disclaimer center mt16">
        Scores werden algorithmisch von TrueLabel berechnet und ersetzen keine medizinische
        oder behördliche Auskunft. Keine Gewähr für die Richtigkeit der Daten.
      </p>

      {/* Score-Detail-Sheet */}
      {sheet && (
        <Sheet onClose={() => setSheet(null)}>
          <ScoreDetail
            dimension={sheet}
            score={product.scores[sheet].score}
            factors={product.scores[sheet].factors}
            premium={premium}
          />
        </Sheet>
      )}

      {/* Zutaten-Sheet */}
      {ingredient && (
        <Sheet onClose={() => setIngredient(null)}>
          <IngredientDetail name={ingredient} />
        </Sheet>
      )}
    </div>
  );
}

function allergenLabel(key: string): string {
  const map: Record<string, string> = {
    gluten: "Gluten", milk: "Milch", nuts: "Schalenfrüchte", peanuts: "Erdnüsse",
    soybeans: "Soja", eggs: "Eier", fish: "Fisch", crustaceans: "Krebstiere",
    celery: "Sellerie", mustard: "Senf", sesame: "Sesam", sulphites: "Sulfite",
    lupin: "Lupinen", molluscs: "Weichtiere",
  };
  return map[key] ?? key;
}

function ScoreDetail({
  dimension,
  score,
  factors,
  premium,
}: {
  dimension: Dimension;
  score: number;
  factors: Factor[];
  premium: boolean;
}) {
  const meta = DIM_META[dimension];
  return (
    <div>
      <h2 className="h-m center mb16">{meta.emoji} {meta.title}</h2>
      <div className="center mb20">
        <SingleRing score={score} />
        <span
          className={`badge badge-${score >= 70 ? "good" : score >= 40 ? "med" : "bad"}`}
          style={{ marginTop: 10 }}
        >
          {scoreWord(score)}
        </span>
      </div>

      <span className="label mb12" style={{ display: "block" }}>Bewertung im Detail</span>
      <div className="card" style={{ padding: "2px 16px", background: "var(--surface)" }}>
        {factors.map((f) => (
          <div className="bd-row" key={f.id}>
            <div className="bd-head">
              <span className="bd-label">{f.label}</span>
              <span className={`bd-val st-${f.status}`}>
                {f.value}
                {f.points !== 0 && (
                  <span className="micro" style={{ marginLeft: 6 }}>
                    ({f.points > 0 ? "+" : ""}{f.points})
                  </span>
                )}
              </span>
            </div>
            <div className="bd-bar">
              <i
                style={{
                  width: `${f.pct}%`,
                  background:
                    f.status === "good" ? "var(--good)" :
                    f.status === "medium" ? "var(--med)" :
                    f.status === "bad" ? "var(--bad)" : "var(--border-active)",
                }}
              />
            </div>
            {f.note && <p className="micro mt8">{f.note}</p>}
          </div>
        ))}
      </div>

      <span className="label mb12 mt24" style={{ display: "block" }}>Quellen</span>
      {premium ? (
        SOURCES[dimension].map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="src">
            📄 <span className="grow">{s.title} — <span className="doc">{s.org}</span></span> ›
          </a>
        ))
      ) : (
        <div className="locked">
          {SOURCES[dimension].slice(0, 2).map((s) => (
            <div key={s.url} className="src">
              📄 <span className="grow">{s.title} — <span className="doc">{s.org}</span></span> ›
            </div>
          ))}
          <Link href="/premium" className="lock-veil">
            <span style={{ fontSize: 20 }}>🔒</span>
            <span className="lk">👑 Quellen mit Premium freischalten</span>
          </Link>
        </div>
      )}

      <p className="disclaimer mt16">
        Dieser Score wird algorithmisch von TrueLabel berechnet und ersetzt keine medizinische
        oder behördliche Auskunft.
      </p>
    </div>
  );
}

function IngredientDetail({ name }: { name: string }) {
  const info = lookupIngredient(name);
  return (
    <div>
      <div className="row between mb16">
        <div>
          <h2 className="h-l">{info.title}</h2>
          <p className="body-m t2">{info.category}</p>
        </div>
      </div>
      <p className="body-m t2 mb16">{info.text}</p>
      {(info.positives.length > 0 || info.negatives.length > 0) && (
        <div className="card mb16" style={{ padding: "6px 16px", background: "var(--surface)" }}>
          {info.positives.map((p) => (
            <div key={p} className="row gap12" style={{ padding: "11px 0" }}>
              <span className="st-good">＋</span>
              <span className="body-m">{p}</span>
            </div>
          ))}
          {info.negatives.map((n) => (
            <div key={n} className="row gap12" style={{ padding: "11px 0" }}>
              <span className="st-medium">－</span>
              <span className="body-m">{n}</span>
            </div>
          ))}
        </div>
      )}
      {info.allergen && (
        <div className="banner banner-warn">⚠️ Bekanntes Allergen: {info.allergen}</div>
      )}
    </div>
  );
}
