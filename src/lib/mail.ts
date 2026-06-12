// ============================================================
// E-Mail-Versand via Resend (HTTP-API, kein SDK nötig).
// Konfiguration über Env:
//   RESEND_API_KEY   API-Schlüssel von resend.com
//   MAIL_FROM        Verifizierter Absender, z. B. "TrueLabel <noreply@deine-domain.de>"
// Ohne RESEND_API_KEY: kein echter Versand — die Mail wird ins
// Server-Log geschrieben (Dev/Fallback), damit Flows trotzdem testbar sind.
// ============================================================

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export async function sendMail(mail: MailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from) {
    console.warn(
      `[truelabel] Mail nicht versendet (RESEND_API_KEY/MAIL_FROM fehlen).\n` +
        `  An:      ${mail.to}\n` +
        `  Betreff: ${mail.subject}\n` +
        `  Text:    ${mail.text}`
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend-Fehler ${res.status}: ${detail}`);
  }
}

/** Branded HTML-Wrapper für transaktionale Mails. */
export function mailLayout(opts: { heading: string; body: string; cta?: { label: string; url: string } }): string {
  const button = opts.cta
    ? `<a href="${opts.cta.url}" style="display:inline-block;background:#1f6f4f;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:12px;font-weight:600;font-size:15px;margin:8px 0 4px">${opts.cta.label}</a>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f6f5f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a">
  <div style="max-width:480px;margin:0 auto;padding:32px 20px">
    <div style="font-size:20px;font-weight:700;letter-spacing:-.02em;margin-bottom:24px">TrueLabel</div>
    <div style="background:#ffffff;border-radius:18px;padding:28px 24px;box-shadow:0 1px 3px rgba(0,0,0,.05)">
      <h1 style="font-size:19px;margin:0 0 12px">${opts.heading}</h1>
      <div style="font-size:15px;line-height:1.55;color:#444">${opts.body}</div>
      ${button}
    </div>
    <p style="font-size:12px;color:#999;margin-top:20px;line-height:1.5">Diese Nachricht wurde automatisch von TrueLabel versendet. Wenn du sie nicht erwartet hast, kannst du sie ignorieren.</p>
  </div>
</body></html>`;
}
