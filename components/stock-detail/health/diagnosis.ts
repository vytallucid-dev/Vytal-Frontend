/**
 * Diagnosis-sentence + interpretation generators for the Health tab.
 *
 * These are NOT fabricated data — every clause is derived from real scored
 * fields (band, divergence high/low pillars, trajectory marker, pillar
 * subtotals, native-zone position). Turning real numbers into an editorial
 * read is the product's whole job; inventing numbers is not.
 */

import type {
  VerdictSection,
  PillarView,
  PillarKey,
  LabelBand,
  SectorClass,
  NativeZone,
} from "@/types/health";

export interface Segment {
  text: string;
  bold?: boolean;
}

const BAND_WORD: Record<LabelBand, string> = {
  fragile: "Fragile",
  below_par: "Below par",
  steady: "Steady",
  healthy: "Healthy",
  pristine: "Pristine",
};

/** Short noun for each pillar, used inside prose. */
const PILLAR_NOUN: Record<PillarKey, string> = {
  foundation: "the balance sheet",
  momentum: "momentum",
  market: "price",
  ownership: "ownership",
};

const PILLAR_TITLE: Record<PillarKey, string> = {
  foundation: "Foundation",
  momentum: "Momentum",
  market: "Market",
  ownership: "Ownership",
};

/** The cinematic opener — assembled from verdict state. */
export function buildDiagnosis(
  verdict: VerdictSection,
  pillars: PillarView[],
): { segments: Segment[]; sub: string } {
  const band = verdict.label.band;
  const div = verdict.divergence;
  const traj = verdict.trajectoryMarker;
  const word = BAND_WORD[band];
  const segs: Segment[] = [];

  const hasDiv = div.flag !== "none" && !!div.high && !!div.low;
  const priceAhead =
    hasDiv &&
    div.high!.pillar === "market" &&
    (div.low!.pillar === "foundation" || div.low!.pillar === "momentum");

  if (priceAhead) {
    segs.push({ text: `${word} on the surface — but ` });
    segs.push({ text: "price has run ahead", bold: true });
    segs.push({
      text: ` of ${div.low!.pillar === "foundation" ? "the balance sheet" : "cooling momentum"}`,
    });
  } else if (hasDiv) {
    segs.push({ text: `${word} overall — ` });
    segs.push({ text: `${PILLAR_TITLE[div.high!.pillar]} leads`, bold: true });
    segs.push({ text: ` while ${PILLAR_NOUN[div.low!.pillar]} lags` });
  } else {
    segs.push({ text: `${word} — ` });
    segs.push({ text: "the parts agree with the whole", bold: true });
  }

  // Ownership pull-back, only if real and not already the named laggard.
  const own = pillars.find((p) => p.pillar === "ownership");
  const ownAlreadyNamed = hasDiv && div.low!.pillar === "ownership";
  if (own && own.state === "scored" && own.subtotal < 60 && !ownAlreadyNamed) {
    segs.push({ text: ", and " });
    segs.push({ text: "owners are stepping back", bold: true });
  }

  if (traj === "deteriorating") segs.push({ text: ", and the trend is slipping" });
  else if (traj === "improving") segs.push({ text: ", and it's strengthening" });

  segs.push({ text: "." });

  let sub: string;
  if (div.flag === "wide") sub = `The number says ${word.toLowerCase()}. The story says look closer.`;
  else if (traj === "improving") sub = "Quietly getting better, quarter on quarter.";
  else if (traj === "deteriorating") sub = "Losing a little altitude — watch the trend.";
  else sub = "An aligned read — no single pillar is carrying the rest.";

  return { segments: segs, sub };
}

/** Short floor descriptor for the ride ribbon. */
export function floorDescriptor(v: number): string {
  if (v >= 80) return "a fortress balance sheet";
  if (v >= 68) return "a solid balance sheet";
  if (v >= 60) return "an adequate floor";
  if (v >= 50) return "a thin floor";
  return "a fragile floor";
}

/**
 * Foundation-zone interpretation. The full sectorClass × zone 9-cell collapses
 * to a zone-only read today because `sectorClass` is null in the contract
 * (no backing column yet). When it lands, the archetype prefix lights up.
 */
export function foundationFloorLine(sectorClass: SectorClass, zone: NativeZone): string {
  const base: Record<NativeZone["position"], string> = {
    above_native:
      "Its floor sits above the native zone for a name of its kind — a genuinely strong balance sheet, not just a passing grade.",
    in_native:
      "Its floor sits inside the native zone for a name of its kind — typical resilience, neither a standout nor a worry.",
    below_native:
      "Its floor sits below the native zone for a name of its kind — thinner than peers of its type, so the cycle bites harder.",
  };
  const line = base[zone.position];
  return sectorClass ? `As a ${sectorClass} name — ${line}` : line;
}

/** Rank-card sub-line: best vs worst pillar by rank. */
export function rankNarrative(
  perPillarRank: Record<PillarKey, { rank: number; outOf: number }>,
): { bestPillar: PillarKey; worstPillar: PillarKey } | null {
  const entries = Object.entries(perPillarRank) as [PillarKey, { rank: number; outOf: number }][];
  if (entries.length < 2) return null;
  let best = entries[0];
  let worst = entries[0];
  for (const e of entries) {
    if (e[1].rank < best[1].rank) best = e;
    if (e[1].rank > worst[1].rank) worst = e;
  }
  if (best[0] === worst[0]) return null;
  return { bestPillar: best[0], worstPillar: worst[0] };
}

export { PILLAR_TITLE };
