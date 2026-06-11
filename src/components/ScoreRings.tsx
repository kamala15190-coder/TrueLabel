"use client";

import { useEffect, useRef, useState } from "react";
import { scoreColor } from "@/lib/shared";
import type { Scores } from "@/lib/types";

// ============================================================
// Das Signaturelement: drei konzentrische Ringe (Health außen,
// Eco Mitte, Social innen) — animiert beim Erscheinen, Tap/Hover
// auf einen Ring zeigt den Einzelscore im Zentrum.
// ============================================================

const RINGS = [
  { key: "health" as const, r: 100, label: "Gesundheit" },
  { key: "eco" as const, r: 80, label: "Umwelt" },
  { key: "social" as const, r: 60, label: "Soziales" },
];

export function ScoreRings({
  scores,
  size = 236,
  interactive = true,
}: {
  scores: Scores;
  size?: number;
  interactive?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [focus, setFocus] = useState<null | (typeof RINGS)[number]["key"]>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Doppel-RAF: Transition läuft sicher nach dem ersten Paint
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setMounted(true))
    );
    return () => cancelAnimationFrame(raf);
  }, []);

  const focused = focus ? RINGS.find((r) => r.key === focus)! : null;
  const centerScore = focused ? scores[focused.key].score : scores.total;
  const centerLabel = focused ? focused.label : "Gesamt";
  const centerColor = focused ? scoreColor(centerScore) : undefined;

  const touch = (key: (typeof RINGS)[number]["key"]) => {
    if (!interactive) return;
    setFocus(key);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setFocus(null), 1800);
  };

  return (
    <div className="rings" style={{ width: size, height: size }}>
      <svg viewBox="0 0 236 236">
        {RINGS.map(({ key, r }) => {
          const c = 2 * Math.PI * r;
          const score = scores[key].score;
          const color = scoreColor(score);
          const width = focus === key ? 17 : 14;
          return (
            <g key={key}>
              <circle className="ring-track" cx="118" cy="118" r={r} strokeWidth={width} />
              <circle
                className="ring-arc"
                cx="118"
                cy="118"
                r={r}
                strokeWidth={width}
                style={{ stroke: color, color, cursor: interactive ? "pointer" : undefined }}
                strokeDasharray={c}
                strokeDashoffset={mounted ? c * (1 - score / 100) : c}
                onMouseEnter={() => interactive && setFocus(key)}
                onMouseLeave={() => interactive && setFocus(null)}
                onClick={() => touch(key)}
              />
            </g>
          );
        })}
      </svg>
      <div className="rings-center">
        <div
          className="big tnum"
          style={{ fontSize: size * 0.22, color: centerColor }}
        >
          {centerScore}
        </div>
        <div className="cap">{centerLabel}</div>
        <div className="micro t3">von 100</div>
      </div>
    </div>
  );
}

export function RingLegend({ scores }: { scores: Scores }) {
  return (
    <div className="ring-legend">
      <span>
        <i style={{ background: scoreColor(scores.health.score) }} /> Gesundheit
      </span>
      <span>
        <i style={{ background: scoreColor(scores.eco.score) }} /> Umwelt
      </span>
      <span>
        <i style={{ background: scoreColor(scores.social.score) }} /> Soziales
      </span>
    </div>
  );
}

/** Ein einzelner Ring (Score-Detail-Ansichten). */
export function SingleRing({ score, size = 150 }: { score: number; size?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    return () => cancelAnimationFrame(raf);
  }, []);
  const r = 100;
  const c = 2 * Math.PI * r;
  const color = scoreColor(score);
  return (
    <div className="rings" style={{ width: size, height: size }}>
      <svg viewBox="0 0 236 236">
        <circle className="ring-track" cx="118" cy="118" r={r} strokeWidth={18} />
        <circle
          className="ring-arc"
          cx="118"
          cy="118"
          r={r}
          strokeWidth={18}
          style={{ stroke: color, color }}
          strokeDasharray={c}
          strokeDashoffset={mounted ? c * (1 - score / 100) : c}
        />
      </svg>
      <div className="rings-center">
        <div className="big tnum" style={{ fontSize: size * 0.27 }}>{score}</div>
        <div className="micro t3">von 100</div>
      </div>
    </div>
  );
}

/** Mini-Ring für Listen. */
export function MiniRing({ score, size = 46 }: { score: number; size?: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const color = scoreColor(score);
  return (
    <div className="mini-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 46 46" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="23" cy="23" r={r} fill="none" stroke="#eaf1e6" strokeWidth="3.5" />
        <circle
          cx="23"
          cy="23"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <b style={{ color }}>{score}</b>
    </div>
  );
}
