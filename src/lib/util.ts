import { createHash, randomUUID } from "node:crypto";

export * from "./shared";

export const sha256 = (input: string) =>
  createHash("sha256").update(input).digest("hex");

export const uuid = () => randomUUID();

/** "2026-06" — Schlüssel für das monatliche KI-Budget */
export const monthKey = (d = new Date()) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
