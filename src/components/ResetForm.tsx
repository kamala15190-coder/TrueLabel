"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <div>
        <div className="banner banner-bad mb16">
          Dieser Link ist unvollständig oder ungültig.
        </div>
        <Link href="/forgot">
          <span className="btn btn-ghost">Neuen Link anfordern</span>
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Etwas ist schiefgelaufen.");
        return;
      }
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
        <label htmlFor="password">Neues Passwort</label>
        <input
          id="password"
          className="input"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Mindestens 8 Zeichen"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
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
      <button className="btn btn-primary mt8 mb16" type="submit" disabled={busy}>
        {busy ? "Einen Moment …" : "Passwort speichern & anmelden"}
      </button>
    </form>
  );
}
