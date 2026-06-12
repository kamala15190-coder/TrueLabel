"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { mergeLocalHistory } from "@/lib/clientHistory";

const GoogleIcon = (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 009 18z" />
    <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 010-3.44V4.95H.96a9 9 0 000 8.1l3-2.33z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 009 0 9 9 0 00.96 4.95l3 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
  </svg>
);

export function AuthForm({
  mode,
  googleEnabled,
  initialError,
}: {
  mode: "login" | "register";
  googleEnabled: boolean;
  initialError?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isRegister && password !== confirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Etwas ist schiefgelaufen.");
        return;
      }
      await mergeLocalHistory();
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {error && <div className="banner banner-bad mb16">{error}</div>}

      <div className="field">
        <label htmlFor="email">E-Mail</label>
        <input
          id="email"
          className="input"
          type="email"
          required
          autoComplete="email"
          placeholder="du@beispiel.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="password">Passwort</label>
        <input
          id="password"
          className="input"
          type="password"
          required
          minLength={isRegister ? 8 : 1}
          autoComplete={isRegister ? "new-password" : "current-password"}
          placeholder={isRegister ? "Mindestens 8 Zeichen" : "Dein Passwort"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {isRegister && (
        <div className="field">
          <label htmlFor="confirm">Passwort bestätigen</label>
          <input
            id="confirm"
            className="input"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Passwort wiederholen"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      )}

      {!isRegister && (
        <p className="mt8" style={{ textAlign: "right" }}>
          <Link href="/forgot" className="link micro">Passwort vergessen?</Link>
        </p>
      )}

      <button className="btn btn-primary mt8 mb16" type="submit" disabled={busy}>
        {busy ? "Einen Moment …" : isRegister ? "Registrieren" : "Anmelden"}
      </button>

      {googleEnabled && (
        <>
          <div className="row gap12 mb16" style={{ color: "var(--text-3)" }}>
            <div className="grow" style={{ height: 1, background: "var(--border)" }} />
            <span className="micro">oder</span>
            <div className="grow" style={{ height: 1, background: "var(--border)" }} />
          </div>
          <a href="/api/auth/google">
            <span className="btn btn-ghost">{GoogleIcon} Weiter mit Google</span>
          </a>
        </>
      )}

      <p className="center mt20 body-m t2">
        {isRegister ? (
          <>
            Bereits ein Konto?{" "}
            <Link href="/login" className="link">Anmelden</Link>
          </>
        ) : (
          <>
            Noch kein Konto?{" "}
            <Link href="/register" className="link">Registrieren</Link>
          </>
        )}
      </p>

      {isRegister && (
        <p className="micro center mt24" style={{ padding: "0 10px" }}>
          Mit der Registrierung akzeptierst du unsere{" "}
          <Link href="/legal/agb" style={{ color: "var(--text-2)" }}>Nutzungsbedingungen</Link> und{" "}
          <Link href="/legal/datenschutz" style={{ color: "var(--text-2)" }}>Datenschutzerklärung</Link>.
        </p>
      )}
    </form>
  );
}
