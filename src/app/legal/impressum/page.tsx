import type { Metadata } from "next";
import { BackBar } from "@/components/BackBar";

export const metadata: Metadata = { title: "Impressum" };

export default function ImpressumPage() {
  return (
    <main className="page no-nav prose">
      <BackBar title="Impressum" />
      <h1 className="h-l mb16">Impressum</h1>

      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        <span className="ph">[VOR- UND NACHNAME]</span>
        <br />
        <span className="ph">[STRASSE UND HAUSNUMMER]</span>
        <br />
        <span className="ph">[PLZ UND ORT]</span>
        <br />
        Deutschland
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: <span className="ph">[KONTAKT-E-MAIL]</span>
        <br />
        Telefon: <span className="ph">[TELEFONNUMMER — optional, aber empfohlen]</span>
      </p>

      <h2>Umsatzsteuer</h2>
      <p>
        Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:{" "}
        <span className="ph">[UST-IDNR. — falls vorhanden, sonst Absatz entfernen]</span>
      </p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        <span className="ph">[VOR- UND NACHNAME, ANSCHRIFT WIE OBEN]</span>
      </p>

      <h2>EU-Streitschlichtung</h2>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung
        (OS) bereit: https://ec.europa.eu/consumers/odr/. Unsere E-Mail-Adresse
        findest du oben im Impressum.
      </p>
      <p>
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor
        einer Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <h2>Hinweis zu den Scores</h2>
      <p>
        Die in der App angezeigten Bewertungen (Gesundheits-, Umwelt- und
        Sozial-Score) werden algorithmisch aus öffentlich verfügbaren Daten und
        Community-Beiträgen berechnet. Sie stellen Meinungsäußerungen auf Basis der
        dokumentierten Methodik dar, keine Tatsachenbehauptungen über einzelne
        Hersteller, und ersetzen keine medizinische, ernährungswissenschaftliche
        oder behördliche Beratung.
      </p>
    </main>
  );
}
