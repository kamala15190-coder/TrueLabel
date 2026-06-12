// Isomorphe Helfer — ohne Node-Abhängigkeiten, auch im Client nutzbar.

export const clamp = (v: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Math.round(v)));

export function scoreGrade(score: number): "good" | "medium" | "bad" {
  return score >= 70 ? "good" : score >= 40 ? "medium" : "bad";
}

export function scoreColor(score: number): string {
  return score >= 70 ? "#22C55E" : score >= 40 ? "#F59E0B" : "#EF4444";
}

export function scoreWord(score: number): string {
  if (score >= 85) return "Hervorragend";
  if (score >= 70) return "Sehr gut";
  if (score >= 55) return "Gut";
  if (score >= 40) return "Mittel";
  if (score >= 25) return "Schwach";
  return "Schlecht";
}

/** Deutsche Zahlformatierung: 1.2 -> "1,2" */
export const de = (n: number | undefined, digits = 1): string =>
  n == null ? "—" : n.toLocaleString("de-DE", { maximumFractionDigits: digits });

/** Nährwert-Anzeige mit passender Einheit (kcal, g, oder Mikro g/mg/µg). */
export function fmtNutri(v: number, kind: "kcal" | "macro" | "micro"): string {
  if (kind === "kcal") return `${de(v, 0)} kcal`;
  if (kind === "macro") return `${de(v, v < 1 ? 2 : 1)} g`;
  if (v >= 1) return `${de(v)} g`;
  if (v >= 0.001) return `${de(v * 1000)} mg`;
  return `${de(v * 1_000_000, 0)} µg`;
}
