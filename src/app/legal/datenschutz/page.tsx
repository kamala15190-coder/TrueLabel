import type { Metadata } from "next";
import { BackBar } from "@/components/BackBar";

export const metadata: Metadata = { title: "Datenschutzerklärung" };

export default function DatenschutzPage() {
  return (
    <main className="page no-nav prose">
      <BackBar title="Datenschutz" />
      <h1 className="h-l mb16">Datenschutzerklärung</h1>
      <p>Stand: Juni 2026</p>

      <h2>1. Verantwortlicher</h2>
      <p>
        Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO):
        <br />
        <span className="ph">[VOR- UND NACHNAME]</span>,{" "}
        <span className="ph">[ANSCHRIFT]</span>, E-Mail:{" "}
        <span className="ph">[KONTAKT-E-MAIL]</span>.
      </p>

      <h2>2. Grundsätze</h2>
      <p>
        TrueLabel ist bewusst datensparsam gebaut: <strong>Scannen funktioniert ohne
        Konto.</strong> In diesem Fall wird dein Scan-Verlauf ausschließlich lokal auf
        deinem Gerät gespeichert (localStorage) und nicht an uns übertragen. Wir
        zeigen keine Werbung und verkaufen keine Daten — Werbe- oder
        Tracking-Dienste Dritter sind nicht eingebunden.
      </p>

      <h2>3. Hosting</h2>
      <p>
        Die App wird bei <span className="ph">[HOSTING-ANBIETER, ANSCHRIFT]</span>{" "}
        gehostet. Beim Aufruf verarbeitet der Anbieter technisch notwendige Daten
        (IP-Adresse, Zeitpunkt, abgerufene Ressource, User-Agent) in
        Server-Logfiles. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
        Interesse an sicherem, stabilem Betrieb). Mit dem Anbieter besteht ein
        Auftragsverarbeitungsvertrag. <span className="ph">[Falls der Anbieter
        außerhalb der EU/des EWR sitzt: Hinweis auf EU-Standardvertragsklauseln
        als Grundlage der Übermittlung ergänzen.]</span>
      </p>

      <h2>4. Konto und Registrierung</h2>
      <p>
        Bei der Registrierung verarbeiten wir deine E-Mail-Adresse, einen
        Anzeigenamen und dein Passwort (gespeichert ausschließlich als
        bcrypt-Hash). Mit Konto speichern wir außerdem: deinen Scan-Verlauf, deine
        Ernährungsprofile (z. B. „vegan“, „glutenfrei“), Community-Beiträge,
        Korrekturen und Punktestand. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO
        (Vertragserfüllung). Die Session wird über ein technisch notwendiges
        Cookie („tl_session“, 30 Tage, httpOnly) gehalten — Rechtsgrundlage:
        § 25 Abs. 2 Nr. 2 TDDDG.
      </p>
      <p>
        <strong>Besonderer Hinweis zu Ernährungsprofilen:</strong> Einstellungen wie
        Unverträglichkeiten können Rückschlüsse auf deine Gesundheit zulassen
        (Art. 9 DSGVO). Du gibst sie freiwillig an; mit dem Aktivieren willigst du
        in die Verarbeitung zum Zweck der personalisierten Produktbewertung ein
        (Art. 9 Abs. 2 lit. a DSGVO). Du kannst sie jederzeit im Profil
        deaktivieren — sie werden dann nicht mehr verwendet.
      </p>

      <h2>5. Login mit Google (optional)</h2>
      <p>
        Wenn du dich mit Google anmeldest, erhalten wir von Google deine
        E-Mail-Adresse, deinen Namen und eine Konto-ID. Anbieter: Google Ireland
        Limited, Gordon House, Barrow Street, Dublin 4, Irland. Rechtsgrundlage:
        Art. 6 Abs. 1 lit. b DSGVO. Die Nutzung ist freiwillig — Registrierung per
        E-Mail ist gleichwertig möglich.
      </p>

      <h2>6. Premium-Abo und Zahlungen (Stripe)</h2>
      <p>
        Zahlungen wickelt Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower,
        Dublin, Irland ab. Wir erhalten keine vollständigen Zahlungsdaten, sondern
        nur eine Kundenreferenz und den Abo-Status. Rechtsgrundlagen: Art. 6 Abs. 1
        lit. b DSGVO (Vertrag) und gesetzliche Aufbewahrungspflichten (Art. 6
        Abs. 1 lit. c DSGVO). Details: https://stripe.com/de/privacy.
      </p>

      <h2>7. Produktfotos und KI-Verarbeitung (Mistral AI)</h2>
      <p>
        Wenn du ein Produkt per Foto beiträgst, werden die Fotos zur automatischen
        Texterkennung an Mistral AI SAS, 15 rue des Halles, 75001 Paris, Frankreich
        (EU) übertragen und dort verarbeitet. Wir speichern die Fotos nicht
        dauerhaft — nur die extrahierten Produktdaten (Zutaten, Nährwerte).
        Fotografiere keine Personen oder persönlichen Gegenstände mit.
        Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Auch Korrekturtexte werden zur
        automatischen Prüfung an Mistral übermittelt.
      </p>

      <h2>8. Produktdaten (OpenFoodFacts)</h2>
      <p>
        Für unbekannte Barcodes fragt unser Server die offene Datenbank
        OpenFoodFacts ab. Dabei wird der Barcode übermittelt — niemals deine
        IP-Adresse oder Kontodaten, da die Anfrage von unserem Server ausgeht.
      </p>

      <h2>9. Lokale Speicherung (localStorage)</h2>
      <p>
        Ohne Konto speichert die App deinen Verlauf, deine letzten Suchen und den
        Onboarding-Status ausschließlich lokal auf deinem Gerät. Diese Daten
        verlassen dein Gerät nicht (§ 25 Abs. 2 Nr. 2 TDDDG). Beim Erstellen eines
        Kontos kannst du den lokalen Verlauf in dein Konto übernehmen.
      </p>

      <h2>10. Cookies</h2>
      <p>
        Wir verwenden ausschließlich technisch notwendige Cookies (Session,
        OAuth-Sicherheits-State). Es gibt kein Tracking, keine Analyse-Cookies,
        keine Werbe-Cookies — deshalb auch kein Cookie-Banner.
      </p>

      <h2>11. Speicherdauer</h2>
      <p>
        Kontodaten speichern wir bis zur Löschung deines Kontos. Server-Logs
        werden vom Hosting-Anbieter nach kurzer Zeit automatisch gelöscht.
        Rechnungsbezogene Daten unterliegen gesetzlichen Aufbewahrungsfristen
        (bis zu 10 Jahre).
      </p>

      <h2>12. Deine Rechte</h2>
      <ul>
        <li>Auskunft (Art. 15 DSGVO)</li>
        <li>Berichtigung (Art. 16 DSGVO)</li>
        <li>Löschung (Art. 17 DSGVO)</li>
        <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
        <li>Widerspruch gegen Verarbeitung auf Basis berechtigter Interessen (Art. 21 DSGVO)</li>
        <li>Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)</li>
      </ul>
      <p>
        Wende dich dafür formlos an <span className="ph">[KONTAKT-E-MAIL]</span>.
        Außerdem hast du das Recht auf Beschwerde bei einer
        Datenschutz-Aufsichtsbehörde, z. B. der für{" "}
        <span className="ph">[BUNDESLAND]</span> zuständigen Behörde.
      </p>

      <h2>13. Datensicherheit</h2>
      <p>
        Alle Verbindungen sind TLS-verschlüsselt. Passwörter werden ausschließlich
        gehasht gespeichert. Der Zugriff auf die Datenbank ist auf den Betreiber
        beschränkt.
      </p>

      <h2>14. Änderungen</h2>
      <p>
        Wir passen diese Erklärung an, wenn sich die App oder die Rechtslage
        ändert. Es gilt die jeweils hier veröffentlichte Fassung.
      </p>
    </main>
  );
}
