"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { clearLocalHistory } from "@/lib/clientHistory";
import { DIET_PREF_LABELS, type DietPrefs, type SessionUser } from "@/lib/types";
import { Sheet } from "./Sheet";

// Gewähltes Bild clientseitig auf ein quadratisches 256px-JPEG eindampfen,
// damit nur ein kompaktes Data-URL in die DB wandert.
async function fileToAvatar(file: File): Promise<string> {
  const dataUrl: string = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error("read"));
    r.readAsDataURL(file);
  });
  const img: HTMLImageElement = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("decode"));
    i.src = dataUrl;
  });
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  const s = Math.min(img.width, img.height); // mittiger Quadrat-Zuschnitt
  ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function ProfileClient({
  user,
  stats,
  stripeConfigured,
  hasPassword,
}: {
  user: SessionUser;
  stats: { scans: number; contributions: number; corrections: number };
  stripeConfigured: boolean;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<DietPrefs>(user.dietPrefs);
  const [saving, setSaving] = useState(false);

  // Profil-bearbeiten-Sheet (Foto + Name + Passwort)
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState<string | null>(user.avatar);
  const [accBusy, setAccBusy] = useState(false);
  const [accError, setAccError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwDone, setPwDone] = useState(false);

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwDone(false);
    if (newPw !== confirmPw) {
      setPwError("Die neuen Passwörter stimmen nicht überein.");
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwError(json.error ?? "Etwas ist schiefgelaufen.");
        return;
      }
      setPwDone(true);
      setCurPw("");
      setNewPw("");
      setConfirmPw("");
    } finally {
      setPwBusy(false);
    }
  };

  const openEdit = () => {
    setName(user.name);
    setAvatar(user.avatar);
    setAccError("");
    setEditOpen(true);
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // gleiche Datei erneut wählbar
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAccError("Bitte wähle eine Bilddatei.");
      return;
    }
    setAccError("");
    try {
      setAvatar(await fileToAvatar(file));
    } catch {
      setAccError("Das Bild konnte nicht verarbeitet werden.");
    }
  };

  const saveAccount = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setAccError("Bitte gib einen Namen ein.");
      return;
    }
    setAccError("");
    setAccBusy(true);
    try {
      const res = await fetch("/api/profile/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, avatar }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAccError(json.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      setEditOpen(false);
      router.refresh();
    } finally {
      setAccBusy(false);
    }
  };

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
        <button type="button" className="avatar avatar-tap" onClick={openEdit} aria-label="Profil bearbeiten">
          {user.avatar ? <img src={user.avatar} alt="" className="avatar-img" /> : initials}
          <span className="avatar-pencil" aria-hidden>✎</span>
        </button>
        <div className="grow">
          <button type="button" className="h-m profile-name-btn" onClick={openEdit}>{user.name}</button>
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

      {editOpen && (
        <Sheet onClose={() => setEditOpen(false)}>
          <h2 className="h-m mb20">Profil bearbeiten</h2>

          <div className="row gap16 mb20">
            <button
              type="button"
              className="avatar avatar-tap"
              style={{ width: 88, height: 88, fontSize: 30 }}
              onClick={() => fileRef.current?.click()}
              aria-label="Foto wählen"
            >
              {avatar ? <img src={avatar} alt="" className="avatar-img" /> : initials}
              <span className="avatar-pencil" aria-hidden>✎</span>
            </button>
            <div className="grow">
              <button
                type="button"
                className="btn btn-subtle btn-sm"
                style={{ width: "auto", padding: "0 18px" }}
                onClick={() => fileRef.current?.click()}
              >
                Foto wählen
              </button>
              {avatar && (
                <button
                  type="button"
                  className="link mt12"
                  style={{ display: "block" }}
                  onClick={() => setAvatar(null)}
                >
                  Foto entfernen
                </button>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />

          <div className="field">
            <label htmlFor="acc-name">Name</label>
            <input
              id="acc-name"
              className="input"
              value={name}
              maxLength={60}
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {accError && <div className="banner banner-bad mb12">{accError}</div>}
          <button className="btn btn-primary" onClick={saveAccount} disabled={accBusy}>
            {accBusy ? "Speichern …" : "Speichern"}
          </button>

          <div className="sheet-sep" />

          <span className="label mb12" style={{ display: "block" }}>
            {hasPassword ? "Passwort ändern" : "Passwort festlegen"}
          </span>
          <form onSubmit={submitPassword}>
            {pwError && <div className="banner banner-bad mb12">{pwError}</div>}
            {pwDone && <div className="banner banner-good mb12">Passwort gespeichert.</div>}
            {!hasPassword && (
              <p className="micro mb12">
                Dein Konto wurde über Google erstellt. Lege ein Passwort fest, um dich auch
                klassisch anmelden zu können.
              </p>
            )}
            {hasPassword && (
              <div className="field">
                <label htmlFor="curPw">Aktuelles Passwort</label>
                <input
                  id="curPw"
                  className="input"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={curPw}
                  onChange={(e) => setCurPw(e.target.value)}
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="newPw">Neues Passwort</label>
              <input
                id="newPw"
                className="input"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Mindestens 8 Zeichen"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="confirmPw">Neues Passwort bestätigen</label>
              <input
                id="confirmPw"
                className="input"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-sm mt8" type="submit" disabled={pwBusy}>
              {pwBusy ? "Speichern …" : "Passwort speichern"}
            </button>
          </form>
        </Sheet>
      )}
    </div>
  );
}
