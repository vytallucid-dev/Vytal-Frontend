"use client";

/**
 * Events tab — corporate actions & calendar, against the LIVE corporate_events feed
 * (GET /api/v1/events/:symbol) plus a results-filing merge from the result-detail spine.
 *
 * v2 adds three controls on top of the v1 data layer (per-type cards, pending-dividend
 * state, results-filing merge — all intact):
 *   • Upcoming / Past toggle  — which dataset shows.
 *   • Cards / Timeline toggle — how the active dataset is drawn.
 *   • Family grouping (Past, cards view) with per-family visuals where the DATA earns one:
 *       – dividends    → ₹/share trend chart (a real series; regular vs special)
 *       – split/bonus  → a ratio glyph (parsed; description fallback when unparseable)
 *       – filings      → a cadence row of "Deep dive →" links into the Results viewer
 *       – meetings/AGM/buyback/earnings → clean cards (discrete dated, no series — honest)
 *   The variation IS the design: a visual only where it encodes something real.
 *
 * DISCIPLINE (Health/Overview calm theme — Panel · SectionEyebrow · .num · Reveal, tokens
 * only, no raw hex): per-type fields, honest pending dividend, honest "Results filing"
 * label (never dressed as a board announcement), honest-empties, NO insider/analyst data.
 */

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Icons, type Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/reveal";
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { QueryError } from "@/components/ui/query-error";
import { Panel, SectionEyebrow, tint } from "@/components/stock-detail/health/shared";
import { HonestEmpty, Chip } from "@/components/stock-detail/overview/shared";
import { WhereNext } from "./where-next";
import { useStockEvents } from "@/lib/api/hooks/use-stock-events";
import { useResultDetail } from "@/lib/api/hooks/use-result-detail";
import type { CorporateEvent } from "@/types/events";

/* ------------------------------------------------------------------ helpers */

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const fmtFullDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const fmtMonthYear = (ms: number) =>
  new Date(ms).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

/** ₹13 / ₹5.5 / ₹0.50 — per-share dividend, trimmed of noise zeros. */
const fmtRupee = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* Per-type identity: glyph + accent + a human label. Unknown types fall back to a neutral
 * calendar identity so a new NSE eventType never breaks the tab. */
const TYPE_META: Record<string, { label: string; icon: Icon; accent: string }> = {
  dividend:      { label: "Dividend",      icon: Icons.coins,    accent: "var(--p-found)" },
  bonus:         { label: "Bonus issue",   icon: Icons.spark,    accent: "var(--p-mom)" },
  split:         { label: "Stock split",   icon: Icons.scales,   accent: "var(--p-mom)" },
  buyback:       { label: "Buyback",       icon: Icons.target,   accent: "var(--p-own)" },
  earnings:      { label: "Earnings",      icon: Icons.chartBar, accent: "var(--c-steady)" },
  board_meeting: { label: "Board meeting", icon: Icons.building, accent: "var(--p-own)" },
  agm:           { label: "AGM",           icon: Icons.building, accent: "var(--p-own)" },
  rights:        { label: "Rights issue",  icon: Icons.stack,    accent: "var(--p-own)" },
  record_date:   { label: "Record date",   icon: Icons.calendar, accent: "var(--p-own)" },
};
const metaFor = (t: string) =>
  TYPE_META[t] ?? { label: cap(t.replace(/_/g, " ")), icon: Icons.calendar, accent: "var(--p-own)" };

const IMPACT_DOT: Record<string, string> = {
  high: "var(--p-mom)",
  medium: "var(--p-mkt)",
  low: "var(--ink3)",
};

/* ── Families — the grouping + colour language for the timeline & past sections ──
 * Each family is rendered the way its data wants to be seen (§3). Colours are a single
 * coherent legend across the timeline and the family eyebrows. */
type FamilyId = "dividend" | "split_bonus" | "earnings" | "filing" | "meeting";

const FAMILY_META: Record<FamilyId, { label: string; icon: Icon; color: string }> = {
  dividend:    { label: "Dividends",        icon: Icons.coins,    color: "var(--p-found)" },
  split_bonus: { label: "Splits & bonuses", icon: Icons.spark,    color: "var(--p-mom)" },
  earnings:    { label: "Earnings",         icon: Icons.chartBar, color: "var(--c-steady)" },
  filing:      { label: "Results filings",  icon: Icons.results,  color: "var(--p-mkt)" },
  meeting:     { label: "Meetings & actions", icon: Icons.building, color: "var(--p-own)" },
};
const FAMILY_ORDER: FamilyId[] = ["dividend", "split_bonus", "filing", "earnings", "meeting"];

function familyOf(eventType: string): FamilyId {
  if (eventType === "dividend") return "dividend";
  if (eventType === "split" || eventType === "bonus") return "split_bonus";
  if (eventType === "earnings") return "earnings";
  return "meeting"; // board_meeting, agm, buyback, rights, record_date, unknown
}

/* A dividend is genuinely "to be considered" only when BOTH amount and ex-date are absent
 * (a board will decide). With an ex-date but a null structured amount (e.g. sub-rupee
 * "Re 0.50" NSE didn't parse), it IS announced — we trust its description. */
const isPendingDividend = (e: CorporateEvent) =>
  e.eventType === "dividend" && e.dividendAmount == null && e.exDate == null;

/* Derive {a,b} for a split/bonus — from the structured ratio, else parsed from the NSE
 * free-text (splitRatio is often null; the ratio lives in the description). null ⇔
 * unparseable → caller falls back to the raw description (honest, never fabricated). */
function deriveRatio(e: CorporateEvent): { a: number; b: number } | null {
  const raw = e.eventType === "bonus" ? e.bonusRatio : e.splitRatio;
  const direct = raw ? /(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/.exec(raw) : null;
  if (direct) return { a: +direct[1], b: +direct[2] };
  if (e.eventType === "split" && e.description) {
    const m = /from\s*(?:rs\.?|re\.?)?\s*(\d+(?:\.\d+)?)\D+?to\s*(?:rs\.?|re\.?)?\s*(\d+(?:\.\d+)?)/i.exec(
      e.description,
    );
    if (m) return { a: +m[1], b: +m[2] };
  }
  return null;
}

/* ---------------------------------------------------------------- primitives */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12px]">
      <span className="text-ink3">{label}</span>
      <span className="num font-medium text-ink2">{value}</span>
    </div>
  );
}

function Headline({ children }: { children: React.ReactNode }) {
  return <p className="text-[13.5px] font-semibold leading-snug text-ink">{children}</p>;
}

function ImpactChip({ level }: { level: string }) {
  return <Chip dot={IMPACT_DOT[level] ?? "var(--ink3)"}>{cap(level)} impact</Chip>;
}

/* Per-type headline + structured detail rows. Returns ONLY what's real for the type. */
function EventBody({ e }: { e: CorporateEvent }) {
  const rows: React.ReactNode[] = [];
  const pushDate = (label: string, iso: string | null) => {
    if (iso) rows.push(<DetailRow key={label} label={label} value={fmtFullDay(iso)} />);
  };

  let headline: React.ReactNode;

  switch (e.eventType) {
    case "dividend": {
      if (isPendingDividend(e)) {
        return (
          <div className="space-y-1.5">
            <Headline>Dividend to be considered on {fmtFullDay(e.eventDate)}</Headline>
            {e.description && <p className="text-[11.5px] leading-relaxed text-ink3">{e.description}</p>}
          </div>
        );
      }
      if (e.dividendAmount != null) {
        headline = (
          <Headline>
            {fmtRupee(e.dividendAmount)} <span className="font-normal text-ink2">per share</span>
            {e.dividendType ? <span className="font-normal text-ink3"> · {cap(e.dividendType)}</span> : null}
          </Headline>
        );
      } else {
        headline = <Headline>{e.description ?? "Dividend announced"}</Headline>;
      }
      pushDate("Ex-date", e.exDate);
      pushDate("Record date", e.recordDate);
      break;
    }
    case "split": {
      headline = e.splitRatio ? <Headline>Split {e.splitRatio}</Headline> : <Headline>{e.description ?? "Stock split"}</Headline>;
      pushDate("Ex-date", e.exDate);
      break;
    }
    case "bonus": {
      headline = e.bonusRatio ? <Headline>Bonus {e.bonusRatio}</Headline> : <Headline>{e.description ?? "Bonus issue"}</Headline>;
      pushDate("Ex-date", e.exDate);
      break;
    }
    case "buyback": {
      headline = <Headline>{e.description ?? "Share buyback"}</Headline>;
      pushDate("Ex-date", e.exDate);
      break;
    }
    case "earnings": {
      headline = <Headline>{e.description ?? "Quarterly results"}</Headline>;
      break;
    }
    case "agm":
    case "board_meeting": {
      headline = <Headline>{e.description ?? metaFor(e.eventType).label}</Headline>;
      break;
    }
    default: {
      headline = <Headline>{e.description ?? metaFor(e.eventType).label}</Headline>;
      pushDate("Ex-date", e.exDate);
      pushDate("Record date", e.recordDate);
    }
  }

  return (
    <div className="space-y-2">
      {headline}
      {rows.length > 0 && <div className="space-y-1 rounded-lg border border-line bg-surface-2 px-3 py-2">{rows}</div>}
    </div>
  );
}

/** One corporate-event card — per-type body, impact badge, confirmed/tentative (upcoming). */
function EventCard({ e, showStatus }: { e: CorporateEvent; showStatus: boolean }) {
  const meta = metaFor(e.eventType);
  return (
    <Panel className="flex h-full flex-col gap-3 p-4 transition-colors hover:border-line3">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border" style={tint(meta.accent)}>
          <meta.icon weight="duotone" className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-medium text-ink2">{meta.label}</span>
            {showStatus && (
              <Chip tone={e.isConfirmed ? "accent" : "neutral"}>{e.isConfirmed ? "Confirmed" : "Tentative"}</Chip>
            )}
          </div>
          <p className="num mt-0.5 flex items-center gap-1 text-[11px] text-ink3">
            <Icons.calendar weight="regular" className="h-3 w-3" />
            {fmtFullDay(e.eventDate)}
          </p>
        </div>
      </div>

      <EventBody e={e} />

      <div className="mt-auto flex items-center gap-1.5 pt-0.5">
        <ImpactChip level={e.impactLevel} />
      </div>
    </Panel>
  );
}

/* ── Per-family visual: dividend ₹/share trend (a real series) ─────────────── */
interface DividendPoint {
  ms: number;
  iso: string;
  amount: number;
  type: string | null;
}

function DividendTrend({ points }: { points: DividendPoint[] }) {
  const chartData = points.map((p) => ({
    label: fmtMonthYear(p.ms),
    amount: p.amount,
    special: p.type === "special" ? p.amount : null,
  }));
  return (
    <Panel>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 4, left: -8 }}>
          <CartesianGrid strokeDasharray="2 5" stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--ink3)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "var(--ink3)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={46}
            tickFormatter={(v: number) => `₹${v}`}
          />
          <Tooltip
            contentStyle={{ background: "var(--surface2)", border: "1px solid var(--line2)", borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: "var(--ink2)", fontSize: 11 }}
            formatter={(v: number, n: string) => [fmtRupee(v), n]}
          />
          <Line
            type="monotone"
            dataKey="amount"
            name="Dividend / share"
            stroke="var(--p-found)"
            strokeWidth={2.2}
            dot={{ r: 3, fill: "var(--p-found)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          {/* special dividends — highlighted dots, no connecting line (one-offs, not a trend) */}
          <Line
            type="monotone"
            dataKey="special"
            name="Special"
            stroke="transparent"
            strokeWidth={0}
            dot={{ r: 5, fill: "var(--p-mom)", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center gap-4 px-1 text-[11px] text-ink3">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--p-found)" }} /> Regular
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--p-mom)" }} /> Special
        </span>
        <span className="ml-auto">{points.length} payouts · ₹/share</span>
      </div>
    </Panel>
  );
}

/* ── Per-family visual: split / bonus ratio glyph ──────────────────────────── */
function RatioCard({ e }: { e: CorporateEvent }) {
  const meta = metaFor(e.eventType);
  const r = deriveRatio(e);
  const isBonus = e.eventType === "bonus";
  return (
    <Panel className="flex h-full flex-col gap-3 p-4 transition-colors hover:border-line3">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border" style={tint(meta.accent)}>
          <meta.icon weight="duotone" className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <span className="text-[12px] font-medium text-ink2">{meta.label}</span>
          <p className="num mt-0.5 flex items-center gap-1 text-[11px] text-ink3">
            <Icons.calendar weight="regular" className="h-3 w-3" />
            {fmtFullDay(e.eventDate)}
          </p>
        </div>
      </div>

      {r ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-line bg-surface-2 py-4">
          <div className="num flex items-baseline gap-1 text-[28px] font-semibold leading-none text-ink">
            <span style={{ color: meta.accent }}>{r.a}</span>
            <span className="text-[20px] text-ink3">:</span>
            <span style={{ color: meta.accent }}>{r.b}</span>
          </div>
          <span className="text-[11px] text-ink3">
            {isBonus
              ? `${r.a} bonus share${r.a > 1 ? "s" : ""} for every ${r.b} held`
              : `₹${r.a} → ₹${r.b} face value`}
          </span>
        </div>
      ) : (
        <Headline>{e.description ?? meta.label}</Headline>
      )}

      <div className="mt-auto flex flex-col gap-2">
        {e.exDate && (
          <div className="space-y-1 rounded-lg border border-line bg-surface-2 px-3 py-2">
            <DetailRow label="Ex-date" value={fmtFullDay(e.exDate)} />
          </div>
        )}
        <ImpactChip level={e.impactLevel} />
      </div>
    </Panel>
  );
}

/* ── Per-family visual: results-filing cadence + deep-dive into the Results viewer ── */
interface FilingItem {
  periodKey: string; // "FY26Q4"
  periodLabel: string; // "Q4 FY26"
  filingDate: string; // YYYY-MM-DD
}

function FilingCadence({ symbol, filings }: { symbol: string; filings: FilingItem[] }) {
  return (
    <Panel className="p-4">
      <div className="flex flex-wrap gap-2.5">
        {filings.map((f) => (
          <Link
            key={f.periodKey}
            href={`/results/${symbol}?period=${f.periodKey}&tab=snapshot`}
            className="group flex min-w-37.5 flex-1 flex-col gap-1 rounded-lg border border-line bg-surface-2 px-3 py-2.5 transition-colors hover:border-line3 hover:bg-surface-3"
          >
            <span className="num text-[13px] font-semibold text-ink">{f.periodLabel}</span>
            <span className="num text-[11px] text-ink3">Filed {fmtFullDay(f.filingDate)}</span>
            <span className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-p-mkt">
              Deep dive
              <Icons.arrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-ink3">
        Real NSE filing dates from the results spine. Deep dive opens the full quarter breakdown in the
        Results viewer.
      </p>
    </Panel>
  );
}

/* A family section shell — eyebrow (name + count) over the family's chosen rendering. */
function FamilySection({
  family,
  count,
  children,
}: {
  family: FamilyId;
  count: number;
  children: React.ReactNode;
}) {
  const fam = FAMILY_META[family];
  return (
    <Reveal>
      <section>
        <SectionEyebrow label={fam.label} icon={fam.icon} accent={fam.color} pill={`${count}`} />
        {children}
      </section>
    </Reveal>
  );
}

const cardGrid = "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3";

/* ════════════════════════════════════════════════════════════════════════════
 * Past — cards view: families grouped, each rendered per its data shape (§3)
 * ════════════════════════════════════════════════════════════════════════════ */
function PastCardsView({
  symbol,
  events,
  filings,
}: {
  symbol: string;
  events: CorporateEvent[];
  filings: FilingItem[];
}) {
  const groups = useMemo(() => {
    const g: Record<FamilyId, CorporateEvent[]> = {
      dividend: [],
      split_bonus: [],
      earnings: [],
      filing: [],
      meeting: [],
    };
    for (const e of events) g[familyOf(e.eventType)].push(e);
    return g;
  }, [events]);

  const dividendPoints = useMemo<DividendPoint[]>(
    () =>
      groups.dividend
        .filter((e) => e.dividendAmount != null && !isPendingDividend(e))
        .map((e) => ({ ms: new Date(e.eventDate).getTime(), iso: e.eventDate, amount: e.dividendAmount as number, type: e.dividendType }))
        .sort((a, b) => a.ms - b.ms),
    [groups.dividend],
  );
  // dividends with no parseable amount (pending / sub-rupee) — surfaced as cards so the
  // chart never hides a real payout.
  const dividendExtras = groups.dividend.filter((e) => e.dividendAmount == null);

  return (
    <div className="space-y-2">
      {/* Dividends → trend chart when a real series exists (≥3), else cards */}
      {groups.dividend.length > 0 && (
        <FamilySection family="dividend" count={groups.dividend.length}>
          {dividendPoints.length >= 3 ? (
            <div className="space-y-4">
              <DividendTrend points={dividendPoints} />
              {dividendExtras.length > 0 && (
                <StaggerGroup className={cardGrid}>
                  {dividendExtras.map((e) => (
                    <StaggerItem key={e.id}>
                      <EventCard e={e} showStatus={false} />
                    </StaggerItem>
                  ))}
                </StaggerGroup>
              )}
            </div>
          ) : (
            <StaggerGroup className={cardGrid}>
              {groups.dividend.map((e) => (
                <StaggerItem key={e.id}>
                  <EventCard e={e} showStatus={false} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </FamilySection>
      )}

      {/* Splits & bonuses → ratio glyphs */}
      {groups.split_bonus.length > 0 && (
        <FamilySection family="split_bonus" count={groups.split_bonus.length}>
          <StaggerGroup className={cardGrid}>
            {groups.split_bonus.map((e) => (
              <StaggerItem key={e.id}>
                <RatioCard e={e} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </FamilySection>
      )}

      {/* Results filings → cadence + deep-dive */}
      {filings.length > 0 && (
        <FamilySection family="filing" count={filings.length}>
          <FilingCadence symbol={symbol} filings={filings} />
        </FamilySection>
      )}

      {/* Earnings (corporate-event board dates) → clean cards */}
      {groups.earnings.length > 0 && (
        <FamilySection family="earnings" count={groups.earnings.length}>
          <StaggerGroup className={cardGrid}>
            {groups.earnings.map((e) => (
              <StaggerItem key={e.id}>
                <EventCard e={e} showStatus={false} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </FamilySection>
      )}

      {/* Meetings / AGM / buyback → clean cards (no forced visual — honest) */}
      {groups.meeting.length > 0 && (
        <FamilySection family="meeting" count={groups.meeting.length}>
          <StaggerGroup className={cardGrid}>
            {groups.meeting.map((e) => (
              <StaggerItem key={e.id}>
                <EventCard e={e} showStatus={false} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </FamilySection>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * Timeline view — events on a horizontal time axis, colour-coded by family (§2)
 * ════════════════════════════════════════════════════════════════════════════ */
interface Marker {
  id: string;
  ms: number;
  iso: string;
  color: string;
  family: FamilyId;
  label: string; // per-type label for the popover header
  node: React.ReactNode; // popover body
}

function EventTimeline({ markers, emptyMsg }: { markers: Marker[]; emptyMsg: string }) {
  const [active, setActive] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMarker = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActive(id);
  };
  const scheduleClose = (id: string) => {
    closeTimer.current = setTimeout(() => setActive((cur) => (cur === id ? null : cur)), 80);
  };

  const layout = useMemo(() => {
    if (markers.length === 0) return null;
    const today = Date.now();
    const times = markers.map((m) => m.ms);
    let lo = Math.min(...times, today);
    let hi = Math.max(...times, today);
    const span = hi - lo || 86_400_000;
    const pad = span * 0.05;
    lo -= pad;
    hi += pad;
    const range = hi - lo;
    const xOf = (ms: number) => clamp(((ms - lo) / range) * 100, 0, 100);
    const ticks = Array.from({ length: 5 }, (_, i) => lo + (i / 4) * range);
    return {
      xOf,
      ticks,
      todayPct: today >= lo && today <= hi ? xOf(today) : null,
      placed: markers.map((m) => ({ m, x: xOf(m.ms) })),
    };
  }, [markers]);

  // Distinct families present → the legend.
  const legend = useMemo(() => {
    const seen = new Set<FamilyId>();
    const out: FamilyId[] = [];
    for (const f of FAMILY_ORDER) {
      if (markers.some((m) => m.family === f) && !seen.has(f)) {
        seen.add(f);
        out.push(f);
      }
    }
    return out;
  }, [markers]);

  if (!layout) return <HonestEmpty>{emptyMsg}</HonestEmpty>;

  return (
    <Panel className="p-5">
      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {legend.map((f) => (
          <span key={f} className="flex items-center gap-1.5 text-[11px] text-ink3">
            <span className="h-2 w-2 rounded-full" style={{ background: FAMILY_META[f].color }} />
            {FAMILY_META[f].label}
          </span>
        ))}
      </div>

      {/* axis */}
      <div className="relative mt-6 h-37.5 overflow-visible">
        {/* baseline */}
        <div className="absolute inset-x-0 h-px bg-line" style={{ top: 108 }} />

        {/* today reference */}
        {layout.todayPct != null && (
          <div className="absolute" style={{ left: `${layout.todayPct}%`, top: 14, bottom: 26 }}>
            <div className="h-full w-px border-l border-dashed border-line2" />
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9.5px] uppercase tracking-wide text-ink3">
              Today
            </span>
          </div>
        )}

        {/* markers */}
        {layout.placed.map(({ m, x }) => {
          const isActive = active === m.id;
          const side = x < 22 ? "left" : x > 78 ? "right" : "center";
          return (
            <div key={m.id} className="absolute" style={{ left: `${x}%`, top: 108 }}>
              <button
                type="button"
                onMouseEnter={() => openMarker(m.id)}
                onMouseLeave={() => scheduleClose(m.id)}
                onFocus={() => openMarker(m.id)}
                onBlur={() => scheduleClose(m.id)}
                onClick={() => setActive((cur) => (cur === m.id ? null : m.id))}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 outline-none"
                aria-label={`${m.label} — ${fmtFullDay(m.iso)}`}
              >
                <span
                  className={cn(
                    "block rounded-full ring-2 ring-surface-1 transition-transform",
                    isActive ? "h-3.5 w-3.5 scale-110" : "h-3 w-3 hover:scale-110",
                  )}
                  style={{ background: m.color }}
                />
              </button>

              {isActive && (
                <div
                  className={cn(
                    "absolute bottom-4 z-20 w-60 rounded-xl border border-line2 bg-surface-1 p-3 shadow-lg",
                    side === "center" && "left-1/2 -translate-x-1/2",
                    side === "left" && "left-0",
                    side === "right" && "right-0",
                  )}
                  onMouseEnter={() => openMarker(m.id)}
                  onMouseLeave={() => scheduleClose(m.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink2">
                      <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                      {m.label}
                    </span>
                    <span className="num text-[10.5px] text-ink3">{fmtFullDay(m.iso)}</span>
                  </div>
                  <div className="mt-2">{m.node}</div>
                </div>
              )}
            </div>
          );
        })}

        {/* axis ticks */}
        {layout.ticks.map((t, i) => {
          const x = clamp(((t - layout.ticks[0]) / (layout.ticks[4] - layout.ticks[0] || 1)) * 100, 0, 100);
          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 text-[10px] text-ink3"
              style={{ left: `${x}%`, top: 120 }}
            >
              <span className="block h-1.5 w-px bg-line2" />
              <span className="num mt-1 block whitespace-nowrap">{fmtMonthYear(t)}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * Segmented control
 * ════════════════════════════════════════════════════════════════════════════ */
function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: Icon; count?: number; accent?: string }[];
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface-1 p-0.5">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors",
              on ? "text-ink" : "text-ink3 hover:text-ink",
            )}
            style={on ? tint(o.accent ?? "var(--p-found)") : undefined}
          >
            {o.icon && <o.icon weight={on ? "fill" : "regular"} className="h-3.5 w-3.5" />}
            {o.label}
            {o.count != null && (
              <span
                className={cn(
                  "num rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                  on ? "bg-surface-1/60" : "bg-surface-3 text-ink3",
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * Events tab
 * ════════════════════════════════════════════════════════════════════════════ */
type Dataset = "upcoming" | "past";
type View = "cards" | "timeline";

export default function Events() {
  const params = useParams();
  const symbol = (params.symbol as string) ?? "";

  const [dataset, setDataset] = useState<Dataset>("upcoming");
  const [view, setView] = useState<View>("cards");

  const upcomingQ = useStockEvents(symbol, true);
  const pastQ = useStockEvents(symbol, false);
  // §4 — results-filing dates merge in from the result-detail spine. Supplementary:
  // a 404 (no filed results yet) never blocks the events tab, it just yields no filings.
  const resultsQ = useResultDetail(symbol);

  const upcoming = useMemo(() => upcomingQ.data?.data.events ?? [], [upcomingQ.data]);
  const past = useMemo(() => pastQ.data?.data.events ?? [], [pastQ.data]);

  const filings = useMemo<FilingItem[]>(() => {
    const spine = resultsQ.data?.data.spine ?? [];
    const today = new Date().toISOString().split("T")[0];
    return spine
      .filter((q) => q.filingDate && q.filingDate <= today)
      .map((q) => ({ periodKey: q.periodKey, periodLabel: `${q.quarter} ${q.fiscalYear}`, filingDate: q.filingDate }))
      .sort((a, b) => (a.filingDate < b.filingDate ? 1 : -1)); // newest first
  }, [resultsQ.data]);

  // Timeline markers for the active dataset (past also carries the filing markers).
  const markers = useMemo<Marker[]>(() => {
    const eventMarker = (e: CorporateEvent): Marker => ({
      id: e.id,
      ms: new Date(e.eventDate).getTime(),
      iso: e.eventDate,
      color: FAMILY_META[familyOf(e.eventType)].color,
      family: familyOf(e.eventType),
      label: metaFor(e.eventType).label,
      node: (
        <div className="space-y-2">
          <EventBody e={e} />
          <ImpactChip level={e.impactLevel} />
        </div>
      ),
    });
    if (dataset === "upcoming") return upcoming.map(eventMarker);
    const filingMarkers: Marker[] = filings.map((f) => ({
      id: `filing-${f.periodKey}`,
      ms: new Date(f.filingDate).getTime(),
      iso: f.filingDate,
      color: FAMILY_META.filing.color,
      family: "filing",
      label: "Results filing",
      node: (
        <div className="space-y-2">
          <Headline>
            <span className="num">{f.periodLabel}</span> results filed
          </Headline>
          <Link
            href={`/results/${symbol}?period=${f.periodKey}&tab=snapshot`}
            className="inline-flex items-center gap-1 text-[11.5px] font-medium text-p-mkt hover:underline"
          >
            Deep dive
            <Icons.arrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      ),
    }));
    return [...past.map(eventMarker), ...filingMarkers];
  }, [dataset, upcoming, past, filings, symbol]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (upcomingQ.isLoading || pastQ.isLoading) {
    return <QuerySkeleton rows={6} rowHeight="h-16" className="mt-8" />;
  }

  // ── Error — only when the core events feed itself fails (filings are supplementary)
  if (upcomingQ.isError && pastQ.isError) {
    return (
      <QueryError
        message={(upcomingQ.error as Error)?.message ?? "Failed to load corporate events"}
        onRetry={() => {
          upcomingQ.refetch();
          pastQ.refetch();
        }}
        className="mt-8"
      />
    );
  }

  const name = upcomingQ.data?.data.name ?? pastQ.data?.data.name ?? symbol.toUpperCase();
  const hasUpcoming = upcoming.length > 0;
  const hasPast = past.length > 0 || filings.length > 0;

  // Genuinely no events of any kind on record → a single honest empty.
  if (!hasUpcoming && !hasPast) {
    return (
      <div className="mt-6">
        <Panel className="flex flex-col items-center gap-3 py-14 text-center">
          <Icons.calendar weight="duotone" className="h-10 w-10 text-ink3" />
          <p className="font-medium text-ink">No corporate events on record for {name}</p>
          <p className="max-w-sm text-sm text-ink3">
            No dividends, splits, bonuses, buybacks, board meetings or filed-result dates are on file
            yet. They&apos;ll appear here as the disclosure feeds report them.
          </p>
        </Panel>
      </div>
    );
  }

  const activeEmpty = dataset === "upcoming" ? !hasUpcoming : !hasPast;

  return (
    <div className="mt-6 space-y-5">
      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented<Dataset>
          value={dataset}
          onChange={setDataset}
          options={[
            { value: "upcoming", label: "Upcoming", icon: Icons.calendar, count: upcoming.length, accent: "var(--p-mom)" },
            { value: "past", label: "Past", icon: Icons.clock, count: past.length + filings.length, accent: "var(--p-found)" },
          ]}
        />
        <Segmented<View>
          value={view}
          onChange={setView}
          options={[
            { value: "cards", label: "Cards", icon: Icons.stack },
            { value: "timeline", label: "Timeline", icon: Icons.pulse },
          ]}
        />
      </Reveal>

      {/* ── Active view ───────────────────────────────────────────────────── */}
      {view === "timeline" ? (
        <Reveal>
          <EventTimeline
            markers={markers}
            emptyMsg={
              dataset === "upcoming"
                ? "No scheduled events ahead — they'll appear here as they're announced."
                : "No past corporate actions or filed-result dates on record."
            }
          />
        </Reveal>
      ) : dataset === "upcoming" ? (
        activeEmpty ? (
          <HonestEmpty>
            No scheduled events ahead — dividends, board meetings and result dates will show as
            they&apos;re announced.
          </HonestEmpty>
        ) : (
          <StaggerGroup className={cardGrid}>
            {upcoming.map((e) => (
              <StaggerItem key={e.id}>
                <EventCard e={e} showStatus />
              </StaggerItem>
            ))}
          </StaggerGroup>
        )
      ) : activeEmpty ? (
        <HonestEmpty>No past corporate actions or filed-result dates on record.</HonestEmpty>
      ) : (
        <PastCardsView symbol={symbol} events={past} filings={filings} />
      )}

      <Reveal>
        <WhereNext symbol={symbol} exclude={["events"]} />
      </Reveal>
    </div>
  );
}
