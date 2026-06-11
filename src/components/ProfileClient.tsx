"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearLocalHistory } from "@/lib/clientHistory";
import { DIET_PREF_LABELS, type DietPrefs, type SessionUser } from "@/lib/types";

export function ProfileClient({
  user,
  stats,
  stripeConfigured,
}: {
  user: SessionUser;
  stats: { scans: number; contributions: number; corrections: number };
  stripeConfigured: boolean;
}) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<DietPrefs>(user.dietPrefs);
  const [saving, setSaving] = useState(false);

  const toggle = async (key: keyof DietPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => {});
    setSaving(false);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    clearLocalHistory();
    router.push("/");
    router.refresh();
  };

  const openPortal = async () => {
    const res = await fetch("/api/premium/portal", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.url) window.location.href = json.url;
  };

  const initials = (user.name || user.email)
    .split(/[\s.@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const activePrefs = Object.values(prefs).filter(Boolean).length;

  return (
    <div>
      <div className="row gap16 mb20">
        <div className="avatar">{initials}</div>
        <div className="grow">
          <div className="h-m">{user.name}</div>
          <p className="body-m t2" style={{ wordBreak: "break-all" }}>{user.email}</p>
          {user.premium && <span className="badge badge-gold mt8">👑 Premium aktiv</span>}
        </div>
      </div>

      <div className="stats mb24">
        <div className="st"><b className="tnum">{stats.scans}</b><span>Scans</span></div>
        <div className="st"><b className="tnum">{stats.contributions}</b><span>Beiträge</span></div>
        <div className="st"><b className="tnum">{user.points}</b><span>Punkte</span></div>
      </div>

      {!user.premium ? (
        <Link href="/premium">
          <span className="gold-banner mb24" style={{ display: "block" }}>
            <span className="row between" style={{ position: "relative" }}>
              <span>
                <span className="row gap8">
                  <span style={{ fontSize: 18 }}>👑</span>
                  <b style={{ fontSize: 16, color: "var(--gold)" }}>TrueLabel Premium</b>
                </span>
                <span className="body-m t2 mt8" style={{ display: "block" }}>
                  Alternativen, Vergleich, Listen & mehr
                </span>
              </span>
              <span style={{ textAlign: "right" }}>
                <b style={{ fontSize: 17 }}>2,49 €</b>
                <span className="micro" style={{ display: "block" }}>/Monat</span>
              </span>
            </span>
          </span>
        </Link>
      ) : (
        stripeConfigured && (
          <button className="btn btn-subtle btn-sm mb24" onClick={openPortal}>
            👑 Abo verwalten
          </button>
        )
      )}

      <div className="row between mb12">
        <span className="label">Ernährungsfilter</span>
        <span className="micro">{saving ? "Speichern …" : `${activePrefs} aktiv`}</span>
      </div>
      <p className="micro mb12">
        Produkte werden entsprechend deiner Auswahl geprüft und markiert.
      </p>
      {(Object.keys(DIET_PREF_LABELS) as (keyof DietPrefs)[]).map((key) => (
        <button
          key={key}
          className={`toggle-row${prefs[key] ? " on" : ""}`}
          onClick={() => toggle(key)}
          type="button"
        >
          <span className="tl">{DIET_PREF_LABELS[key]}</span>
          <span className="switch" />
        </button>
      ))}
      {activePrefs > 0 && (
        <div className="banner banner-warn mt8 mb8">
          ⚠️ Aktive Filter beeinflussen Warnhinweise und Alternativen-Vorschläge.
        </div>
      )}

      <span className="label mb12 mt24" style={{ display: "block" }}>Premium-Funktionen</span>
      <Link href="/lists">
        <span className="set-item"><span className="set-ic">🛒</span><span className="grow">Einkaufsliste</span>{!user.premium && "👑"}<span className="chev">›</span></span>
      </Link>
      <Link href="/compare">
        <span className="set-item"><span className="set-ic">⚖️</span><span className="grow">Produktvergleich</span>{!user.premium && "👑"}<span className="chev">›</span></span>
      </Link>
      {user.premium && (
        <a href="/api/export/history">
          <span className="set-item"><span className="set-ic">⬇︎</span><span className="grow">Verlauf als CSV exportieren</span><span className="chev">›</span></span>
        </a>
      )}

      <span className="label mb12 mt24" style={{ display: "block" }}>Community</span>
      <div className="set-item" style={{ cursor: "default" }}>
        <span className="set-ic">📝</span><span className="grow">Meine Beiträge</span>
        <span className="badge badge-accent">{stats.contributions}</span>
      </div>
      <div className="set-item" style={{ cursor: "default" }}>
        <span className="set-ic">✎</span><span className="grow">Korrekturen eingereicht</span>
        <span className="badge badge-accent">{stats.corrections}</span>
      </div>

      {user.role === "admin" && (
        <>
          <span className="label mb12 mt24" style={{ display: "block" }}>Verwaltung</span>
          <Link href="/admin">
            <span className="set-item"><span className="set-ic">🛡️</span><span className="grow">Admin-Panel</span><span className="chev">›</span></span>
          </Link>
        </>
      )}

      <span className="label mb12 mt24" style={{ display: "block" }}>Rechtliches</span>
      <Link href="/legal/datenschutz"><span className="set-item"><span className="set-ic">🔒</span><span className="grow">Datenschutzerklärung</span><span className="chev">›</span></span></Link>
      <Link href="/legal/agb"><span className="set-item"><span className="set-ic">📄</span><span className="grow">Nutzungsbedingungen</span><span className="chev">›</span></span></Link>
      <Link href="/legal/impressum"><span className="set-item"><span className="set-ic">ℹ️</span><span className="grow">Impressum</span><span className="chev">›</span></span></Link>

      <button className="btn btn-danger btn-sm mt24" onClick={logout}>
        Abmelden
      </button>
    </div>
  );
}
