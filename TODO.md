# TODO — Was nur du erledigen kannst

Die App ist vollständig gebaut, kompiliert und lokal end-to-end getestet
(`npm install && npm run dev` läuft ohne jede Konfiguration).
Hier steht **ausschließlich**, was Accounts, Keys oder manuelle Schritte braucht.

---

## 1. Lokale Umgebung (2 Minuten)

`.env.local` existiert bereits (beim Test erzeugt). Zwei Werte anpassen:

- [ ] **ADMIN_EMAIL** ändern: steht aktuell auf dem Platzhalter `admin@truelabel.dev`.
      Trage deine eigene E-Mail ein — das Konto, das du damit registrierst, wird
      automatisch Admin (Zugriff auf `/admin`).
- [ ] **OFF_CONTACT** setzen: deine echte Kontakt-E-Mail. OpenFoodFacts verlangt
      sie im User-Agent ihrer API-Richtlinie.

## 2. Mistral AI (KI-Features: Foto-Extraktion, Korrektur-Triage)

- [ ] Konto auf https://console.mistral.ai anlegen
- [ ] API-Key erstellen: *API Keys → Create new key*
- [ ] In `.env.local` eintragen: `MISTRAL_API_KEY=<key>`
- [ ] Optional Limit anpassen: `AI_BUDGET_CENTS=3800` (= 38 €; App stoppt KI-Calls
      hart bei Erreichen — Ausgaben siehst du live unter `/admin` → „KI-Budget“)
- Hinweis: **Ohne Key läuft alles weiter** — Beiträge/Korrekturen degradieren
  automatisch in den manuellen Modus.

## 3. Google OAuth (optional — Button erscheint nur mit Keys)

- [ ] https://console.cloud.google.com → Projekt anlegen →
      *APIs & Services → Credentials → Create Credentials → OAuth client ID*
- [ ] Typ **Web application**; Authorized redirect URI:
      `http://localhost:3000/api/auth/google/callback`
      (später zusätzlich: `https://<deine-domain>/api/auth/google/callback`)
- [ ] OAuth-Consent-Screen ausfüllen (App-Name „TrueLabel“, deine E-Mail)
- [ ] In `.env.local`: `GOOGLE_CLIENT_ID=…` und `GOOGLE_CLIENT_SECRET=…`

## 4. Stripe (Premium-Abo)

- [ ] Konto auf https://dashboard.stripe.com (erst Test-Modus reicht)
- [ ] *Produktkatalog → Produkt hinzufügen*: Name **TrueLabel Premium**, zwei Preise:
  - wiederkehrend **2,49 € / Monat** → Price-ID kopieren → `STRIPE_PRICE_MONTHLY=price_…`
  - wiederkehrend **19,99 € / Jahr** → Price-ID kopieren → `STRIPE_PRICE_YEARLY=price_…`
- [ ] *Entwickler → API-Schlüssel*: `STRIPE_SECRET_KEY=sk_…`
- [ ] *Entwickler → Webhooks → Endpoint hinzufügen*:
  - URL: `https://<deine-domain>/api/premium/webhook`
    (lokal testen: `stripe listen --forward-to localhost:3000/api/premium/webhook`)
  - Events: `checkout.session.completed`, `customer.subscription.updated`,
    `customer.subscription.deleted`, `invoice.paid`
  - Signing-Secret → `STRIPE_WEBHOOK_SECRET=whsec_…`
- [ ] *Einstellungen → Billing → Customer Portal* aktivieren (für „Abo verwalten“)

## 5. Supabase als Datenbank

- [ ] Projekt auf https://supabase.com anlegen (Region **Central EU (Frankfurt)**)
- [ ] *Project Settings → Database → Connection string → **Transaction pooler**
      (Port 6543)* kopieren, `[YOUR-PASSWORD]` durch dein DB-Passwort ersetzen
- [ ] Diesen String auf dem Server als `DATABASE_URL` eintragen
      (`/opt/TrueLabel/.env`) — siehe Schritt 6. SSL aktiviert die App automatisch.
- [ ] Danach App neu starten: `ssh root@46.225.191.223 "pm2 restart truelabel"`
      (Schema + Seed legt die App beim ersten Start selbst an).
- Hinweis: Ohne `DATABASE_URL` läuft der Server mit eingebettetem PGlite weiter —
  d. h. die App ist sofort live, Supabase kannst du jederzeit nachziehen.

## 6. Hetzner-Deployment (bereits eingerichtet)

Ich habe die App auf `46.225.191.223` unter **`/opt/TrueLabel`** deployt:
geklont, gebaut und als PM2-Prozess **`truelabel`** auf **Port 3100** gestartet
(Port 3000 ist von kamalkit belegt). Auf dem Server liegt eine `.env` mit
generiertem `AUTH_SECRET`, `ADMIN_EMAIL` und `PORT=3100`.

Damit die App öffentlich + per HTTPS erreichbar ist (die Kamera braucht HTTPS):

- [ ] **DNS-A-Record setzen**: `truelabel.kdoc.at` → `46.225.191.223`
      (bei deinem DNS-Anbieter für kdoc.at)
- [ ] Sobald der Record aktiv ist, **TLS-Zertifikat holen**:
      ```bash
      ssh root@46.225.191.223 "certbot --nginx -d truelabel.kdoc.at --non-interactive --agree-tos -m DEINE@MAIL.de --redirect"
      ```
      (oder sag mir Bescheid — dann mache ich es)
- [ ] `NEXT_PUBLIC_APP_URL=https://truelabel.kdoc.at` in `/opt/TrueLabel/.env`
      eintragen und `pm2 restart truelabel`
- Andere Subdomain gewünscht? Sag den Namen — ist eine Zeile im nginx-vHost.

## 7. CI/CD: Auto-Deploy bei Push auf `main`

Die Pipeline (`.github/workflows/deploy.yml`) ist im Repo. Sie verbindet sich
per SSH mit dem Hetzner-Server und führt `git pull → npm ci → build →
pm2 reload truelabel` aus. Dafür **drei GitHub-Secrets** anlegen:

*GitHub → Repo **TrueLabel** → Settings → Secrets and variables → Actions → New repository secret*

- [ ] `HETZNER_HOST` = `46.225.191.223`
- [ ] `HETZNER_USER` = `root`
- [ ] `HETZNER_SSH_KEY` = **privater Deploy-Key** (Inhalt der Datei, die ich dir
      lokal unter `~/.ssh/truelabel_deploy` ablege — den passenden Public-Key habe
      ich bereits auf dem Server hinterlegt). Kompletten Inhalt inkl.
      `-----BEGIN…` und `-----END…` einfügen.

Solange die Secrets fehlen, überspringt die Pipeline den Deploy-Schritt
(kein roter Fehler). Danach deployt jeder Push auf `main` automatisch.

## 8. Optionale Dienste auf dem Server nachtragen

In `/opt/TrueLabel/.env` ergänzen und `pm2 restart truelabel`:

- [ ] **Mistral** (Schritt 2): `MISTRAL_API_KEY=…`
- [ ] **Google-Login** (Schritt 3): `GOOGLE_CLIENT_ID/SECRET` + Redirect-URI
      `https://truelabel.kdoc.at/api/auth/google/callback`
- [ ] **Stripe** (Schritt 4): Keys + Webhook-URL `https://truelabel.kdoc.at/api/premium/webhook`

## 9. Rechtstexte finalisieren (vor Veröffentlichung Pflicht)

Alle Platzhalter sind gold markiert als `[SO]`:

- [ ] `src/app/legal/impressum/page.tsx` — Name, Anschrift, E-Mail, ggf. USt-IdNr.
- [ ] `src/app/legal/datenschutz/page.tsx` — Name, Anschrift, E-Mail, Bundesland
- [ ] `src/app/legal/agb/page.tsx` — Name, Anschrift, E-Mail
- [ ] Empfehlung: einmal anwaltlich gegenlesen lassen (Scores über Markenprodukte
      sind äußerungsrechtlich sensibel — die Texte sind defensiv formuliert,
      aber eine Stunde Anwalt ist gut investiert)

## 10. Git (erledigt)

Das Projekt ist committet und auf `git@github.com:kamala15190-coder/TrueLabel`
(Branch `main`) gepusht. Künftige Änderungen einfach committen und pushen —
ab eingerichteten Secrets (Schritt 7) deployt das automatisch auf Hetzner.
