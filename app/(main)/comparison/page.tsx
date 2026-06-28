"use client";

/**
 * Comparison tool — SELECTION LANDING.
 *
 * Where the user chooses what to compare and learns comparability AT selection time,
 * then routes to the dedicated view (`/comparison/[slug]`). The differentiator: the
 * comparability signal is surfaced INLINE the moment both entities resolve — honest
 * with you DURING selection, never after. It is INFORMATIVE, never blocking: every
 * tier (same-family, cross-family, different-PG) is allowed. Warn-but-allow.
 *
 * Reads the live universe (useUniverseStocks) for the stock pickers and the /api/compare
 * alignment service (useComparison) for stock comparability. Peer-Group mode reads the PG
 * index (usePeerGroups) for its pickers and the two ponds' /health aggregates for the
 * field-level comparability gate. Both modes are fully built; both warn-but-allow.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useUniverseStocks } from "@/lib/api/hooks/use-stocks";
import { useComparison } from "@/lib/api/hooks/use-comparison";
import { usePeerGroups } from "@/lib/api/hooks/use-peer-groups";
import { usePeerGroupHealth } from "@/lib/api/hooks/use-peer-group-health";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { LabelBand } from "@/types/health";
import { EntityPicker, type PickerStock } from "@/components/comparison/entity-picker";
import {
  PeerGroupPicker,
  type PickerPeerGroup,
} from "@/components/comparison/pg-picker";

const BAND_CHIP: Record<LabelBand, string> = {
  pristine: "bg-pristine/15 text-pristine",
  healthy: "bg-healthy/15 text-healthy",
  steady: "bg-steady/15 text-steady",
  below_par: "bg-below/15 text-below",
  fragile: "bg-fragile/15 text-fragile",
};
const BAND_LABEL: Record<LabelBand, string> = {
  pristine: "Pristine",
  healthy: "Healthy",
  steady: "Steady",
  below_par: "Below par",
  fragile: "Fragile",
};

type Mode = "stocks" | "peer_groups";

/** Real same-family quick-starts — every symbol is in the universe; labeled as examples,
 *  never fabricated. Used only as a convenience to show the tool's intent. */
const SUGGESTED_PAIRS: { a: string; b: string; note: string }[] = [
  { a: "HDFCBANK", b: "ICICIBANK", note: "Large-cap private banks" },
  { a: "TCS", b: "INFY", note: "IT services" },
  { a: "SUNPHARMA", b: "DRREDDY", note: "Pharma" },
];

export default function ComparisonLandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("stocks");
  const [a, setA] = useState<PickerStock | null>(null);
  const [b, setB] = useState<PickerStock | null>(null);
  const [pgA, setPgA] = useState<PickerPeerGroup | null>(null);
  const [pgB, setPgB] = useState<PickerPeerGroup | null>(null);

  const { data: universe, isLoading: universeLoading } = useUniverseStocks();

  const pickerStocks: PickerStock[] = useMemo(
    () =>
      (universe ?? []).map((s) => ({
        symbol: s.symbol,
        name: s.name,
        sector: s.sector?.displayName ?? "",
        scored: s.scored,
        band: s.band ?? null,
      })),
    [universe],
  );

  const bySymbol = useMemo(() => {
    const m = new Map<string, PickerStock>();
    for (const s of pickerStocks) m.set(s.symbol, s);
    return m;
  }, [pickerStocks]);

  // Live comparability — fires the moment both symbols resolve (and differ).
  const comparison = useComparison(a?.symbol ?? null, b?.symbol ?? null);

  const bothPicked = Boolean(a && b);
  const sameSymbol = Boolean(a && b && a.symbol === b.symbol);
  const canCompare = bothPicked && !sameSymbol;

  function startCompare() {
    if (!a || !b || sameSymbol) return;
    router.push(`/comparison/${a.symbol}-vs-${b.symbol}`);
  }

  // ── Peer-group mode ──────────────────────────────────────────────────────────
  const { data: pgList, isLoading: pgLoading } = usePeerGroups();

  const pickerGroups: PickerPeerGroup[] = useMemo(
    () =>
      (pgList ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        displayName: g.displayName,
        sector: g.sector?.displayName ?? "",
        memberCount: g.memberCount,
        scored: g.scored,
        medianComposite: g.medianComposite,
      })),
    [pgList],
  );

  // The family gate needs industryPath, which lives only on /health (not the list). Fetch
  // both ponds' aggregates once picked — react-query caches them for build #2's view.
  const pgHealthA = usePeerGroupHealth(pgA?.id ?? "");
  const pgHealthB = usePeerGroupHealth(pgB?.id ?? "");

  const bothPgPicked = Boolean(pgA && pgB);
  const samePg = Boolean(pgA && pgB && pgA.id === pgB.id);
  const canComparePg = bothPgPicked && !samePg;

  function startComparePg() {
    if (!pgA || !pgB || samePg) return;
    router.push(`/comparison/pg/${pgA.id}-vs-${pgB.id}`);
  }

  function applySuggested(pair: { a: string; b: string }) {
    const pa = bySymbol.get(pair.a);
    const pb = bySymbol.get(pair.b);
    if (pa) setA(pa);
    if (pb) setB(pb);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3 text-center"
      >
        <div className="flex items-center justify-center gap-2 text-ink3">
          <Icons.scales weight="duotone" className="h-4 w-4" />
          <span className="text-sm font-medium">Comparison</span>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-5xl">
          Compare, honestly
        </h1>
        <p className="mx-auto max-w-2xl text-base text-ink2 md:text-lg">
          Pick two to study side by side. We tell you what lines up — and what
          doesn&apos;t — while you choose. No winner is declared; you read the full
          picture.
        </p>
      </motion.div>

      {/* Mode selector */}
      <div className="mt-10 flex justify-center">
        <div className="inline-flex rounded-xl border border-line bg-surface p-1">
          <button
            type="button"
            onClick={() => setMode("stocks")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors",
              mode === "stocks"
                ? "bg-pristine/12 text-pristine shadow-sm ring-1 ring-pristine/25"
                : "text-ink3 hover:text-ink2",
            )}
          >
            <Icons.chartBar
              weight={mode === "stocks" ? "duotone" : "regular"}
              className="h-4 w-4"
            />
            Stocks
          </button>
          <button
            type="button"
            onClick={() => setMode("peer_groups")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors",
              mode === "peer_groups"
                ? "bg-healthy/12 text-healthy shadow-sm ring-1 ring-healthy/25"
                : "text-ink3 hover:text-ink2",
            )}
          >
            <Icons.stack
              weight={mode === "peer_groups" ? "duotone" : "regular"}
              className="h-4 w-4"
            />
            Peer Groups
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === "peer_groups" ? (
          <motion.div
            key="pg-mode"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mt-10 space-y-8"
          >
            {/* Pickers */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
              <PgPickerSlot
                label="First field"
                picked={pgA}
                onClear={() => setPgA(null)}
                groups={pickerGroups}
                loading={pgLoading}
                disabledId={pgB?.id ?? null}
                onPick={setPgA}
              />
              <div className="flex items-center justify-center py-2 md:pt-12">
                <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink3">
                  vs
                </span>
              </div>
              <PgPickerSlot
                label="Second field"
                picked={pgB}
                onClear={() => setPgB(null)}
                groups={pickerGroups}
                loading={pgLoading}
                disabledId={pgA?.id ?? null}
                onPick={setPgB}
              />
            </div>

            {/* Live field-level comparability signal */}
            <PgComparabilitySignal
              bothPicked={bothPgPicked}
              samePg={samePg}
              queryA={pgHealthA}
              queryB={pgHealthB}
            />

            {/* Compare action */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                disabled={!canComparePg}
                onClick={startComparePg}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",
                  canComparePg
                    ? "cursor-pointer bg-primary text-primary-foreground hover:opacity-90"
                    : "cursor-not-allowed bg-line2 text-ink3",
                )}
              >
                <Icons.scales className="h-4 w-4" />
                {canComparePg && pgA && pgB
                  ? `Compare ${pgA.displayName} vs ${pgB.displayName}`
                  : "Pick two peer groups to compare"}
              </button>
              {canComparePg && (
                <p className="text-xs text-ink3">
                  Distributions compare regardless of sector — you read each field in full.
                </p>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="stocks-mode"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mt-10 space-y-8"
          >
            {/* Pickers */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
              <PickerSlot
                label="First"
                picked={a}
                onPick={setA}
                onClear={() => setA(null)}
                stocks={pickerStocks}
                loading={universeLoading}
                disabledSymbol={b?.symbol ?? null}
              />
              <div className="flex items-center justify-center py-2 md:pt-12">
                <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink3">
                  vs
                </span>
              </div>
              <PickerSlot
                label="Second"
                picked={b}
                onPick={setB}
                onClear={() => setB(null)}
                stocks={pickerStocks}
                loading={universeLoading}
                disabledSymbol={a?.symbol ?? null}
              />
            </div>

            {/* Live comparability signal */}
            <ComparabilitySignal
              bothPicked={bothPicked}
              sameSymbol={sameSymbol}
              query={comparison}
            />

            {/* Compare action */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                disabled={!canCompare}
                onClick={startCompare}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",
                  canCompare
                    ? "cursor-pointer bg-primary text-primary-foreground hover:opacity-90"
                    : "cursor-not-allowed bg-line2 text-ink3",
                )}
              >
                <Icons.scales className="h-4 w-4" />
                {canCompare && a && b
                  ? `Compare ${a.symbol} vs ${b.symbol}`
                  : "Pick two stocks to compare"}
              </button>
              {canCompare && (
                <p className="text-xs text-ink3">
                  Comparison opens regardless of sector — you choose what to read.
                </p>
              )}
            </div>

            {/* Suggested same-family quick-starts */}
            <div className="border-t border-line pt-6">
              <div className="mb-3 flex items-center justify-center gap-2 text-ink3">
                <Icons.spark weight="duotone" className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Example pairs
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {SUGGESTED_PAIRS.map((pair) => {
                  const ready = bySymbol.has(pair.a) && bySymbol.has(pair.b);
                  return (
                    <button
                      key={`${pair.a}-${pair.b}`}
                      type="button"
                      disabled={!ready}
                      onClick={() => applySuggested(pair)}
                      className={cn(
                        "rounded-xl border border-line bg-surface px-4 py-2.5 text-left transition-colors",
                        ready ? "hover:bg-line2/40" : "cursor-not-allowed opacity-50",
                      )}
                    >
                      <div className="num text-sm font-semibold text-ink">
                        {pair.a} <span className="text-ink3">vs</span> {pair.b}
                      </div>
                      <div className="text-xs text-ink3">{pair.note}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Picker slot — shows the search picker until a stock is chosen, then  */
/* a confirmed chip with a clear/change action.                         */
/* ------------------------------------------------------------------ */

function PickerSlot({
  label,
  picked,
  onPick,
  onClear,
  stocks,
  loading,
  disabledSymbol,
}: {
  label: string;
  picked: PickerStock | null;
  onPick: (s: PickerStock) => void;
  onClear: () => void;
  stocks: PickerStock[];
  loading: boolean;
  disabledSymbol: string | null;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-ink3">
        {label}
      </div>
      {picked ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="num text-sm font-semibold text-ink">
                {picked.symbol}
              </span>
              {picked.scored && picked.band ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    BAND_CHIP[picked.band],
                  )}
                >
                  {BAND_LABEL[picked.band]}
                </span>
              ) : (
                <span className="rounded-full bg-line2 px-2 py-0.5 text-[10px] font-medium text-ink3">
                  Not scored
                </span>
              )}
            </div>
            <p className="truncate text-xs text-ink2">{picked.name}</p>
            {picked.sector && (
              <p className="truncate text-xs text-ink3">{picked.sector}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClear}
            aria-label={`Change ${label.toLowerCase()} stock`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink3 transition-colors hover:bg-line2/50 hover:text-ink"
          >
            <Icons.close className="h-4 w-4" />
          </button>
        </motion.div>
      ) : (
        <EntityPicker
          stocks={stocks}
          loading={loading}
          disabledSymbol={disabledSymbol}
          onPick={onPick}
          placeholder="Search ticker or name…"
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Comparability signal — the differentiator. Informative, never a      */
/* block. Reads the live /api/compare alignment result.                 */
/* ------------------------------------------------------------------ */

function ComparabilitySignal({
  bothPicked,
  sameSymbol,
  query,
}: {
  bothPicked: boolean;
  sameSymbol: boolean;
  query: ReturnType<typeof useComparison>;
}) {
  if (!bothPicked) return null;

  if (sameSymbol) {
    return (
      <SignalCard tone="neutral" icon={<Icons.info className="h-4 w-4" />}>
        <span className="font-medium text-ink">Pick two different stocks.</span>{" "}
        A comparison needs two distinct names.
      </SignalCard>
    );
  }

  if (query.isLoading) {
    return (
      <SignalCard tone="neutral" icon={<Icons.refresh className="h-4 w-4 animate-spin" />}>
        Checking how these line up…
      </SignalCard>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SignalCard tone="neutral" icon={<Icons.warning className="h-4 w-4" />}>
        Couldn&apos;t check comparability right now — you can still open the comparison.
      </SignalCard>
    );
  }

  const { comparability, peerStandingComparable, a, b } = query.data;

  if (comparability === "same_family") {
    if (peerStandingComparable) {
      return (
        <SignalCard tone="positive" icon={<Icons.check className="h-4 w-4" />}>
          <span className="font-medium text-ink">
            Fully comparable — same family ({a.familyLabel}).
          </span>{" "}
          Every measure lines up, including peer-group ranks.
        </SignalCard>
      );
    }
    return (
      <SignalCard tone="positive" icon={<Icons.check className="h-4 w-4" />}>
        <span className="font-medium text-ink">
          Same family ({a.familyLabel}) — financial metrics line up directly.
        </span>{" "}
        They sit in different peer groups, so within-group ranks are relative to
        different sets and aren&apos;t directly comparable.
      </SignalCard>
    );
  }

  // cross_family — informative heads-up, framed as what they'll get.
  return (
    <SignalCard tone="info" icon={<Icons.info className="h-4 w-4" />}>
      <span className="font-medium text-ink">
        Different families ({a.familyLabel} vs {b.familyLabel}).
      </span>{" "}
      Universal measures — health, ROE, growth, returns, ownership — compare directly.
      Sector-specific metrics are shown separately and aren&apos;t directly comparable.
    </SignalCard>
  );
}

function SignalCard({
  tone,
  icon,
  children,
}: {
  tone: "positive" | "info" | "neutral";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const toneClasses: Record<"positive" | "info" | "neutral", string> = {
    positive: "border-healthy/30 bg-healthy/5",
    info: "border-line2 bg-surface",
    neutral: "border-line bg-surface",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "mx-auto flex max-w-3xl items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        toneClasses[tone],
      )}
    >
      <span
        className={cn(
          "mt-0.5 shrink-0",
          tone === "positive" ? "text-healthy" : tone === "info" ? "text-ctx" : "text-ink3",
        )}
      >
        {icon}
      </span>
      <p className="text-ink2">{children}</p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Peer-group picker slot — mirrors PickerSlot: search until chosen,    */
/* then a confirmed chip (name, members, median) with a clear action.   */
/* ------------------------------------------------------------------ */

function PgPickerSlot({
  label,
  picked,
  onPick,
  onClear,
  groups,
  loading,
  disabledId,
}: {
  label: string;
  picked: PickerPeerGroup | null;
  onPick: (g: PickerPeerGroup) => void;
  onClear: () => void;
  groups: PickerPeerGroup[];
  loading: boolean;
  disabledId: string | null;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-ink3">
        {label}
      </div>
      {picked ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">
                {picked.displayName}
              </span>
              {picked.medianComposite != null && (
                <span className="num rounded-full bg-line2 px-2 py-0.5 text-[10px] font-semibold text-ink3">
                  med {Math.round(picked.medianComposite)}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-ink2">
              {picked.memberCount} members
              {picked.sector ? ` · ${picked.sector}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            aria-label={`Change ${label.toLowerCase()}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink3 transition-colors hover:bg-line2/50 hover:text-ink"
          >
            <Icons.close className="h-4 w-4" />
          </button>
        </motion.div>
      ) : (
        <PeerGroupPicker
          groups={groups}
          loading={loading}
          disabledId={disabledId}
          onPick={onPick}
          placeholder="Search peer groups…"
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Peer-group comparability signal — the field-level differentiator.    */
/* Reads both ponds' industryPath (from /health) to gate metric-        */
/* distribution alignment. Informative, never a block. Warn-but-allow.  */
/* ------------------------------------------------------------------ */

const INDUSTRY_LABEL: Record<string, string> = {
  banking: "Banking",
  non_financial: "Non-Financial",
  mixed: "Mixed",
};

function industryLabel(path: string | null): string {
  return (path && INDUSTRY_LABEL[path]) || "Unclassified";
}

function PgComparabilitySignal({
  bothPicked,
  samePg,
  queryA,
  queryB,
}: {
  bothPicked: boolean;
  samePg: boolean;
  queryA: ReturnType<typeof usePeerGroupHealth>;
  queryB: ReturnType<typeof usePeerGroupHealth>;
}) {
  if (!bothPicked) return null;

  if (samePg) {
    return (
      <SignalCard tone="neutral" icon={<Icons.info className="h-4 w-4" />}>
        <span className="font-medium text-ink">Pick two different fields.</span>{" "}
        A comparison needs two distinct peer groups.
      </SignalCard>
    );
  }

  if (queryA.isLoading || queryB.isLoading) {
    return (
      <SignalCard tone="neutral" icon={<Icons.refresh className="h-4 w-4 animate-spin" />}>
        Checking how these fields line up…
      </SignalCard>
    );
  }

  if (
    queryA.isError ||
    queryB.isError ||
    !queryA.data?.identity ||
    !queryB.data?.identity
  ) {
    return (
      <SignalCard tone="neutral" icon={<Icons.warning className="h-4 w-4" />}>
        Couldn&apos;t check field comparability right now — you can still open the comparison.
      </SignalCard>
    );
  }

  const pathA = queryA.data.identity.industryPath;
  const pathB = queryB.data.identity.industryPath;
  const labelA = industryLabel(pathA);
  const labelB = industryLabel(pathB);

  // Same-family gate: both classified, identical, and NOT "mixed" (a mixed pond has no
  // single metric set, so it's cross-family vs anything — including another mixed).
  const sameFamily =
    pathA != null && pathA !== "mixed" && pathA === pathB;

  if (sameFamily) {
    return (
      <SignalCard tone="positive" icon={<Icons.check className="h-4 w-4" />}>
        <span className="font-medium text-ink">
          Both {labelA} fields — key-metric distributions compare directly.
        </span>{" "}
        Their sector-specific metric distributions line up, alongside the universal
        health, band-spread, and dispersion measures.
      </SignalCard>
    );
  }

  // Cross-family / mixed — informative heads-up, framed as what they'll get.
  return (
    <SignalCard tone="info" icon={<Icons.info className="h-4 w-4" />}>
      <span className="font-medium text-ink">
        Different field types ({labelA} vs {labelB}).
      </span>{" "}
      Universal measures — health distribution, band spread, concentration, dispersion —
      compare directly. Each field&apos;s sector-specific metric distributions are shown
      separately, not aligned.
    </SignalCard>
  );
}
