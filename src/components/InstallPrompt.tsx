"use client";

import { useEffect, useState } from "react";

// Install-Sheet: erscheint im Browser (nicht in der installierten App) und bietet
// an, TrueLabel auf den Startbildschirm zu legen. Chrome/Edge/Android nutzen den
// nativen beforeinstallprompt-Event; iOS-Safari bekommt eine kurze Anleitung.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "tl_install_dismissed";
const ONBOARDED_KEY = "tl_onboarded";
const COOLDOWN_DAYS = 14;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS-Safari meldet den Standalone-Modus über ein non-standard Flag
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  );
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    let dismissedAt = 0;
    let onboarded = false;
    try {
      dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
      onboarded = !!window.localStorage.getItem(ONBOARDED_KEY);
    } catch {
      /* private mode — dann eben ohne Persistenz */
    }

    // Onboarding hat Vorrang: erst nach dem Erstbesuch zur Installation einladen.
    if (!onboarded) return;
    // „Später" respektieren: erst nach Cooldown wieder fragen.
    if (dismissedAt && Date.now() - dismissedAt < COOLDOWN_DAYS * 864e5) return;

    // iOS feuert kein beforeinstallprompt → Anleitung mit kleiner Verzögerung zeigen.
    if (isIos()) {
      setIos(true);
      const t = setTimeout(() => setOpen(true), 1400);
      return () => clearTimeout(t);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setOpen(true);
    };
    const onInstalled = () => {
      setOpen(false);
      setDeferred(null);
      remember();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function remember() {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* egal */
    }
  }

  const dismiss = () => {
    setOpen(false);
    remember();
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setOpen(false);
    remember();
  };

  if (!open) return null;

  return (
    <>
      <div className="sheet-veil" onClick={dismiss} />
      <div
        className="sheet install-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="TrueLabel installieren"
      >
        <div className="sheet-grip" />
        <button className="install-x" onClick={dismiss} aria-label="Schließen">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2.2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        <div className="install-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192.png"
            alt=""
            width={60}
            height={60}
            className="install-icon"
          />
          <div>
            <h2 className="h-m">App installieren</h2>
            <p className="t2 install-sub">
              Leg TrueLabel auf deinen Startbildschirm. Sofort startklar, ohne
              Browser-Leiste.
            </p>
          </div>
        </div>

        <ul className="install-perks">
          <li>
            <span className="ip-ico" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
                <path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13l0-8z" strokeLinejoin="round" />
              </svg>
            </span>
            Öffnet blitzschnell wie eine echte App
          </li>
          <li>
            <span className="ip-ico" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
                <path d="M2 8.5C5 5.5 9 4 12 4s7 1.5 10 4.5" strokeLinecap="round" />
                <path d="M5.5 12.5C7.5 10.5 9.8 9.6 12 9.6s4.5.9 6.5 2.9" strokeLinecap="round" />
                <path d="M9 16.5c1-1 2-1.4 3-1.4s2 .4 3 1.4" strokeLinecap="round" />
                <circle cx="12" cy="20" r="0.6" fill="currentColor" stroke="none" />
              </svg>
            </span>
            Scannen funktioniert auch offline
          </li>
          <li>
            <span className="ip-ico" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <path d="M3 9h18" strokeLinecap="round" />
              </svg>
            </span>
            Vollbild ohne Adressleiste
          </li>
        </ul>

        {ios ? (
          <div className="install-ios">
            Tippe unten auf{" "}
            <span className="ip-share" aria-hidden>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="1.9">
                <path d="M12 3v12M12 3L8 7M12 3l4 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 12v6a2 2 0 002 2h10a2 2 0 002-2v-6" strokeLinecap="round" />
              </svg>
            </span>{" "}
            <b>Teilen</b> und dann auf <b>„Zum Home-Bildschirm"</b>.
          </div>
        ) : (
          <button className="btn btn-primary install-cta" onClick={install}>
            Jetzt installieren
          </button>
        )}

        <button className="btn btn-subtle install-later" onClick={dismiss}>
          Später
        </button>
      </div>
    </>
  );
}
