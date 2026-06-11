import type { ProductData, Scores } from "../types";
import { computeEco } from "./eco";
import { computeHealth } from "./health";
import { computeSocial } from "./social";

// Version hochzählen, wenn sich die Score-Logik ändert →
// gespeicherte Produkte werden beim nächsten Abruf neu bewertet.
export const SCORE_VERSION = 1;

// Gewichtung des Gesamtscores: Gesundheit ist für die Kaufentscheidung
// am unmittelbarsten, Umwelt und Soziales folgen.
const WEIGHTS = { health: 0.45, eco: 0.3, social: 0.25 };

export function computeScores(p: ProductData): Scores {
  const health = computeHealth(p);
  const eco = computeEco(p);
  const social = computeSocial(p);
  const total = Math.round(
    health.score * WEIGHTS.health + eco.score * WEIGHTS.eco + social.score * WEIGHTS.social
  );
  return { version: SCORE_VERSION, total, health, eco, social };
}
