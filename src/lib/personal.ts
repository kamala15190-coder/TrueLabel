import type { DietPrefs, PersonalEntry, ProductData } from "./types";

// ============================================================
// Persönliche Bewertung: gleicht ein Produkt mit den
// Ernährungsprofilen des Nutzers ab.
// conflict = harter Widerspruch, note = Hinweis, match = passt.
// ============================================================

export function checkPersonal(p: ProductData, prefs: DietPrefs): PersonalEntry[] {
  const out: PersonalEntry[] = [];
  const tags = p.analysisTags;
  const al = p.allergens;
  const sugars = p.nutriments.sugars;

  if (prefs.vegan) {
    if (tags.includes("non-vegan") || al.includes("milk") || al.includes("eggs")) {
      out.push({ pref: "vegan", level: "conflict", label: "Nicht vegan", detail: "Enthält tierische Zutaten." });
    } else if (tags.includes("vegan")) {
      out.push({ pref: "vegan", level: "match", label: "Vegan", detail: "Alle Zutaten sind pflanzlich." });
    } else {
      out.push({ pref: "vegan", level: "note", label: "Vegan-Status unklar", detail: "Keine eindeutige Deklaration." });
    }
  }
  if (prefs.vegetarisch) {
    if (tags.includes("non-vegetarian")) {
      out.push({ pref: "vegetarisch", level: "conflict", label: "Nicht vegetarisch", detail: "Enthält Fleisch oder Fisch." });
    } else if (tags.includes("vegetarian") || tags.includes("vegan")) {
      out.push({ pref: "vegetarisch", level: "match", label: "Vegetarisch", detail: "Ohne Fleisch und Fisch." });
    } else {
      out.push({ pref: "vegetarisch", level: "note", label: "Vegetarisch-Status unklar", detail: "Keine eindeutige Deklaration." });
    }
  }
  if (prefs.glutenfrei) {
    if (al.includes("gluten")) {
      out.push({ pref: "glutenfrei", level: "conflict", label: "Enthält Gluten", detail: "Als Allergen deklariert. Du hast Glutenfrei aktiviert." });
    } else if (p.labels.includes("gluten-free")) {
      out.push({ pref: "glutenfrei", level: "match", label: "Glutenfrei zertifiziert", detail: "Mit Glutenfrei-Siegel." });
    } else {
      out.push({ pref: "glutenfrei", level: "note", label: "Kein Gluten deklariert", detail: "Ohne Siegel sind Spuren nicht ausgeschlossen." });
    }
  }
  if (prefs.laktosefrei) {
    if (al.includes("milk")) {
      out.push({ pref: "laktosefrei", level: "conflict", label: "Enthält Milch", detail: "Milch ist als Allergen deklariert." });
    } else {
      out.push({ pref: "laktosefrei", level: "match", label: "Ohne Milch", detail: "Keine Milch deklariert." });
    }
  }
  if (prefs.nussfrei) {
    if (al.includes("nuts") || al.includes("peanuts")) {
      out.push({ pref: "nussfrei", level: "conflict", label: "Enthält Nüsse/Erdnüsse", detail: "Als Allergen deklariert." });
    } else {
      out.push({ pref: "nussfrei", level: "match", label: "Ohne Nüsse", detail: "Keine Nüsse deklariert." });
    }
  }
  if (prefs.sojafrei) {
    if (al.includes("soybeans")) {
      out.push({ pref: "sojafrei", level: "conflict", label: "Enthält Soja", detail: "Als Allergen deklariert." });
    } else {
      out.push({ pref: "sojafrei", level: "match", label: "Ohne Soja", detail: "Kein Soja deklariert." });
    }
  }
  if (prefs.palmoelfrei) {
    if (tags.includes("palm-oil")) {
      out.push({ pref: "palmoelfrei", level: "conflict", label: "Enthält Palmöl", detail: "Du hast Palmölfrei aktiviert." });
    } else if (tags.includes("palm-oil-free")) {
      out.push({ pref: "palmoelfrei", level: "match", label: "Palmölfrei", detail: "Ohne Palmöl." });
    } else {
      out.push({ pref: "palmoelfrei", level: "note", label: "Palmöl-Status unklar", detail: "Keine eindeutige Deklaration." });
    }
  }
  if (prefs.zuckerarm) {
    if (sugars != null && sugars > 10) {
      out.push({ pref: "zuckerarm", level: "conflict", label: "Viel Zucker", detail: `${sugars.toLocaleString("de-DE")} g Zucker pro 100 g.` });
    } else if (sugars != null && sugars > 5) {
      out.push({ pref: "zuckerarm", level: "note", label: "Mäßig Zucker", detail: `${sugars.toLocaleString("de-DE")} g Zucker pro 100 g.` });
    } else if (sugars != null) {
      out.push({ pref: "zuckerarm", level: "match", label: "Zuckerarm", detail: `${sugars.toLocaleString("de-DE")} g Zucker pro 100 g.` });
    }
  }
  if (prefs.bio) {
    if (p.labels.includes("organic")) {
      out.push({ pref: "bio", level: "match", label: "Bio-zertifiziert", detail: "EU-Bio-Siegel vorhanden." });
    } else {
      out.push({ pref: "bio", level: "note", label: "Kein Bio-Siegel", detail: "Du bevorzugst Bio-Produkte." });
    }
  }
  if (prefs.fairtrade) {
    if (p.labels.includes("fairtrade") || p.labels.includes("rainforest")) {
      out.push({ pref: "fairtrade", level: "match", label: "Fair zertifiziert", detail: "Fairtrade- oder Rainforest-Siegel vorhanden." });
    } else {
      out.push({ pref: "fairtrade", level: "note", label: "Kein Fairtrade-Siegel", detail: "Du bevorzugst fair gehandelte Produkte." });
    }
  }

  const order: Record<string, number> = { conflict: 0, note: 1, match: 2 };
  return out.sort((a, b) => order[a.level] - order[b.level]);
}

/** true, wenn das Produkt einem aktiven Profil hart widerspricht. */
export function hasConflict(p: ProductData, prefs: DietPrefs): boolean {
  return checkPersonal(p, prefs).some((e) => e.level === "conflict");
}
