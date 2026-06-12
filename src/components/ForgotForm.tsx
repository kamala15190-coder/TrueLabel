"use client";

import Link from "next/link";
import { useState } from "react";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch(() => {});
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div>
        <div className="banner banner-good mb16">
          Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link zum
          Zurücksetzen geschickt. Schau in dein Postfach (auch im Spam-Ordner).
        </div>
        <Link href="/login">
          <span className="btn btn-ghost">Zurück zur Anmeldung</span>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
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
      <button className="btn btn-primary mt8 mb16" type="submit" disabled={busy}>
        {busy ? "Einen Moment …" : "Link zum Zurücksetzen senden"}
      </button>
      <p className="center body-m t2">
        <Link href="/login" className="link">Zurück zur Anmeldung</Link>
      </p>
    </form>
  );
}
