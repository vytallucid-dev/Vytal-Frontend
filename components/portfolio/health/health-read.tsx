"use client";

import { Icons } from "@/lib/icons";
import { PILLAR_META } from "@/components/stock-detail/health/shared";
import type { PillarKey } from "@/types/health";
import type {
  Holding,
  LensProfile,
  PillarProfile,
  PortfolioSnapshot,
} from "@/types/portfolio";
import type { PortfolioTab } from "../tabs";
import {
  DRAG_COLOR,
  POSITIVE_COLOR,
  healthColor,
  healthPatternFindings,
} from "../lib";
import {
  SIGNAL_SOURCE_META,
  activeSignals,
  type DeductionStory,
  deductionStory,
  triageFindings,
} from "./lib";
import { HealthShell, InfoTip, Tip } from "./parts";
import { FindingsBlock } from "./findings";

const FOUNDATION = "#5d92d8"; // quality-anchor blue
const pct1 = (w: number) => `${(w * 100).toFixed(1)}%`;
const r0 = (v: number) => Math.round(v);

// ── what each pillar measures — plain-language, for the hover-reveals on the pillar bars ──
const PILLAR_TIP: Record<PillarKey, string> = {
  foundation:
    "Balance-sheet strength and returns — the durable base of the business.",
  momentum:
    "Growth and earnings acceleration — whether the business is speeding up.",
  market:
    "How the market is pricing and treating the name — valuation and price behaviour.",
  ownership:
    "Ownership signals — promoter/insider conviction and institutional behaviour.",
};

// ── B2a · The two-step Health waterfall — the honest spine. Quality anchor → −active flags
//    (the ONE deduction) → = Health. NO structure term: nothing about how the book is built
//    touches this number. All heights are display arithmetic (value → px on a 0–100 scale),
//    never a recomputed score. ─────────────────────────────────────────────────────────────
function Waterfall({ b, color }: { b: DeductionStory; color: string }) {
  const q = b.quality;
  const fD = b.flagsDrag;
  const health = b.health;
  const calm = fD < 1 || b.signals >= 100;
  const H = 116; // chart height in viewBox units (= px); scale is H/100

  type Col = {
    key: string;
    label: string;
    sub: string;
    value: number;
    color: string;
    top: number;
    bottom: number;
    drag: boolean;
    calm?: boolean;
    tip: React.ReactNode;
  };
  const cols: Col[] = [
    {
      key: "anchor",
      label: `${r0(q)}`,
      sub: "quality · anchor",
      value: q,
      color: FOUNDATION,
      top: q,
      bottom: 0,
      drag: false,
      tip: (
        <>
          <span className="font-semibold text-ink">Quality {r0(q)}</span>
          <span className="mt-1 block text-ink2">
            The weighted quality of the businesses you own — the anchor the
            Health score starts from.
          </span>
        </>
      ),
    },
    {
      key: "flags",
      label: calm ? "0" : `−${r0(fD)}`,
      sub: calm ? "no active flags" : "active flags",
      value: fD,
      color: DRAG_COLOR.signal,
      top: q,
      bottom: q - fD,
      drag: true,
      calm,
      tip: calm ? (
        <>
          <span className="font-semibold text-ink">No active flags</span>
          <span className="mt-1 block text-ink2">
            No holding is firing a red flag, so nothing is deducted.
          </span>
        </>
      ) : (
        <>
          <span className="font-semibold text-ink">Active flags −{r0(fD)}</span>
          <span className="mt-1 block text-ink2">
            Active red flags across your holdings, each weighted by book size —
            the one deduction on Health.
          </span>
        </>
      ),
    },
    {
      key: "health",
      label: `${health}`,
      sub: "= health",
      value: health,
      color,
      top: health,
      bottom: 0,
      drag: false,
      tip: (
        <>
          <span className="font-semibold text-ink">Health {health}</span>
          <span className="mt-1 block text-ink2">
            Where quality lands after active flags — your Health score.
          </span>
        </>
      ),
    },
  ];
  const M = cols.length;
  const cx = (i: number) => ((i + 0.5) / M) * 100;
  const y = (level: number) => H - (level / 100) * H;

  // the descent staircase — connect the tops across the single drag
  const pts: [number, number][] = [];
  cols.forEach((c, i) => {
    if (c.drag) {
      pts.push([cx(i), y(c.top)]);
      pts.push([cx(i), y(c.bottom)]);
    } else pts.push([cx(i), y(c.top)]);
  });
  const path = pts
    .map(
      (p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`,
    )
    .join(" ");

  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-1.5">
        <p className="kicker">How your health score is built</p>
        <InfoTip>
          Health starts at your holdings&apos;{" "}
          <b className="font-semibold text-ink">quality</b> (the anchor),
          subtracts only{" "}
          <b className="font-semibold text-ink">active red flags</b>, and lands
          at your <b className="font-semibold text-ink">Health</b> score. No
          structure or coverage term enters here.
        </InfoTip>
      </div>
      <div className="relative" style={{ height: H }}>
        {/* descent connector */}
        <svg
          viewBox={`0 0 100 ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <path
            d={path}
            fill="none"
            stroke="var(--ink3)"
            strokeWidth={1}
            strokeDasharray="2.5 3"
            opacity={0.6}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* columns */}
        <div className="absolute inset-0 flex items-end">
          {cols.map((c) => {
            const hgt = Math.max(
              (c.value / 100) * H,
              c.drag ? (c.calm ? 0 : 3) : 3,
            );
            const bottomPx = (c.bottom / 100) * H;
            const anchorEdge = !c.drag;
            return (
              <div
                key={c.key}
                className="relative flex-1"
                style={{ height: H }}
              >
                {c.calm ? (
                  <div
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{ bottom: bottomPx }}
                  >
                    <Icons.check
                      weight="bold"
                      className="size-3.5"
                      style={{ color: POSITIVE_COLOR }}
                    />
                  </div>
                ) : (
                  <div
                    className="absolute left-1/2 w-[52%] -translate-x-1/2 rounded-[3px]"
                    style={{
                      bottom: bottomPx,
                      height: hgt,
                      background: c.drag
                        ? c.color
                        : `color-mix(in oklch, ${c.color} 35%, transparent)`,
                      borderTop: anchorEdge
                        ? `2px solid ${c.color}`
                        : undefined,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* labels */}
      <div className="mt-2 flex items-start">
        {cols.map((c) => (
          <Tip key={c.key} content={c.tip}>
            <div className="flex flex-1 cursor-help flex-col items-center text-center">
              <span
                className="num text-[16px] font-semibold leading-none"
                style={{ color: c.calm ? POSITIVE_COLOR : c.color }}
              >
                {c.label}
              </span>
              <span className="mt-1 text-[8.5px] uppercase leading-tight tracking-wide text-ink3">
                {c.sub}
              </span>
            </div>
          </Tip>
        ))}
      </div>

      {/* the proportional split — health vs the flags drag */}

      <div className="mt-3.5 flex h-2 cursor-default gap-0.5 overflow-hidden rounded-full">
        <div style={{ flex: Math.max(health, 0.001), background: color }} />
        {!calm && <div style={{ flex: fD, background: DRAG_COLOR.signal }} />}
      </div>

      <p className="mt-3 text-[11.5px] leading-relaxed text-ink3">
        Your businesses are <span className="num text-ink2">{r0(q)}</span>
        -healthy;{" "}
        {calm ? (
          <>no active red flags subtract anything</>
        ) : (
          <>
            active red flags subtract{" "}
            <span className="num" style={{ color: DRAG_COLOR.signal }}>
              {r0(fD)}
            </span>
          </>
        )}{" "}
        — landing at{" "}
        <span className="num" style={{ color }}>
          {health}
        </span>
        . Nothing about how you&apos;ve built the book touches this number —
        that&apos;s the Construction read.
      </p>
    </div>
  );
}

// ── B2b · pillarProfile — THE CENTREPIECE. Four horizontal bars, position-weighted across
//    the scored holdings, each in its locked pillar colour. Where the book's health comes
//    from. A characterising line derived from the shape (display arithmetic, descriptive). ──
const PILLAR_ORDER: PillarKey[] = [
  "foundation",
  "momentum",
  "market",
  "ownership",
];
const SOFT_SPOT: Record<PillarKey, string> = {
  foundation:
    "the balance-sheet and returns base is the softer spot — durable, not the driver here",
  momentum:
    "Momentum is the soft spot — sound businesses, not currently accelerating",
  market:
    "the market read is the softer spot — steady names the market isn't chasing",
  ownership: "the ownership signals are the softer spot",
};

function characterLine(pp: PillarProfile): string {
  const rows = PILLAR_ORDER.map((k) => ({ k, v: pp[k] }));
  const sorted = [...rows].sort((a, b) => b.v - a.v);
  const strong = sorted[0];
  const weak = sorted[sorted.length - 1];
  if (strong.v - weak.v < 6)
    return "Evenly balanced across all four pillars — no single source carries the book's health.";
  return `Held up by ${PILLAR_META[strong.k].label}; ${SOFT_SPOT[weak.k]}.`;
}

function PillarProfileBlock({ pp }: { pp: PillarProfile }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4 sm:p-5">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <p className="kicker flex items-center gap-1.5">
          Where your book&apos;s health comes from
          <InfoTip>
            Your book&apos;s health split into the four pillars — Foundation,
            Momentum, Market and Ownership — position-weighted across your
            scored holdings. Hover a bar for what that pillar measures.
          </InfoTip>
        </p>
        <p className="shrink-0 text-[10px] text-ink3">
          position-weighted across scored holdings
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {PILLAR_ORDER.map((k) => {
          const v = pp[k];
          const meta = PILLAR_META[k];
          return (
            <Tip
              key={k}
              content={
                <>
                  <span className="font-semibold text-ink">
                    {meta.label} {r0(v)}
                  </span>
                  <span className="mt-1 block text-ink2">{PILLAR_TIP[k]}</span>
                </>
              }
            >
              <div className="flex cursor-help items-center gap-3">
                <span className="w-[92px] shrink-0 text-[12px] text-ink2">
                  {meta.label}
                </span>
                <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(v, 1)}%`,
                      background: meta.cssVar,
                    }}
                  />
                </div>
                <span
                  className="num w-8 shrink-0 text-right text-[14px] font-semibold"
                  style={{ color: meta.cssVar }}
                >
                  {r0(v)}
                </span>
              </div>
            </Tip>
          );
        })}
      </div>
      <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-ink2">
        {characterLine(pp)}
      </p>
    </div>
  );
}

// ── B2c · lens-character — the NATURE of the fired health patterns (absolute / peer / trend),
//    weighted by share. This is a CHARACTER read of the findings, NOT a share of the score —
//    the copy never says "X% of your health is peer-relative". Rendered only when patterns
//    fired (lensProfile !== null); omitted entirely otherwise (never an empty state). ────────
const LENS_META: {
  key: keyof NonNullable<LensProfile>;
  label: string;
  color: string;
}[] = [
  { key: "absolute", label: "Absolute", color: "#4ea1e6" },
  { key: "peer", label: "Peer", color: "#4fb6a4" },
  { key: "trend", label: "Trend", color: "#a085d8" },
];

function lensCharacterLine(lp: NonNullable<LensProfile>): string {
  const durable = lp.absolute + lp.peer;
  if (lp.trend > durable)
    return "Much of your book's health is recent — resting on improvement rather than established strength.";
  return "Your book's health is the durable kind — strong on absolute and peer terms.";
}

function LensCharacterBlock({ lp }: { lp: NonNullable<LensProfile> }) {
  const segs = LENS_META.filter((m) => lp[m.key] > 0);
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="kicker flex items-center gap-1.5">
          The character of that health
          <InfoTip>
            The nature of the health patterns that fired:{" "}
            <b className="font-semibold text-ink">absolute</b> (strong on its
            own terms), <b className="font-semibold text-ink">peer</b> (strong
            versus peers) or <b className="font-semibold text-ink">trend</b>{" "}
            (improving). This describes the patterns — it is not a share of the
            score.
          </InfoTip>
        </p>
        <span className="rounded-full border border-line2 bg-surface-3 px-2 py-0.5 text-[10px] text-ink3">
          based on fired patterns
        </span>
      </div>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
        {segs.map((m) => (
          <Tip
            key={m.key}
            content={
              <>
                <span className="font-semibold text-ink">
                  {m.label} · {pct1(lp[m.key])}
                </span>
                <span className="mt-1 block text-ink2">
                  {m.key === "absolute"
                    ? "Patterns strong on the name's own terms."
                    : m.key === "peer"
                      ? "Patterns strong relative to peers."
                      : "Patterns resting on recent improvement."}
                </span>
              </>
            }
          >
            <div
              className="h-full cursor-help"
              style={{ flex: Math.max(lp[m.key], 0.001), background: m.color }}
            />
          </Tip>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink2">
        {segs.map((m) => (
          <span key={m.key} className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-[2px]"
              style={{ background: m.color }}
            />
            {m.label} <span className="num text-ink3">{pct1(lp[m.key])}</span>
          </span>
        ))}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-ink2">
        {lensCharacterLine(lp)}
      </p>
      <p className="mt-1 text-[10.5px] leading-relaxed text-ink3">
        This describes the nature of the patterns behind your health — not a
        share of the score.
      </p>
    </div>
  );
}

// ── B2d · Signals ledger — per-holding red-flag deductions, capital-weighted. The one place
//    the Health deduction is itemized. ───────────────────────────────────────────────────────
function SignalsLedger({
  snapshot,
  b,
}: {
  snapshot: PortfolioSnapshot;
  b: DeductionStory;
}) {
  const active = activeSignals(snapshot);
  const calm = active.length === 0;
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4 sm:p-5">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="grid size-6 place-items-center rounded-md"
          style={{
            background: `color-mix(in oklch, ${DRAG_COLOR.signal} 14%, transparent)`,
            color: DRAG_COLOR.signal,
          }}
        >
          <Icons.warning weight="duotone" className="size-3.5" />
        </span>
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
          Active flags — the Signals ledger
          <InfoTip>
            The red flags firing on your holdings, each deducting by its book
            weight. This is the one place the Health deduction is itemised — a
            bigger position firing a flag costs more.
          </InfoTip>
        </p>
        <span className="num ml-auto text-[11px] text-ink3">
          Signals {r0(b.signals)}
        </span>
      </div>
      <p className="mb-3.5 text-[11px] leading-relaxed text-ink3">
        {calm ? (
          <>
            No holding is firing a red flag — Signals took{" "}
            <span className="text-ink2">nothing</span> off.
          </>
        ) : (
          <>
            Each flagged holding deducts by its book weight —{" "}
            <span className="num" style={{ color: DRAG_COLOR.signal }}>
              −{r0(b.flagsDrag)}
            </span>{" "}
            off the Health Score in total.
          </>
        )}
      </p>
      {calm ? (
        <div
          className="flex items-center gap-2 rounded-md border px-3 py-2 text-[12px] text-ink2"
          style={{ borderColor: "var(--rec-bd)", background: "var(--rec-bg)" }}
        >
          <Icons.check
            weight="bold"
            className="size-4"
            style={{ color: "var(--rec)" }}
          />
          No active red flag is firing across your holdings.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {active.map((e) => {
            const meta = SIGNAL_SOURCE_META[e.source];
            return (
              <Tip
                key={e.symbol}
                content={
                  <>
                    <span className="font-semibold text-ink">
                      {e.symbol} · {meta.label}
                    </span>
                    <span className="mt-1 block text-ink2">
                      At {pct1(e.weight)} of your book, this flag takes{" "}
                      {e.points < 1 ? e.points.toFixed(1) : r0(e.points)} off
                      the Health score.
                    </span>
                  </>
                }
              >
                <div className="flex cursor-help items-center gap-3 rounded-md border border-line bg-surface-1 px-3 py-2">
                  <span className="num shrink-0 rounded bg-surface-3 px-1.5 py-0.5 text-[11px] font-semibold text-ink">
                    {e.symbol}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[12px] text-ink2">{meta.label}</span>
                    <span className="num ml-2 text-[10.5px] text-ink3">
                      {pct1(e.weight)} of book
                    </span>
                  </div>
                  <span
                    className="num shrink-0 text-[14px] font-semibold"
                    style={{ color: DRAG_COLOR.signal }}
                  >
                    −{e.points < 1 ? e.points.toFixed(1) : r0(e.points)}
                  </span>
                </div>
              </Tip>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** The HEALTH READ body — the premium read: "Are the things you own sound?" The two-step
 *  waterfall spine, the pillarProfile centrepiece, the lens-character read (when patterns
 *  fired), the Signals ledger, and the PQ/PS/PX findings the single number hid. No structure
 *  term anywhere. Rendered only when healthRead exists. */
export function HealthReadBody({
  snapshot,
  onOpenTab,
}: {
  snapshot: PortfolioSnapshot;
  holdings: Holding[];
  onOpenTab?: (t: PortfolioTab) => void;
}) {
  const story = deductionStory(snapshot);
  const color = healthColor(snapshot.healthRead?.band ?? null);
  const pp = snapshot.healthRead?.pillarProfile ?? null;
  const lp = snapshot.healthRead?.lensProfile ?? null;
  const patterns = triageFindings(healthPatternFindings(snapshot));

  return (
    <HealthShell accent={color}>
      <div className="flex flex-col gap-4">
        {story && <Waterfall b={story} color={color} />}
        {pp && <PillarProfileBlock pp={pp} />}
        {lp && <LensCharacterBlock lp={lp} />}
        {story && <SignalsLedger snapshot={snapshot} b={story} />}
        <div className="border-t border-line pt-4">
          <FindingsBlock
            triage={patterns}
            loudKicker="What the number hid"
            emptyNote="The number hid nothing worth headlining — no portfolio-level pattern fired on this book."
            onOpenTab={onOpenTab}
          />
        </div>
      </div>
    </HealthShell>
  );
}
