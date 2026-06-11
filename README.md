# TrueLabel

**Weißt du wirklich, was du isst?** — Barcode scannen und sofort sehen, wie gesund,
nachhaltig und fair ein Lebensmittel ist. Der direkte Angriff auf CodeCheck:
schnell, werbefrei, vertrauenswürdig.

## Sofort starten (null Konfiguration)

```bash
npm install
npm run dev
```

→ http://localhost:3000. Ohne `DATABASE_URL` läuft eine **eingebettete
Postgres-Datenbank (PGlite)** in `./.data` — mit 13 Basisprodukten vorbefüllt.
Auf dem Desktop ohne Kamera: Demo-Chips unter dem Scanner oder Barcode manuell
eingeben (z. B. `4012345678901`).

Produktion: `.env.example` → `.env.local` kopieren und füllen. **Alles, was
Accounts/Keys braucht, steht Schritt für Schritt in [TODO.md](TODO.md).**

## Architektur-Entscheidungen (und warum)

| Entscheidung | Warum |
|---|---|
| **PWA statt nativer App** | Kein App-Store-Gatekeeping, keine 30 %-Apple-Tax auf 2,49 €, sofortige Updates. Jede Produktseite ist eine teilbare URL → SEO ist der Wachstumsmotor, den CodeCheck nicht hat. Installierbar via „Zum Home-Bildschirm“. |
| **Scannen ohne Konto** | Null Friktion ist Kernversprechen. Verlauf liegt lokal (localStorage) und wird beim Registrieren ins Konto gemergt. |
| **Regelbasiertes Scoring** | Nutri-Score-Algorithmus, E-Nummern-Risikoklassen, CO₂-Kategorientabelle, Länder-Tiers — deterministisch, erklärbar, **0 € pro Scan**. KI nur dort, wo Regeln nicht reichen. |
| **Mistral nur für 2 Jobs** | (1) Foto-Extraktion bei Community-Beiträgen, (2) Korrektur-Triage. Jede Antwort wird gecacht (SHA-256-Key), Ausgaben werden pro Monat in der DB gezählt, **harte Budgetbremse** (Default 38 €). Bei Limit: sauberer manueller Modus statt Kostenexplosion. |
| **Eigene DB zuerst, OFF als Fallback** | Unbekannter Barcode → OpenFoodFacts-Abfrage → Write-Through in die eigene DB. Der Nutzer merkt nichts, die Datenbank wächst mit jedem Scan. |
| **Custom Auth (JWT-Cookie + manuelles Google-OAuth)** | Sicherheitskritischer Kern ohne Framework-Breaking-Changes. bcrypt-Hashes, httpOnly-Cookie, 30 Tage. Google-Button erscheint nur, wenn Keys gesetzt sind. |
| **Kein ORM** | Handgeschriebenes SQL über einen 40-Zeilen-Treiber, der PGlite (Dev) und Postgres/Supabase (Prod, SSL automatisch) identisch bedient. Eine Abhängigkeitsquelle weniger. |
| **PGlite als Dev-Fallback** | Echte Postgres-Semantik ohne Docker, ohne Setup. `DATABASE_URL` gesetzt → Produktionspfad. |

### Bewusst gestrichen / verschoben

- **PDF-Export** → CSV reicht für v1 (Excel-kompatibel, Semikolon + BOM). PDF ist eine Library-Abhängigkeit ohne Mehrwert fürs Kernprodukt.
- **Familienprofile** → Roadmap. Braucht saubere Mehrprofil-UX, lohnt erst mit Nutzerbasis.
- **Standort-/Marktpriorisierung bei Alternativen** → Es gibt keine verlässliche öffentliche Quelle für „welches Produkt liegt in welchem Markt“. Stattdessen: Alternativen aus derselben Kategorie, konfliktfrei zum Ernährungsprofil, sortiert nach Score. Ehrlich statt vorgetäuscht.
- **Korrektur-Fotos** → v1 ist Text-Triage; Fotos kommen, wenn das Korrekturvolumen es rechtfertigt.

## Die drei Scores

Gewichtung Gesamtscore: **45 % Gesundheit, 30 % Umwelt, 25 % Soziales** (`src/lib/scoring/index.ts`, `SCORE_VERSION` hochzählen ⇒ alle Produkte werden beim nächsten Abruf neu bewertet).

- **Gesundheit**: Nutri-Score-Punkte (Algorithmus 2017) als Basis, Abzüge für Zusatzstoffe nach Risikoklasse (EFSA-orientiert) und Verarbeitungsgrad (NOVA).
- **Umwelt**: Basis 50 ± Bio-Zertifikat, Herkunft/Transportweg, Verpackungsmaterial, Palmöl, CO₂-Kategorieschätzung. Liegt ein OFF-Green-Score vor, wird er 50/50 eingemischt.
- **Soziales**: Basis 55 ± Fairtrade/Rainforest-Siegel, Risikorohstoffe (Kakao, Kaffee, Vanille, …) ohne Zertifizierung, Länder-Tier (ITUC-orientiert), Transparenz.

Jeder Faktor liefert Label, Wert, Punkte-Delta und Erklärung → die Detail-Sheets
in der App zeigen exakt, *warum* ein Score so ist. Disclaimer auf jedem
Score-Screen (algorithmisch, kein Medizinrat).

## Projektstruktur

```
src/
  lib/
    db.ts              Treiber (pg ↔ PGlite) + Schema + Auto-Migration + Auto-Seed
    scoring/           Die Engine: nutriscore, health, eco, social, Wissensbasis (data.ts)
    mistral.ts         KI-Client: Cache (ai_cache) + Budgetbremse (ai_budget)
    off.ts             OpenFoodFacts-Client + Normalisierung
    productService.ts  Datenstrategie: eigene DB → OFF → Write-Through
    auth.ts / google.ts / stripe.ts
    personal.ts        Ernährungsprofil-Abgleich (conflict/note/match)
    repo/              SQL-Repositories (users, products, community)
  app/
    api/               24 Route-Handler (Auth, Produkte, Suche, Community, Premium, Admin)
    product/[barcode]  Produktseite (SSR, shareable, generateMetadata)
    add / correct      Community-Flows (KI-Wizard, Korrektur-Triage)
    admin              Review-Queue, Produkt-Verifizierung, KI-Budget-Dashboard
    legal/             Impressum, Datenschutz (DSGVO), AGB — Platzhalter: [SO MARKIERT]
  components/          ScoreRings (Signaturelement), Scanner (zxing), Sheets, Wizards
public/sw.js           Offline: App-Shell + zuletzt geöffnete Produkte
```

## Befehle

```bash
npm run dev          # Entwicklung (http://localhost:3000)
npm run build        # Produktions-Build
npm start            # Produktionsserver (braucht AUTH_SECRET)
npm run typecheck    # TypeScript strict, ohne Emit
npm run icons        # PWA-Icons aus dem SVG-Logo neu erzeugen
```

## Betrieb & Kosten

- **KI-Budget**: `AI_BUDGET_CENTS` (Default 3800 = 38 €). Admin-Panel → Tab „KI-Budget“ zeigt Monatsausgaben, Call-Zähler und Cache-Größe live.
- **Admin**: Die E-Mail aus `ADMIN_EMAIL` wird bei Registrierung automatisch Admin (inkl. Premium). Admin-Panel unter `/admin`.
- **Premium**: Stripe-Abo (monatlich/jährlich), Webhook setzt `premium_until` (+3 Tage Kulanz). Ohne Stripe-Keys zeigt die App ehrlich „Zahlungen werden eingerichtet“.

## Roadmap (nach v1)

Familienprofile · Korrektur-Fotos mit Vision-Triage · Produktseiten-Sitemap für
SEO · Push-Benachrichtigungen (Korrektur-Status) · Händler-/Preisdaten, sobald
es eine belastbare Quelle gibt.
