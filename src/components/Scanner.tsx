"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";

// ============================================================
// Barcode-Scanner: echte Kamera via @zxing/browser (EAN-8/13).
// Fallbacks: manuelle Eingabe + Demo-Produkte (Desktop ohne Kamera).
// ============================================================

type Mode = "idle" | "starting" | "active" | "denied";

const DEMO = [
  { barcode: "4012345678901", label: "🥣 Bio Haferflocken" },
  { barcode: "4012345678932", label: "🍫 Vollmilch-Schokolade" },
  { barcode: "4012345678956", label: "🥤 Cola Classic" },
];

export function Scanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const doneRef = useRef(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [manual, setManual] = useState("");
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  const goTo = (barcode: string) => {
    if (doneRef.current) return;
    doneRef.current = true;
    controlsRef.current?.stop();
    setFlash(true);
    setTimeout(() => router.push(`/product/${barcode}?scan=1`), 260);
  };

  const startCamera = async () => {
    setMode("starting");
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      doneRef.current = false;
      // undefined = Standardkamera (mobil: Rückkamera bevorzugt)
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current ?? undefined,
        (result) => {
          if (!result) return;
          const text = result.getText();
          if (/^\d{8,14}$/.test(text)) goTo(text);
        }
      );
      controlsRef.current = controls;
      setMode("active");
    } catch {
      setMode("denied");
    }
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manual.replace(/\s/g, "");
    if (/^\d{6,14}$/.test(code)) goTo(code);
  };

  return (
    <div>
      <div className="viewfinder" onClick={mode === "idle" ? startCamera : undefined}>
        <div className="vf-corner tl" />
        <div className="vf-corner tr" />
        <div className="vf-corner bl" />
        <div className="vf-corner br" />
        <video ref={videoRef} muted playsInline style={{ display: mode === "active" ? "block" : "none" }} />
        {mode === "active" && <div className="scan-line" />}

        {mode === "idle" && (
          <div className="center" style={{ zIndex: 2, padding: 24 }}>
            <div className="fake-barcode" style={{ margin: "0 auto 18px", justifyContent: "center" }}>
              {[60, 95, 40, 80, 55, 100, 35, 70, 90, 50, 85, 45].map((h, i) => (
                <i key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
            <button className="btn btn-primary btn-sm" style={{ width: "auto", padding: "0 26px", margin: "0 auto" }}>
              Kamera starten
            </button>
            <p className="micro mt12">Halte die Kamera auf einen Barcode</p>
          </div>
        )}
        {mode === "starting" && <div className="spinner" style={{ zIndex: 2 }} />}
        {mode === "denied" && (
          <div className="center" style={{ zIndex: 2, padding: 24 }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>📷</p>
            <p className="body-m t2">
              Kein Kamerazugriff. Erlaube den Zugriff in den Browser-Einstellungen
              oder gib den Barcode unten manuell ein.
            </p>
          </div>
        )}
        {flash && (
          <div
            style={{
              position: "absolute", inset: 0, background: "var(--accent)",
              opacity: 0.55, zIndex: 3, animation: "fadeIn 0.2s",
            }}
          />
        )}
      </div>

      <form onSubmit={submitManual} className="row gap8 mt16">
        <input
          className="input grow"
          inputMode="numeric"
          placeholder="Barcode eingeben, z. B. 4012345678901"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
        />
        <button className="btn btn-subtle btn-sm" style={{ width: 64 }} type="submit" aria-label="Suchen">
          →
        </button>
      </form>

      <div className="row gap8 mt16" style={{ flexWrap: "wrap" }}>
        <span className="micro" style={{ width: "100%" }}>Zum Ausprobieren:</span>
        {DEMO.map((d) => (
          <button key={d.barcode} className="chip" onClick={() => goTo(d.barcode)}>
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
