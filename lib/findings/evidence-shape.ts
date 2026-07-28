// lib/findings/evidence-shape.ts
//
// SHAPE RESOLVER for finding evidence → the two glance-native visuals we render in Notable
// Findings: SERIES (3+ point sparkline) and MOVEMENT (2-point from→to arrow). Pure,
// deterministic, no AI, no guardrail — it only reads numbers the rules already wrote.
//
// ★ FIELD NAMES LOCATE THE NUMBERS AND ARE NEVER DISPLAYED. The finding's title carries the
// words; the visual carries the values. That is why the authoring gap is ~0 — we introduce no
// label for any internal field. Anything that doesn't resolve to a series/movement returns
// {kind:"none"} → the card renders exactly as today (honest-empty, never a broken visual).
//
// This lives BESIDE verdicts.ts on purpose: the frontend already parses these exact evidence
// blobs there to compose the verdict sentence, so shape-resolution belongs in the same layer —
// not split onto a second (backend) parser that would have to be kept in lock-step.

type Ev = Record<string, unknown>;

export type EvidenceShape =
  | { kind: "series"; points: number[]; from: number; to: number; unit: string; decimals: number }
  | { kind: "movement"; from: number; to: number; unit: string; decimals: number }
  | { kind: "none" };

const asObj = (v: unknown): Ev | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Ev) : null;
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const arr = (v: unknown): unknown[] | null => (Array.isArray(v) ? v : null);

/** Composite out of a "FY26Q1:72/healthy" trajectory string. null when unparseable. */
function trajComposite(s: unknown): number | null {
  if (typeof s !== "string") return null;
  const m = /:(-?\d+(?:\.\d+)?)\s*\//.exec(s);
  return m ? parseFloat(m[1]) : null;
}

/** Pull an ordered numeric SERIES out of the known series-bearing fields (first that resolves,
 *  nulls dropped). Requires ≥2 usable points; the caller decides sparkline vs arrow by count. */
function seriesPoints(ev: Ev): { points: number[]; unit: string; decimals: number } | null {
  const pick = (
    key: string,
    get: (p: unknown) => number | null,
    unit: string,
    decimals: number,
  ): { points: number[]; unit: string; decimals: number } | null => {
    const a = arr(ev[key]);
    if (!a) return null;
    const points = a.map(get).filter((n): n is number => n !== null);
    return points.length >= 2 ? { points, unit, decimals } : null;
  };
  return (
    pick("opmSeries", (p) => num(asObj(p)?.opm), "%", 1) ?? // P11 / P12
    pick("ttmSeries", (p) => num(asObj(p)?.ttmIC), "×", 2) ?? // R5
    pick("deHistory", (p) => num(asObj(p)?.de), "×", 2) ?? // R4
    pick("gapTrajectory", (p) => num(asObj(p)?.gap), "", 1) ?? // C-over-time
    pick("trajectory", trajComposite, "", 0) // B / D / I
  );
}

/** Pull a 2-point from→to MOVEMENT out of the known paired fields. */
function movementPair(ev: Ev): { from: number; to: number; unit: string; decimals: number } | null {
  const ch = asObj(ev.compositeHeld); // F2
  const chFrom = num(ch?.prior);
  const chTo = num(ch?.current);
  if (chFrom !== null && chTo !== null) return { from: chFrom, to: chTo, unit: "", decimals: 0 };

  const pairs: [string, string, string, number][] = [
    ["priorTtmGrowthPct", "latestTtmGrowthPct", "%", 1], // P13
    ["peakSpread", "currentSpread", "", 1], // G
    ["recentLowGap", "currentGap", "", 1], // C-over-time (when no multi-point gapTrajectory)
    ["pledgeRatioQ1", "pledgeRatioQ", "%", 1], // R1
  ];
  for (const [a, b, unit, decimals] of pairs) {
    const from = num(ev[a]);
    const to = num(ev[b]);
    if (from !== null && to !== null) return { from, to, unit, decimals };
  }
  return null;
}

/** Resolve a finding's evidence blob to its primary renderable shape. Key-agnostic (it matches
 *  on field names), so it works identically for a finding's own evidence and a consolidated
 *  sub-type's evidence. */
export function resolveEvidenceShape(evidence: unknown): EvidenceShape {
  const ev = asObj(evidence);
  if (!ev) return { kind: "none" };

  const s = seriesPoints(ev);
  if (s) {
    // A 3+ point path earns a sparkline; a 2-point path reads better as an arrow.
    if (s.points.length >= 3) {
      return {
        kind: "series",
        points: s.points,
        from: s.points[0],
        to: s.points[s.points.length - 1],
        unit: s.unit,
        decimals: s.decimals,
      };
    }
    return { kind: "movement", from: s.points[0], to: s.points[1], unit: s.unit, decimals: s.decimals };
  }

  const m = movementPair(ev);
  if (m) return { kind: "movement", ...m };

  return { kind: "none" };
}
