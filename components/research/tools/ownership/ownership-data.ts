/**
 * Ownership interpretation — all derived from the OBSERVED holding split + pledge
 * (from share counts). The flow trend fields are null in the data, so "who's
 * accumulating / distributing" comes from period-over-period holding deltas.
 *
 * LOCKED spec encoded here:
 *  • the stacked holding split is the hero — no permanent Foundation line;
 *  • the floor-check fires ONLY on genuine flow/floor divergence and funnels to
 *    Divergence (flow-vs-fundamentals IS a divergence — linked, never re-plotted);
 *  • insider / block lanes are dormant ("pending feed"), never faked.
 */

import { shortPeriod } from "@/components/stock-detail/health/shared";
import type {
  OwnershipSeriesView,
  OwnershipSeriesPoint,
  OwnershipAnatomy,
  PledgingPoint,
  OwnershipTell,
  InsiderEvent,
  BlockEvent,
} from "@/types/research-tools";
import type { ChipSpec, PromotedRead } from "../tool-frame.types";

/** The four stacked lanes, bottom→top, on ownership/pillar tokens (matching the
 *  prototype: promoter gold, FII blue, DII violet, retail grey). */
export const HOLD_LANES: {
  key: "promoter" | "fii" | "dii" | "retail";
  label: string;
  color: string;
}[] = [
  { key: "promoter", label: "Promoter", color: "var(--p-mkt)" },
  { key: "fii", label: "FII", color: "var(--p-found)" },
  { key: "dii", label: "DII", color: "var(--p-mom)" },
  { key: "retail", label: "Retail", color: "var(--ink3)" },
];

export interface HoldingPoint {
  period: string;
  asOnDate: string;
  promoter: number;
  fii: number;
  dii: number;
  retail: number;
  pledgedPctOfPromoter: number | null;
}

const r1n = (x: number) => Math.round(x * 10) / 10;

/** Score periods that have a point-in-time holding split → the chart's points. */
export function buildHoldingPoints(series: OwnershipSeriesPoint[]): HoldingPoint[] {
  return series
    .filter((p) => p.holding != null)
    .map((p) => {
      const h = p.holding!;
      return {
        period: shortPeriod(p.periodKey),
        asOnDate: h.asOnDate,
        promoter: r1n(h.promoterPct ?? 0),
        fii: r1n(h.fiiPct ?? 0),
        dii: r1n(h.diiPct ?? 0),
        retail: r1n(h.retailPct ?? 0),
        pledgedPctOfPromoter: h.pledgedPctOfPromoter,
      };
    });
}

export const inst = (p: HoldingPoint) => r1n(p.fii + p.dii);

export interface FlowDeltas {
  inst: number;
  fii: number;
  dii: number;
  promoter: number;
  retail: number;
}

/** Window flow deltas (last − first across the holding points). */
export function windowDeltas(points: HoldingPoint[]): FlowDeltas {
  if (points.length < 2) return { inst: 0, fii: 0, dii: 0, promoter: 0, retail: 0 };
  const a = points[0];
  const b = points[points.length - 1];
  return {
    inst: r1n(inst(b) - inst(a)),
    fii: r1n(b.fii - a.fii),
    dii: r1n(b.dii - a.dii),
    promoter: r1n(b.promoter - a.promoter),
    retail: r1n(b.retail - a.retail),
  };
}

/** The institutional flow word from the window delta. */
export function flowTellOf(d: FlowDeltas): OwnershipTell {
  const EPS = 2;
  if (d.inst >= EPS) return "accumulation";
  if (d.inst <= -EPS) return "distribution";
  if (Math.abs(d.fii) >= EPS && Math.sign(d.fii) !== Math.sign(d.dii)) return "rotation";
  return "flat";
}

const signed = (x: number) => `${x > 0 ? "+" : ""}${x.toFixed(1)}`;

/** "Who moved" — the institutional narrative from FII/DII deltas. */
export function whoMoved(d: FlowDeltas): string {
  const fiiUp = d.fii > 0.5;
  const fiiDn = d.fii < -0.5;
  const diiUp = d.dii > 0.5;
  const diiDn = d.dii < -0.5;
  if (fiiUp && diiUp) return `FII and DII both added (${signed(d.fii)} / ${signed(d.dii)}pp) — aligned institutional buying.`;
  if (fiiDn && diiDn) return `FII and DII both reduced (${signed(d.fii)} / ${signed(d.dii)}pp) — a one-way institutional exit.`;
  if (fiiUp && diiDn) return `FII added (${signed(d.fii)}) while DII trimmed (${signed(d.dii)}) — a rotation, net institutional share ${signed(d.inst)}pp.`;
  if (fiiDn && diiUp) return `DII picked up (${signed(d.dii)}) what FII trimmed (${signed(d.fii)}) — a rotation, net institutional share ${signed(d.inst)}pp.`;
  return `Institutional share barely moved (${signed(d.inst)}pp) — no notable flow this window.`;
}

// ── pledge state ────────────────────────────────────────────────────────────────

export interface PledgeState {
  pledged: boolean;
  pct: number | null; // % of promoter holding (from share counts)
  r1: boolean;
}

export function pledgeStateOf(anatomy: OwnershipAnatomy | null): PledgeState {
  const pct = anatomy?.holding?.pledgedPctOfPromoter ?? null;
  return { pledged: pct != null && pct > 0, pct, r1: anatomy?.r1Fired ?? false };
}

// ── floor-check (fires ONLY on genuine flow/floor divergence) ────────────────────

const FLOOR_WEAK = 60;
const FLOOR_STRONG = 68;
const FLOOR_INST_EPS = 3; // net institutional pp move over the window to count

export interface FloorCheck {
  tone: "pos" | "neg" | "warn";
  kicker: string;
  text: string;
}

/** Returns a fired floor-check, or null for ordinary rotation / aligned flow. */
export function floorCheck(foundation: number | null, instDelta: number): FloorCheck | null {
  if (foundation == null) return null;
  const acc = instDelta >= FLOOR_INST_EPS;
  const dist = instDelta <= -FLOOR_INST_EPS;
  if (!acc && !dist) return null; // ordinary rotation / flat — does NOT fire
  const f = foundation.toFixed(0);
  if (acc && foundation < FLOOR_WEAK)
    return {
      tone: "pos",
      kicker: "Floor check · accumulation under a weak floor",
      text: `Institutions added ${signed(instDelta)}pp while the Foundation is weak (${f}) — the conviction configuration: smart money building under weakness.`,
    };
  if (dist && foundation < FLOOR_WEAK)
    return {
      tone: "neg",
      kicker: "Floor check · distribution under a weak floor",
      text: `Institutions reduced ${signed(instDelta)}pp while the Foundation is weak (${f}) — flow and fundamentals point the same way: down.`,
    };
  if (dist && foundation >= FLOOR_STRONG)
    return {
      tone: "warn",
      kicker: "Floor check · exit under strength",
      text: `Institutions reduced ${signed(instDelta)}pp while the Foundation is strong (${f}) — smart money leaving a business the numbers still rate. Worth understanding why.`,
    };
  return null; // accumulation under strength = benign; mid floor = no genuine divergence
}

// ── promoted read + chips ────────────────────────────────────────────────────────

export function buildOwnershipRead(
  anatomy: OwnershipAnatomy | null,
  deltas: FlowDeltas,
  pledge: PledgeState,
  fc: FloorCheck | null,
  hasScoredPeriod = true,
): PromotedRead {
  // No scored period — read the OBSERVED holding flow only. No R1 verdict (the engine
  // hasn't run), no floor-check / ownership-grade language. An honest flow-from-holding
  // read with a note that the score-derived layer isn't available yet.
  if (!hasScoredPeriod) {
    const tell = flowTellOf(deltas);
    const head: Record<OwnershipTell, { tone: PromotedRead["tone"]; title: string }> = {
      pledge_r1: { tone: "neutral", title: "Ownership ledger" },
      pledge_high: { tone: "neutral", title: "Ownership ledger" },
      accumulation: { tone: "rec", title: "Institutions accumulating." },
      distribution: { tone: "high", title: "Institutions distributing." },
      rotation: { tone: "ctx", title: "An orderly rotation." },
      flat: { tone: "neutral", title: pledge.pledged ? "Steady ownership, some pledging." : "Steady ownership." },
    };
    const h = head[tell];
    const pledgeTail =
      pledge.pledged && pledge.pct != null ? ` Promoter pledging at ${pledge.pct.toFixed(0)}% of holding.` : "";
    return {
      tone: h.tone,
      title: h.title,
      body: whoMoved(deltas) + pledgeTail,
      note: "Read from the reported holding split — this stock has no scored ownership period yet, so the ownership grade and floor-check aren't available.",
    };
  }

  // R1 pledge is the loudest read.
  if (pledge.r1) {
    return {
      tone: "crit",
      title: "Promoter pledge is firing.",
      body: `${pledge.pct != null ? `${pledge.pct.toFixed(0)}% of promoter holding is pledged` : "Promoter pledging crossed its mark"} — the R1 red flag. A conviction tell from the people closest to the business; read it before the rest of the picture follows.`,
      note: "Pledge is a financing-stress signal, not a sell call.",
    };
  }
  const tell = flowTellOf(deltas);
  if (fc && fc.tone === "neg") {
    return { tone: "high", title: "Distribution into a weak floor.", body: fc.text };
  }
  if (fc && fc.tone === "warn") {
    return { tone: "high", title: "Institutions stepping back from a sound business.", body: fc.text };
  }
  if (fc && fc.tone === "pos") {
    return { tone: "rec", title: "Smart money accumulating under weakness.", body: fc.text };
  }
  if (tell === "accumulation") {
    return { tone: "rec", title: "Institutions accumulating.", body: whoMoved(deltas) + " A constructive flow, against the business's own floor." };
  }
  if (tell === "distribution") {
    return { tone: "high", title: "Institutions distributing.", body: whoMoved(deltas) + " A flow tell to understand before acting." };
  }
  if (tell === "rotation") {
    return { tone: "ctx", title: "An orderly rotation, not a distribution.", body: whoMoved(deltas) + " Total institutional share is roughly held — no stress, no exit." };
  }
  return {
    tone: "neutral",
    title: pledge.pledged ? "Steady ownership, some pledging." : "Steady ownership.",
    body: pledge.pledged
      ? `${pledge.pct != null ? `${pledge.pct.toFixed(0)}% of promoter holding pledged` : "Promoter holding partly pledged"}, but ${whoMoved(deltas).toLowerCase()}`
      : `No promoter pledging, and ${whoMoved(deltas).toLowerCase()}`,
  };
}

export function buildOwnershipChips(
  anatomy: OwnershipAnatomy | null,
  deltas: FlowDeltas,
  pledge: PledgeState,
  hasScoredPeriod = true,
): ChipSpec[] {
  const chips: ChipSpec[] = [];
  // The ownership GRADE chip is score-derived — only show it with a scored period
  // (otherwise `finalOwnership` is a synthesized 0, which would read as a fake score).
  if (anatomy && hasScoredPeriod) {
    chips.push({ label: `Ownership ${anatomy.finalOwnership.toFixed(0)}`, dot: "var(--p-own)", color: "var(--ink2)" });
  }
  if (pledge.pledged) {
    chips.push({
      label: `Pledge ${pledge.pct != null ? pledge.pct.toFixed(0) : "?"}% of promoter`,
      color: pledge.r1 ? "var(--crit)" : "var(--high)",
    });
  } else {
    chips.push({ label: "No pledging", color: "var(--ink3)" });
  }
  const tell = flowTellOf(deltas);
  const TELL_CHIP: Record<OwnershipTell, { label: string; color: string }> = {
    pledge_r1: { label: "Pledge R1", color: "var(--crit)" },
    pledge_high: { label: "High pledging", color: "var(--high)" },
    accumulation: { label: "Accumulation", color: "var(--rec)" },
    distribution: { label: "Distribution", color: "var(--crit)" },
    rotation: { label: "Rotation", color: "var(--ctx)" },
    flat: { label: "Steady", color: "var(--ink3)" },
  };
  chips.push(TELL_CHIP[tell]);
  return chips;
}

// ── events ledger (live strata + dormant lanes) ──────────────────────────────────

export interface LedgerEvent {
  when: string;
  text: string;
  tone: "pos" | "neg" | "mod";
  lane: "pledge" | "shareholding";
}

export interface DormantLane {
  name: string;
  note: string;
}

// Re-export so ownership-summary can use these without a separate import
export type { InsiderEvent, BlockEvent };

export function buildLedger(view: OwnershipSeriesView): {
  live: LedgerEvent[];
  dormant: DormantLane[];
  insider: InsiderEvent[];
  block: BlockEvent[];
} {
  const live: LedgerEvent[] = [];

  // ── pledge lane (LIVE) ──
  const pl = view.pledging.filter((p) => p.pledgedPctOfPromoter != null);
  let prevPct: number | null = null;
  for (const p of pl) {
    const pct = p.pledgedPctOfPromoter!;
    if (prevPct == null || prevPct === 0) {
      if (pct > 0) live.push({ when: p.asOnDate, text: `Promoter pledge appeared — ${pct.toFixed(1)}% of promoter holding`, tone: "neg", lane: "pledge" });
    } else if (pct - prevPct >= 3) {
      live.push({ when: p.asOnDate, text: `Pledge rose to ${pct.toFixed(1)}% of promoter holding`, tone: "neg", lane: "pledge" });
    } else if (prevPct - pct >= 3) {
      live.push({ when: p.asOnDate, text: `Pledge eased to ${pct.toFixed(1)}% of promoter holding`, tone: "pos", lane: "pledge" });
    }
    prevPct = pct;
  }
  if (view.current?.r1Fired) {
    live.push({ when: view.current.asOfDate, text: "R1 pledge red flag firing — pledge above its mark", tone: "neg", lane: "pledge" });
  }
  if (live.filter((e) => e.lane === "pledge").length === 0) {
    live.push({ when: view.current?.asOfDate ?? "", text: "No promoter pledging in the window", tone: "pos", lane: "pledge" });
  }

  // ── shareholding lane (LIVE) — notable institutional moves over the window ──
  const points = buildHoldingPoints(view.series);
  if (points.length >= 2) {
    const a = points[0];
    const b = points[points.length - 1];
    const moves: { lane: string; from: number; to: number }[] = [
      { lane: "FII", from: a.fii, to: b.fii },
      { lane: "DII", from: a.dii, to: b.dii },
      { lane: "Retail", from: a.retail, to: b.retail },
      { lane: "Promoter", from: a.promoter, to: b.promoter },
    ];
    for (const m of moves) {
      const d = r1n(m.to - m.from);
      if (Math.abs(d) >= 2) {
        live.push({
          when: b.asOnDate,
          text: `${m.lane} ${d > 0 ? "rose" : "fell"} ${m.from.toFixed(1)} → ${m.to.toFixed(1)} (${signed(d)}pp)`,
          tone: m.lane === "Retail" ? "mod" : d > 0 && (m.lane === "FII" || m.lane === "DII") ? "pos" : "neg",
          lane: "shareholding",
        });
      }
    }
    if (!live.some((e) => e.lane === "shareholding")) {
      live.push({ when: b.asOnDate, text: "Holding split broadly unchanged over the window", tone: "mod", lane: "shareholding" });
    }
  }

  // C_insider and D_block are now live event lanes — no dormant entries for them.
  // Any future genuinely-dormant categories would appear here if added to DORMANT_META.
  const dormant: DormantLane[] = [];

  return { live, dormant, insider: view.events.insider, block: view.events.block };
}
