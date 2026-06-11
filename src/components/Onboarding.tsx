"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Erstbesuch: 3 kurze Slides. Danach nie wieder (localStorage).

const KEY = "tl_onboarded";

export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setVisible(true);
    } catch {
      /* private mode */
    }
  }, []);

  const finish = () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* egal */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="onb-veil">
      <div className="onb">
        <div className="glow-blob pulse" />
        <div className="row between" style={{ zIndex: 1 }}>
          <div className="logo-mark">
            <div className="lm-ico" style={{ width: 34, height: 34 }}>
              <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                <path d="M8 20l8 8 16-16" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="logo-word" style={{ fontSize: 19 }}>
              True<b>Label</b>
            </span>
          </div>
          <button className="link" onClick={finish}>
            Überspringen
          </button>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", zIndex: 1 }}>
          {slide === 0 && (
            <div>
              <p style={{ fontSize: 52, marginBottom: 18 }}>📷</p>
              <h1 className="h-xl mb12">
                Scan. Versteh.
                <br />
                Entscheid.
              </h1>
              <p className="body-l t2">
                Scanne jeden Barcode und sieh sofort, wie gesund, nachhaltig und
                fair ein Produkt wirklich ist.
              </p>
            </div>
          )}
          {slide === 1 && (
            <div>
              <p style={{ fontSize: 52, marginBottom: 18 }}>🎯</p>
              <h1 className="h-xl mb12">Drei Scores. Ein Bild.</h1>
              <div className="card" style={{ padding: "4px 18px", marginTop: 8 }}>
                <div className="row gap12" style={{ padding: "13px 0", borderBottom: "1px solid var(--border)" }}>
                  <i style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--good)", flexShrink: 0 }} />
                  <div>
                    <b style={{ fontSize: 14 }}>🫀 Gesundheit</b>
                    <div className="micro">Nutri-Score, Zusatzstoffe, Zucker & Salz</div>
                  </div>
                </div>
                <div className="row gap12" style={{ padding: "13px 0", borderBottom: "1px solid var(--border)" }}>
                  <i style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--good)", flexShrink: 0 }} />
                  <div>
                    <b style={{ fontSize: 14 }}>🌍 Umwelt</b>
                    <div className="micro">Herkunft, Verpackung, CO₂ & Bio-Siegel</div>
                  </div>
                </div>
                <div className="row gap12" style={{ padding: "13px 0" }}>
                  <i style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--med)", flexShrink: 0 }} />
                  <div>
                    <b style={{ fontSize: 14 }}>🤝 Soziales</b>
                    <div className="micro">Fairtrade, Palmöl & Risikorohstoffe</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {slide === 2 && (
            <div>
              <p style={{ fontSize: 52, marginBottom: 18 }}>🎁</p>
              <h1 className="h-xl mb12">
                Immer kostenlos.
                <br />
                Kein Haken.
              </h1>
              <div className="card" style={{ padding: "6px 18px", marginTop: 8 }}>
                {["Unbegrenzte Scans", "Keine Werbung", "Keine versteckten Kosten", "Scannen ohne Konto"].map(
                  (t, i, arr) => (
                    <div
                      key={t}
                      className="row gap12"
                      style={{
                        padding: "15px 0",
                        borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <span style={{ color: "var(--accent)", fontSize: 18 }}>✓</span>
                      <b style={{ fontSize: 15, fontWeight: 500 }}>{t}</b>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ zIndex: 1 }}>
          <div className="dots mb20">
            {[0, 1, 2].map((i) => (
              <i key={i} className={slide === i ? "on" : ""} />
            ))}
          </div>
          {slide < 2 ? (
            <button className="btn btn-primary" onClick={() => setSlide(slide + 1)}>
              Weiter
            </button>
          ) : (
            <>
              <button className="btn btn-primary mb12" onClick={finish}>
                Los geht&apos;s — einfach scannen
              </button>
              <Link href="/register" onClick={finish}>
                <span className="btn btn-ghost">Konto erstellen</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
