import type { Metadata } from "next";
import { BackBar } from "@/components/BackBar";

export const metadata: Metadata = { title: "Nutzungsbedingungen" };

export default function AgbPage() {
  return (
    <main className="page no-nav prose">
      <BackBar title="Nutzungsbedingungen" />
      <h1 className="h-l mb16">Nutzungsbedingungen</h1>
      <p>Stand: Juni 2026</p>

      <h2>1. Geltungsbereich und Anbieter</h2>
      <p>
        Diese Bedingungen gelten für die Nutzung der App „TrueLabel“ (Web-App und
        installierbare PWA), betrieben von <span className="ph">[VOR- UND NACHNAME]</span>,{" "}
        <span className="ph">[ANSCHRIFT]</span> („wir“). Abweichende Bedingungen
        des Nutzers finden keine Anwendung.
      </p>

      <h2>2. Leistungsbeschreibung</h2>
      <p>
        TrueLabel zeigt zu Lebensmitteln algorithmisch berechnete Bewertungen in
        den Dimensionen Gesundheit, Umwelt und Soziales („Scores“), basierend auf
        öffentlich verfügbaren Daten (u. a. OpenFoodFacts), eigenen Datensätzen
        und Community-Beiträgen. Die Kernfunktionen — unbegrenztes Scannen,
        Suche, Verlauf, Community-Beiträge — sind dauerhaft kostenlos und
        werbefrei.
      </p>

      <h2>3. Scores sind Einschätzungen</h2>
      <p>
        <strong>Die Scores sind automatisiert berechnete Einschätzungen auf Basis der
        dokumentierten Methodik — keine medizinische, ernährungswissenschaftliche
        oder behördliche Beratung und keine Tatsachenbehauptung über einzelne
        Hersteller.</strong> Produktdaten können unvollständig, veraltet oder fehlerhaft
        sein. Verlasse dich bei Allergien und Unverträglichkeiten ausschließlich
        auf die Angaben auf der Produktverpackung. Eine Haftung für
        Kaufentscheidungen auf Basis der Scores ist ausgeschlossen, soweit
        gesetzlich zulässig.
      </p>

      <h2>4. Konto</h2>
      <p>
        Für einige Funktionen (Verlauf-Synchronisierung, Beiträge, Premium) ist
        ein Konto erforderlich. Du bist für die Vertraulichkeit deiner
        Zugangsdaten verantwortlich. Es besteht kein Anspruch auf ein Konto; bei
        Missbrauch (z. B. Spam, absichtliche Falschdaten) können wir Konten
        sperren oder löschen.
      </p>

      <h2>5. Community-Beiträge</h2>
      <p>
        Mit dem Einreichen von Produktdaten, Fotos oder Korrekturen räumst du uns
        ein einfaches, zeitlich und räumlich unbeschränktes Nutzungsrecht zur
        Speicherung, Bearbeitung und Veröffentlichung innerhalb von TrueLabel ein.
        Du versicherst, dass deine Beiträge keine Rechte Dritter verletzen und der
        Wahrheit entsprechen. Beiträge werden automatisiert (KI) und ggf. manuell
        geprüft; ein Anspruch auf Übernahme besteht nicht.
      </p>

      <h2>6. TrueLabel Premium</h2>
      <p>
        Premium ist ein optionales Abo (monatlich 2,49 € oder jährlich 19,99 €,
        inkl. USt.) mit Zusatzfunktionen (u. a. intelligente Alternativen,
        Produktvergleich, Einkaufsliste, Export, wissenschaftliche Quellen). Die
        Abwicklung erfolgt über Stripe. Das Abo verlängert sich automatisch um die
        gewählte Laufzeit und ist jederzeit zum Ende der laufenden Periode über
        die Abo-Verwaltung kündbar.
      </p>

      <h2>7. Widerrufsrecht</h2>
      <p>
        Verbrauchern steht ein 14-tägiges Widerrufsrecht zu. Der Widerruf ist
        formlos per E-Mail an <span className="ph">[KONTAKT-E-MAIL]</span> möglich.
        Verlangst du, dass die Leistung während der Widerrufsfrist beginnt, ist
        bei Widerruf ein anteiliger Betrag für die bereits erbrachte Leistung zu
        zahlen. Mit vollständiger Vertragserfüllung innerhalb der Frist erlischt
        das Widerrufsrecht, wenn du dem ausdrücklich zugestimmt hast.
      </p>

      <h2>8. Verfügbarkeit</h2>
      <p>
        Wir bemühen uns um hohe Verfügbarkeit, schulden aber keine bestimmte
        Verfügbarkeitsquote. Wartungen, Weiterentwicklung und Umstände außerhalb
        unserer Kontrolle können zu Unterbrechungen führen.
      </p>

      <h2>9. Haftung</h2>
      <p>
        Wir haften unbeschränkt bei Vorsatz, grober Fahrlässigkeit sowie bei
        Verletzung von Leben, Körper und Gesundheit. Bei einfacher Fahrlässigkeit
        haften wir nur für die Verletzung wesentlicher Vertragspflichten
        (Kardinalpflichten), begrenzt auf den vertragstypisch vorhersehbaren
        Schaden. Die Haftung nach dem Produkthaftungsgesetz bleibt unberührt.
        Abschnitt 3 gilt ergänzend.
      </p>

      <h2>10. Änderungen dieser Bedingungen</h2>
      <p>
        Wir können diese Bedingungen mit Wirkung für die Zukunft anpassen, wenn
        dies aufgrund neuer Funktionen, Rechtsänderungen oder Sicherheitsgründen
        erforderlich ist. Über wesentliche Änderungen informieren wir aktive
        Premium-Abonnenten per E-Mail; widersprichst du nicht innerhalb von sechs
        Wochen, gelten sie als angenommen. Auf das Widerspruchsrecht weisen wir in
        der Mitteilung hin.
      </p>

      <h2>11. Schlussbestimmungen</h2>
      <p>
        Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts; gegenüber
        Verbrauchern bleiben zwingende Verbraucherschutzvorschriften des
        Aufenthaltsstaats unberührt. Sollten einzelne Bestimmungen unwirksam sein,
        bleibt der Rest wirksam.
      </p>
    </main>
  );
}
