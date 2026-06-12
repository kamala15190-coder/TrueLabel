"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";

// ============================================================
// Barcode-Scanner — das Herzstück.
//
// Strategie für maximale Trefferquote auf echten Handys:
//  1. Kamera SELBST öffnen mit facingMode "environment" → erzwingt die
//     RÜCKKAMERA (der häufigste Grund, warum gar nichts scannte: vorher
//     lief die Frontkamera). Dazu hohe Auflösung + Autofokus.
//  2. Native BarcodeDetector-API verwenden, wenn vorhanden (Android/Chrome):
//     hardware-nah, extrem schnell & zuverlässig.
//  3. Fallback @zxing/browser auf DEMSELBEN Stream (iOS/Safari) — beschränkt
//     auf EAN/UPC-Formate + TRY_HARDER + schnelle Scan-Intervalle.
//  4. Taschenlampe (Torch) für schlechtes Licht, manuelle Eingabe, Demo.
// ============================================================

type Mode = "idle" | "starting" | "active" | "denied" | "insecure" | "nocam";

// EAN-8/UPC-E(expandiert)/UPC-A/EAN-13/GTIN-14 → 8–14 Ziffern bei Kamera-Scans.
const VALID = /^\d{8,14}$/;

const SCAN_FORMATS: BarcodeFormatName[] = [
  "ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39",
];

const DEMO = [
  { barcode: "4012345678901", label: "🥣 Bio Haferflocken" },
  { barcode: "4012345678932", label: "🍫 Vollmilch-Schokolade" },
  { barcode: "4012345678956", label: "🥤 Cola Classic" },
];

export function Scanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const zxingRef = useRef<IScannerControls | null>(null);
  const doneRef = useRef(false);

  const [mode, setMode] = useState<Mode>("idle");
  const [manual, setManual] = useState("");
  const [flash, setFlash] = useState(false);
  const [canTorch, setCanTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const stopAll = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    zxingRef.current?.stop();
    zxingRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const v = videoRef.current;
    if (v) v.srcObject = null;
  }, []);

  // Kamera sauber freigeben, wenn die Komponente verschwindet (LED aus!).
  useEffect(() => stopAll, [stopAll]);

  const goTo = useCallback(
    (barcode: string) => {
      if (doneRef.current) return;
      doneRef.current = true;
      navigator.vibrate?.(60);
      stopAll();
      setFlash(true);
      setTimeout(() => router.push(`/product/${barcode}?scan=1`), 240);
    },
    [router, stopAll]
  );

  // --- ZXing-Fallback (iOS/Safari oder wenn BarcodeDetector versagt) ---
  const runZxing = useCallback(
    async (stream: MediaStream) => {
      const video = videoRef.current;
      if (!video) return;
      try {
        const [{ BrowserMultiFormatReader }, { DecodeHintType, BarcodeFormat }] =
          await Promise.all([import("@zxing/browser"), import("@zxing/library")]);

        const hints = new Map<number, unknown>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 120,
        });
        zxingRef.current = await reader.decodeFromStream(
          stream,
          video,
          (result) => {
            if (!result || doneRef.current) return;
            const code = result.getText().replace(/\D/g, "");
            if (VALID.test(code)) goTo(code);
          }
        );
      } catch {
        setMode("denied");
      }
    },
    [goTo]
  );

  // --- Nativer Pfad (BarcodeDetector) mit nahtlosem ZXing-Fallback ---
  const runNative = useCallback(
    (stream: MediaStream) => {
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.play().catch(() => {});

      let detector: BarcodeDetector;
      try {
        detector = new BarcodeDetector({ formats: SCAN_FORMATS });
      } catch {
        runZxing(stream);
        return;
      }

      let okOnce = false;
      const tick = async () => {
        if (doneRef.current) return;
        // Auf erste echte Frames warten, bevor wir dekodieren.
        if (video.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        try {
          const codes = await detector.detect(video);
          okOnce = true;
          for (const c of codes) {
            const code = c.rawValue.replace(/\D/g, "");
            if (VALID.test(code)) {
              goTo(code);
              return;
            }
          }
        } catch {
          // Bricht die native Engine sofort ab → auf ZXing umschalten.
          if (!okOnce) {
            runZxing(stream);
            return;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [goTo, runZxing]
  );

  const startCamera = useCallback(async () => {
    setMode("starting");
    doneRef.current = false;

    // Kamera braucht einen sicheren Kontext (HTTPS oder localhost).
    if (
      typeof window === "undefined" ||
      !window.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setMode("insecure");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }, // Rückkamera bevorzugen
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
    } catch (e) {
      const name = (e as DOMException)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") setMode("denied");
      else if (name === "NotFoundError" || name === "OverconstrainedError") setMode("nocam");
      else setMode("denied");
      return;
    }
    streamRef.current = stream;

    // Optionale Optimierungen: Taschenlampe erkennen, Autofokus aktivieren.
    const track = stream.getVideoTracks()[0];
    try {
      const caps = track?.getCapabilities?.();
      if (caps?.torch) setCanTorch(true);
      if (caps?.focusMode?.includes("continuous")) {
        await track.applyConstraints({ advanced: [{ focusMode: "continuous" }] });
      }
    } catch {
      /* nicht kritisch */
    }

    setMode("active");

    // Native Engine bevorzugen, wenn sie EAN-13 wirklich kann.
    let useNative = false;
    if ("BarcodeDetector" in window) {
      try {
        const supported = await BarcodeDetector.getSupportedFormats();
        useNative = supported.includes("ean_13");
      } catch {
        useNative = false;
      }
    }

    if (useNative) runNative(stream);
    else runZxing(stream);
  }, [runNative, runZxing]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((v) => !v);
    } catch {
      /* Gerät unterstützt Torch doch nicht */
    }
  }, [torchOn]);

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manual.replace(/\D/g, "");
    if (/^\d{6,14}$/.test(code)) goTo(code);
  };

  const isError = mode === "denied" || mode === "insecure" || mode === "nocam";

  return (
    <div>
      <div
        className="viewfinder"
        onClick={mode === "idle" ? startCamera : undefined}
        style={{ cursor: mode === "idle" ? "pointer" : "default" }}
      >
        <div className="vf-corner tl" />
        <div className="vf-corner tr" />
        <div className="vf-corner bl" />
        <div className="vf-corner br" />
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          style={{ display: mode === "active" ? "block" : "none" }}
        />
        {mode === "active" && <div className="scan-line" />}

        {mode === "active" && canTorch && (
          <button
            type="button"
            onClick={toggleTorch}
            aria-label="Taschenlampe"
            aria-pressed={torchOn}
            style={{
              position: "absolute", top: 16, right: 16, zIndex: 4,
              width: 44, height: 44, borderRadius: "50%", border: "none",
              background: torchOn ? "var(--leaf-bright, #2cba63)" : "rgba(0,0,0,.45)",
              color: "#fff", fontSize: 20, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(6px)",
            }}
          >
            {torchOn ? "🔦" : "💡"}
          </button>
        )}

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
            <p className="micro mt12">Halte die Rückkamera auf einen Barcode</p>
          </div>
        )}
        {mode === "starting" && <div className="spinner" style={{ zIndex: 2 }} />}

        {isError && (
          <div className="center" style={{ zIndex: 2, padding: 24 }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>📷</p>
            <p className="body-m t2" style={{ maxWidth: 280 }}>
              {mode === "denied" &&
                "Kein Kamerazugriff. Erlaube die Kamera in den Browser-Einstellungen und versuche es erneut – oder gib den Barcode unten manuell ein."}
              {mode === "insecure" &&
                "Die Kamera funktioniert nur über eine sichere Verbindung (https). Öffne die App über https:// – oder gib den Barcode unten manuell ein."}
              {mode === "nocam" &&
                "Keine passende Kamera gefunden. Gib den Barcode unten einfach manuell ein."}
            </p>
            {mode !== "insecure" && (
              <button
                className="btn btn-subtle btn-sm"
                style={{ width: "auto", padding: "0 22px", margin: "14px auto 0" }}
                onClick={startCamera}
              >
                Erneut versuchen
              </button>
            )}
          </div>
        )}

        {flash && (
          <div
            style={{
              position: "absolute", inset: 0, background: "var(--accent)",
              opacity: 0.55, zIndex: 5, animation: "fadeIn 0.2s",
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
