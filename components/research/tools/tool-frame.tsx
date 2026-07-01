"use client";

/**
 * <ToolFrame> — the shared shell every research tool inherits. It OWNS the chrome,
 * the responsive single-view grid, the shared scrub state, dual-entry, the switchers,
 * the promoted-read slot and funnel-back. A tool fills the slots in ToolFrameProps
 * (see tool-frame.types.ts for the full seam). Divergence / Ownership reuse this
 * verbatim — they differ only in the slots they pass.
 */

import { useEffect, useMemo, useState } from "react";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { QueryError } from "@/components/ui/query-error";
import { Panel } from "@/components/stock-detail/health/shared";
import { StockAutocomplete } from "@/components/stock-autocomplete";
import type { Stock } from "@/lib/indian-stocks-data";
import { NameSwitcher } from "./name-switcher";
import {
  QUARTER_OPTIONS,
  DAY_OPTIONS,
  windowKey,
  type ActiveDatapoint,
  type PromotedRead,
  type ToolFrameProps,
  type ToolWindow,
} from "./tool-frame.types";

/** Today as "YYYY-MM-DD" (local) — the custom-range date-input max bound. */
function todayISO(): string {
  const n = new Date();
  const mm = String(n.getMonth() + 1).padStart(2, "0");
  const dd = String(n.getDate()).padStart(2, "0");
  return `${n.getFullYear()}-${mm}-${dd}`;
}

const READ_TONE: Record<PromotedRead["tone"], { fg: string; bg: string; bd: string }> = {
  rec: { fg: "var(--rec)", bg: "var(--rec-bg)", bd: "var(--rec-bd)" },
  high: { fg: "var(--high)", bg: "var(--high-bg)", bd: "var(--high-bd)" },
  crit: { fg: "var(--crit)", bg: "var(--crit-bg)", bd: "var(--crit-bd)" },
  ctx: { fg: "var(--ctx)", bg: "var(--ctx-bg)", bd: "var(--ctx-bd)" },
  neutral: { fg: "var(--ink2)", bg: "var(--surface-2)", bd: "var(--line2)" },
};

function ReadIcon({ tone }: { tone: PromotedRead["tone"] }) {
  if (tone === "rec") return <Icons.trendUp weight="bold" className="size-5" />;
  if (tone === "high" || tone === "crit") return <Icons.warning weight="fill" className="size-5" />;
  if (tone === "ctx") return <Icons.compass weight="bold" className="size-5" />;
  return <Icons.pulse weight="bold" className="size-5" />;
}

function PromotedReadBanner({
  read,
  funnelBackHref,
}: {
  read: PromotedRead;
  funnelBackHref: string;
}) {
  const t = READ_TONE[read.tone];
  return (
    <div
      className="mb-3.5 flex flex-wrap items-start gap-4 rounded-xl border p-4 sm:p-5"
      style={{
        borderColor: t.bd,
        background: `linear-gradient(100deg, ${t.bg}, transparent 70%), var(--surface)`,
      }}
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-[11px]"
        style={{ background: t.bg, color: t.fg }}
      >
        <ReadIcon tone={read.tone} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="diagnosis text-[19px] font-medium" style={{ color: t.fg }}>
          {read.title}
        </p>
        <p className="mt-1.5 max-w-[62ch] text-[13px] leading-relaxed text-ink2">{read.body}</p>
        {read.note && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-high">
            <Icons.warning weight="fill" className="size-3" />
            {read.note}
          </p>
        )}
      </div>
      <a
        href={funnelBackHref}
        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-line2 bg-surface-2 px-3 py-1.5 text-[12px] text-ink transition-colors hover:border-line3 hover:bg-surface-3"
      >
        Open health page
        <Icons.arrowUpRight className="size-3" />
      </a>
    </div>
  );
}

const NEEDS_DAILY = "no daily score history yet";

function WindowSwitcher({
  value,
  onChange,
  dailyBounds,
}: {
  value: ToolWindow;
  onChange: (w: ToolWindow) => void;
  /** undefined → the tool doesn't do daily (group hidden); null → does, but this stock
   *  has no daily history yet (group shown disabled); object → daily enabled. */
  dailyBounds?: { first: string; last: string } | null;
}) {
  // A tool opts INTO daily by passing the prop at all (even null). Ownership omits it.
  const supportsDaily = dailyBounds !== undefined;
  const hasDaily = !!dailyBounds;
  const isCustom = value.mode === "custom";
  const btn = (on: boolean, disabled?: boolean) =>
    cn(
      "rounded-md border px-3 py-1 text-[11px] transition-colors",
      disabled
        ? "cursor-not-allowed border-line2 bg-surface-2 text-ink3/40"
        : on
          ? "border-line3 bg-surface-3 font-medium text-ink"
          : "border-line2 bg-surface-2 text-ink2 hover:border-line3 hover:text-ink",
    );

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label="History window">
        {QUARTER_OPTIONS.map((o) => {
          const on = value.mode === "quarterly" && value.quarters === o.value;
          return (
            <button
              key={`q${o.value}`}
              onClick={() => onChange({ mode: "quarterly", quarters: o.value })}
              aria-pressed={on}
              className={btn(on)}
            >
              {o.label}
            </button>
          );
        })}
        {supportsDaily && (
          <>
            <span className="mx-0.5 h-4 w-px bg-line2" aria-hidden />
            {DAY_OPTIONS.map((o) => {
              const on = value.mode === "daily" && value.days === o.value;
              return (
                <button
                  key={`d${o.value}`}
                  disabled={!hasDaily}
                  title={hasDaily ? undefined : NEEDS_DAILY}
                  onClick={() => hasDaily && onChange({ mode: "daily", days: o.value })}
                  aria-pressed={on}
                  className={btn(on, !hasDaily)}
                >
                  {o.label}
                </button>
              );
            })}
            <button
              disabled={!hasDaily}
              title={hasDaily ? undefined : NEEDS_DAILY}
              onClick={() =>
                hasDaily && onChange({ mode: "custom", start: dailyBounds!.first, end: dailyBounds!.last })
              }
              aria-pressed={isCustom}
              className={btn(isCustom, !hasDaily)}
            >
              Custom
            </button>
          </>
        )}
      </div>

      {/* custom range picker — arbitrary start–end, clamped to available daily history */}
      {isCustom && dailyBounds && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink2">
          <label className="inline-flex items-center gap-1.5">
            <span className="text-ink3">From</span>
            <input
              type="date"
              value={value.start}
              min={dailyBounds.first}
              max={value.end || dailyBounds.last}
              onChange={(e) => onChange({ mode: "custom", start: e.target.value, end: value.end })}
              className="rounded-md border border-line2 bg-surface-2 px-2 py-1 text-[11px] text-ink outline-none focus:border-line3"
            />
          </label>
          <label className="inline-flex items-center gap-1.5">
            <span className="text-ink3">To</span>
            <input
              type="date"
              value={value.end}
              min={value.start || dailyBounds.first}
              max={dailyBounds.last || todayISO()}
              onChange={(e) => onChange({ mode: "custom", start: value.start, end: e.target.value })}
              className="rounded-md border border-line2 bg-surface-2 px-2 py-1 text-[11px] text-ink outline-none focus:border-line3"
            />
          </label>
        </div>
      )}
    </div>
  );
}

export function ToolFrame({
  meta,
  symbol,
  window,
  onWindowChange,
  onSelectSymbol,
  onHome,
  stocks,
  stocksLoading,
  landing,
  single,
}: ToolFrameProps) {
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // The frame-owned shared scrub state — chart SETS it, readout READS it.
  // Reset to resting whenever the stock or window changes (new series).
  const winKey = windowKey(window);
  const [active, setActive] = useState<ActiveDatapoint>({ index: null });
  useEffect(() => {
    setActive({ index: null });
  }, [symbol, winKey]);

  // Frame-owned chart-expand state (shared, so all three tools behave identically).
  // false = today's 50/50 layout; true = chart near-hero, readout+summary reflow below.
  const [expanded, setExpanded] = useState(false);

  const Tool = meta.Icon;

  // Scored universe → the StockAutocomplete shape, for the landing hero search.
  const autocompleteStocks: Stock[] = useMemo(
    () =>
      (stocks ?? []).map((s) => ({
        symbol: s.symbol,
        name: s.name,
        sector: s.sector?.displayName ?? "",
        exchange: "NSE",
      })),
    [stocks],
  );

  const landingItems = landing.items ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col">
      {/* ── strip ── */}
      <div className="mb-4 flex flex-wrap items-center gap-4 border-b border-line pb-3 pt-1">
        <button
          onClick={onHome}
          className="flex items-center gap-2.5 font-display text-base font-medium text-ink"
        >
          <Tool weight="duotone" className="size-[18px]" style={{ color: meta.accentVar }} />
          {meta.name}
        </button>
        <div className="ml-1 flex gap-1.5">
          <button
            onClick={() => setSwitcherOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-surface-1 px-3 py-1.5 text-[12px] text-ink2 transition-colors hover:border-line3 hover:text-ink"
          >
            <Icons.search className="size-3.5" />
            Search stock
          </button>
          <button
            onClick={() => setSwitcherOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-surface-1 px-3 py-1.5 text-[12px] text-ink2 transition-colors hover:border-line3 hover:text-ink"
          >
            <Icons.stack className="size-3.5" />
            Across your scope
          </button>
        </div>
        <span className="ml-auto text-[11.5px] text-ink3">
          {symbol ? (
            <>
              viewing <b className="font-medium text-ink2">{symbol}</b> · Switch stock to change
            </>
          ) : (
            "your scored universe"
          )}
        </span>
      </div>

      <NameSwitcher
        open={switcherOpen}
        onOpenChange={setSwitcherOpen}
        stocks={stocks}
        loading={stocksLoading}
        current={symbol}
        onSelect={onSelectSymbol}
        scopeLabel={meta.scopeTag}
      />

      {/* ── DUAL ENTRY ── */}
      {!symbol ? (
        // ===== COLD: landing scan =====
        <div>
          <div className="px-0 pb-7 pt-6 text-center sm:pt-7">
            <h1 className="font-display text-[30px] font-medium text-ink">{meta.landingTitle}</h1>
            <p className="mx-auto mt-2 max-w-[44ch] text-[14px] text-ink2">{meta.landingSubtitle}</p>
            <div className="mx-auto mt-5 max-w-[560px]">
              {/* reused stock-autocomplete, pointed at the scored universe (not the
                  static file); selecting a name routes to the warm single view. */}
              <StockAutocomplete
                stocks={autocompleteStocks}
                placeholder={meta.searchPlaceholder}
                onStockSelect={(s) => onSelectSymbol(s.symbol)}
              />
            </div>
          </div>

          <div className="mb-3.5 flex items-center gap-2.5">
            <span className="eyebrow shrink-0">{meta.landingEyebrow}</span>
            <span className="h-px flex-1 bg-line" />
            <span className="shrink-0 rounded-full border border-line2 bg-surface-2 px-2.5 py-0.5 text-[11px] text-ink2">
              {meta.scopeTag}
            </span>
          </div>

          {landing.isError ? (
            <QueryError message="Couldn't load the scan for your scope." onRetry={landing.onRetry} />
          ) : landing.isLoading ? (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-xl border border-line bg-surface-1" />
              ))}
            </div>
          ) : landingItems.length === 0 ? (
            <Panel className="py-10 text-center text-[13px] text-ink3">
              No scored journeys in your scope yet. Search any name above.
            </Panel>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {landingItems.map((it) => (
                <div key={landing.keyOf(it)}>{landing.renderCard(it, onSelectSymbol)}</div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // ===== WARM: single view =====
        <SingleView
          single={single}
          window={window}
          onWindowChange={onWindowChange}
          active={active}
          setActive={setActive}
          expanded={expanded}
          onToggleExpand={() => setExpanded((v) => !v)}
        />
      )}
    </div>
  );
}

function SingleView({
  single,
  window,
  onWindowChange,
  active,
  setActive,
  expanded,
  onToggleExpand,
}: {
  single: ToolFrameProps["single"];
  window: ToolWindow;
  onWindowChange: (w: ToolWindow) => void;
  active: ActiveDatapoint;
  setActive: (a: ActiveDatapoint) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  if (!single) return null;

  if (single.isError) {
    return <QueryError message="Couldn't load this stock's history." onRetry={single.onRetry} />;
  }
  if (single.isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-xl border border-line bg-surface-1" />
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="h-[420px] animate-pulse rounded-xl border border-line bg-surface-1" />
          <div className="grid gap-3">
            <div className="h-48 animate-pulse rounded-xl border border-line bg-surface-1" />
            <div className="h-48 animate-pulse rounded-xl border border-line bg-surface-1" />
          </div>
        </div>
      </div>
    );
  }
  if (single.notScored) {
    return (
      <Panel className="flex flex-col items-center gap-3 py-14 text-center">
        <Icons.info weight="duotone" className="size-10 text-ink3" />
        <p className="font-medium text-ink">
          {single.notScored.title ?? `${single.identity.name} isn’t scored yet`}
        </p>
        <p className="max-w-sm text-sm text-ink3">{single.notScored.reason}</p>
      </Panel>
    );
  }

  return (
    <div>
      {/* header */}
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="hero-name text-[27px] text-ink">{single.identity.name}</div>
          <div className="num mt-1 text-[12.5px] text-ink2">{single.identity.sub}</div>
        </div>
        {/* chips — identity, right-aligned (the timeframe control now lives by the chart) */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {single.chips.map((c, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-surface-1 px-2.5 py-1.5 text-[11.5px]"
              style={{
                color: c.color ?? "var(--ink2)",
                borderColor: c.color ? `color-mix(in oklab, ${c.color} 33%, transparent)` : "var(--line2)",
              }}
            >
              {c.dot && (
                <span className="size-[7px] rounded-full" style={{ background: c.dot }} />
              )}
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* promoted read — full width, above the grid */}
      {single.promotedRead && (
        <PromotedReadBanner read={single.promotedRead} funnelBackHref={single.funnelBackHref} />
      )}

      {single.buildingHistory ? (
        <Panel className="flex flex-col items-center gap-2 py-14 text-center">
          <Icons.clock weight="duotone" className="size-9 text-ink3" />
          <p className="text-[13px] font-medium text-ink">Only one scored quarter so far</p>
          <p className="max-w-sm text-[12px] text-ink3">
            A journey needs at least two in-force snapshots. As {single.identity.ticker} accrues
            more scored quarters, the recording will fill in here.
          </p>
        </Panel>
      ) : (
        <>
          {/* chart toolbar — the timeframe control + expand toggle sit WITH the chart */}
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <WindowSwitcher value={window} onChange={onWindowChange} dailyBounds={single.dailyBounds} />
            <button
              type="button"
              onClick={onToggleExpand}
              aria-pressed={expanded}
              title={expanded ? "Minimize chart" : "Expand chart"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-surface-2 px-2.5 py-1.5 text-[11.5px] text-ink2 transition-colors hover:border-line3 hover:text-ink"
            >
              {expanded ? (
                <Icons.arrowsInSimple className="size-3.5" />
              ) : (
                <Icons.arrowsOutSimple className="size-3.5" />
              )}
              {expanded ? "Minimize" : "Expand"}
            </button>
          </div>

          {expanded ? (
            // EXPANDED: chart near-hero (full width), readout + summary reflow BELOW.
            <div className="flex flex-col gap-3">
              {single.renderChart(active, setActive)}
              <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
                {single.renderReadout(active)}
                {single.renderSummary()}
              </div>
            </div>
          ) : (
            // MINIMIZED (default): desktop 50/50, mobile single column.
            <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
              {/* left — centerpiece chart, sized to the column */}
              {single.renderChart(active, setActive)}
              {/* right — live readout (top) + static summary (bottom) */}
              <div className="grid gap-3">
                {single.renderReadout(active)}
                {single.renderSummary()}
              </div>
            </div>
          )}
        </>
      )}

      {/* funnel-back */}
      <div className="mt-4 flex justify-end">
        <a
          href={single.funnelBackHref}
          className="inline-flex items-center gap-1.5 text-[12px] text-ink3 transition-colors hover:text-ink"
        >
          <Icons.arrowUpRight className="size-3.5" />
          Full stock detail · {single.identity.ticker}
        </a>
      </div>
    </div>
  );
}
