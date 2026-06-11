// Kuratiertes Zutaten-Wissen für die Detail-Ansicht (client-safe).
// Bewusst ehrlich: nur belegbare Kernaussagen, kein erfundenes Lexikon.

export interface IngredientInfo {
  title: string;
  category: string;
  text: string;
  positives: string[];
  negatives: string[];
  allergen?: string;
}

interface Entry {
  pattern: RegExp;
  info: IngredientInfo;
}

const KNOWN: Entry[] = [
  {
    pattern: /hafer/i,
    info: {
      title: "Hafer",
      category: "Getreide",
      text: "Vollkorngetreide mit besonders hohem Anteil an löslichen Ballaststoffen (Beta-Glucan). Eine der nährstoffreichsten heimischen Getreidesorten.",
      positives: ["Senkt nachweislich den LDL-Cholesterinspiegel", "Lang anhaltende Sättigung, niedriger glykämischer Index"],
      negatives: ["Enthält von Natur aus Gluten (Avenin) — relevant bei Zöliakie"],
      allergen: "Gluten",
    },
  },
  {
    pattern: /weizen|hartweizen|weizenmehl|grieß/i,
    info: {
      title: "Weizen",
      category: "Getreide",
      text: "Das weltweit meistangebaute Brotgetreide. Vollkornvarianten liefern deutlich mehr Ballaststoffe und Mikronährstoffe als Auszugsmehl.",
      positives: ["Guter Energie- und Proteinlieferant", "Vollkorn: B-Vitamine und Ballaststoffe"],
      negatives: ["Enthält Gluten", "Auszugsmehl: schnelle Blutzuckerspitzen"],
      allergen: "Gluten",
    },
  },
  {
    pattern: /zucker(?!kulör)|saccharose/i,
    info: {
      title: "Zucker",
      category: "Süßungsmittel",
      text: "Haushaltszucker (Saccharose). Die WHO empfiehlt, freie Zucker auf unter 10 % der Energiezufuhr zu begrenzen — besser unter 5 %.",
      positives: [],
      negatives: ["Fördert Karies", "Hoher Konsum begünstigt Übergewicht und Stoffwechselerkrankungen"],
    },
  },
  {
    pattern: /rohrzucker/i,
    info: {
      title: "Rohrzucker",
      category: "Süßungsmittel",
      text: "Zucker aus Zuckerrohr. Ernährungsphysiologisch praktisch identisch mit Rübenzucker — sozial relevant ist die Lieferkette (Anbauländer).",
      positives: [],
      negatives: ["Gleiche gesundheitliche Wirkung wie Haushaltszucker", "Anbau teils in Ländern mit schwachen Arbeitsrechten"],
    },
  },
  {
    pattern: /glukosesirup|glucose|fruktose|fructose|invertzucker/i,
    info: {
      title: "Glukose-/Fruktosesirup",
      category: "Süßungsmittel",
      text: "Industriell hergestellte Zuckersirupe, typisch für hochverarbeitete Lebensmittel.",
      positives: [],
      negatives: ["Marker für starke Verarbeitung (UPF)", "Hohe Fruktoselasten belasten den Leberstoffwechsel"],
    },
  },
  {
    pattern: /palmöl|palmfett/i,
    info: {
      title: "Palmöl",
      category: "Pflanzenfett",
      text: "Das meistproduzierte Pflanzenöl der Welt. Hocheffizient im Anbau, aber Haupttreiber von Regenwaldabholzung in Südostasien.",
      positives: ["Hitzestabil, geschmacksneutral"],
      negatives: ["Hoher Anteil gesättigter Fettsäuren", "Anbau zerstört Regenwald und Artenvielfalt", "Lieferketten mit dokumentierten Arbeitsrechtsverletzungen"],
    },
  },
  {
    pattern: /kakaomasse|kakaopulver|kakao(?!butter)/i,
    info: {
      title: "Kakao",
      category: "Rohstoff",
      text: "Basis von Schokolade, überwiegend aus Westafrika. Reich an Flavanolen — sozial aber ein Hochrisiko-Rohstoff.",
      positives: ["Flavanole können die Gefäßfunktion unterstützen (v. a. dunkle Schokolade)"],
      negatives: ["Dokumentiertes Risiko von Kinderarbeit in der Lieferkette — auf Fairtrade-Siegel achten"],
    },
  },
  {
    pattern: /kakaobutter/i,
    info: {
      title: "Kakaobutter",
      category: "Pflanzenfett",
      text: "Das Fett der Kakaobohne, verantwortlich für den Schmelz von Schokolade.",
      positives: ["Natürliches Fett ohne Transfette"],
      negatives: ["Energiedicht", "Gleiche Lieferketten-Risiken wie Kakao"],
    },
  },
  {
    pattern: /milchpulver|magermilch|vollmilch|molke/i,
    info: {
      title: "Milchbestandteile",
      category: "Tierisches Produkt",
      text: "Milch, Milchpulver oder Molkenerzeugnisse — liefern Protein und Calcium, enthalten Laktose.",
      positives: ["Calcium- und Proteinquelle"],
      negatives: ["Nicht vegan", "Enthält Laktose"],
      allergen: "Milch",
    },
  },
  {
    pattern: /meersalz|salz|speisesalz/i,
    info: {
      title: "Salz",
      category: "Würzmittel",
      text: "Die DGE empfiehlt maximal 6 g Salz pro Tag. Verarbeitete Lebensmittel sind die Hauptquelle versteckten Salzes.",
      positives: ["Jodiertes Salz trägt zur Jodversorgung bei"],
      negatives: ["Hoher Konsum erhöht den Blutdruck"],
    },
  },
  {
    pattern: /sonnenblumenöl/i,
    info: {
      title: "Sonnenblumenöl",
      category: "Pflanzenöl",
      text: "Verbreitetes Pflanzenöl mit hohem Anteil ungesättigter Fettsäuren, häufig aus europäischem Anbau.",
      positives: ["Reich an Vitamin E", "Überwiegend ungesättigte Fettsäuren"],
      negatives: ["Hocherhitzt entstehen unerwünschte Oxidationsprodukte"],
    },
  },
  {
    pattern: /rapsöl/i,
    info: {
      title: "Rapsöl",
      category: "Pflanzenöl",
      text: "Heimisches Öl mit ernährungsphysiologisch günstigem Fettsäureprofil.",
      positives: ["Gutes Omega-3/Omega-6-Verhältnis", "Regionaler Anbau, kurze Wege"],
      negatives: [],
    },
  },
  {
    pattern: /erdnüsse|erdnuss/i,
    info: {
      title: "Erdnüsse",
      category: "Hülsenfrucht",
      text: "Botanisch eine Hülsenfrucht. Nährstoffdicht, aber eines der stärksten Allergene.",
      positives: ["Viel Protein und ungesättigte Fette", "Magnesium- und Niacinquelle"],
      negatives: ["Starkes Allergen — schon Spuren können reagieren"],
      allergen: "Erdnüsse",
    },
  },
  {
    pattern: /haselnuss|haselnüsse/i,
    info: {
      title: "Haselnüsse",
      category: "Schalenfrucht",
      text: "Nährstoffreiche Nuss, Großteil der Weltproduktion stammt aus der Türkei — dort sind Erntebedingungen sozial umstritten.",
      positives: ["Vitamin E, ungesättigte Fettsäuren"],
      negatives: ["Allergen", "Lieferkette teils mit Saisonarbeits-Risiken"],
      allergen: "Schalenfrüchte",
    },
  },
  {
    pattern: /vanille|bourbon/i,
    info: {
      title: "Vanille",
      category: "Gewürz",
      text: "Eines der teuersten Gewürze der Welt, überwiegend aus Madagaskar — kleinbäuerliche Strukturen, volatile Preise.",
      positives: ["Natürliches Aroma statt synthetischem Vanillin"],
      negatives: ["Soziale Risiken in der Lieferkette ohne Fair-Zertifizierung"],
    },
  },
  {
    pattern: /koffein/i,
    info: {
      title: "Koffein",
      category: "Stimulans",
      text: "Anregender Wirkstoff. EFSA: bis 400 mg/Tag für gesunde Erwachsene unbedenklich — Kinder sollten koffeinhaltige Getränke meiden.",
      positives: ["Kurzfristig erhöhte Aufmerksamkeit"],
      negatives: ["Für Kinder und Schwangere ungeeignet", "Kann Schlaf beeinträchtigen"],
    },
  },
  {
    pattern: /aroma/i,
    info: {
      title: "Aromen",
      category: "Zusatz",
      text: "Sammelbegriff — „natürliches Aroma“ muss aus natürlichen Quellen stammen, sagt aber nichts über das Lebensmittel selbst aus.",
      positives: [],
      negatives: ["Häufig Marker für stärkere Verarbeitung"],
    },
  },
  {
    pattern: /joghurtkulturen|milchsäurebakterien/i,
    info: {
      title: "Joghurtkulturen",
      category: "Mikroorganismen",
      text: "Lebende Milchsäurebakterien, die Milch zu Joghurt fermentieren.",
      positives: ["Fermentation baut einen Teil der Laktose ab", "Können die Darmflora unterstützen"],
      negatives: [],
    },
  },
  {
    pattern: /wasser/i,
    info: {
      title: "Wasser",
      category: "Basis",
      text: "Hauptbestandteil vieler Getränke und Drinks.",
      positives: ["Unbedenklich"],
      negatives: [],
    },
  },
  {
    pattern: /kartoffel/i,
    info: {
      title: "Kartoffeln",
      category: "Gemüse",
      text: "Heimisches Grundnahrungsmittel — die Verarbeitung (z. B. Frittieren) bestimmt den Gesundheitswert.",
      positives: ["Kalium, Vitamin C, regional verfügbar"],
      negatives: ["Frittiert: hohe Fett- und Acrylamidwerte"],
    },
  },
];

const E_NUMBER = /E\s?(\d{3}[a-eA-E]?)/;

export function lookupIngredient(name: string): IngredientInfo {
  for (const entry of KNOWN) {
    if (entry.pattern.test(name)) return entry.info;
  }
  const e = E_NUMBER.exec(name);
  if (e) {
    return {
      title: name,
      category: "Zusatzstoff",
      text: `Lebensmittelzusatzstoff E ${e[1]}. Details und Risikoeinstufung findest du im Gesundheits-Score unter „Zusatzstoffe“.`,
      positives: [],
      negatives: [],
    };
  }
  return {
    title: name,
    category: "Zutat",
    text: "Zu dieser Zutat liegen noch keine redaktionellen Informationen vor. Unsere Wissensbasis wächst mit jeder Community-Korrektur.",
    positives: [],
    negatives: [],
  };
}
