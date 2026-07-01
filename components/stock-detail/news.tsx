"use client";

/**
 * Disclosures & Announcements tab — TWO genuine streams in one place.
 *
 *   • Filings (NSE) — official regulatory disclosures. The raw `headline` is a
 *     filing-type bucket; we show a clean mapped label (raw fallback for unknown
 *     buckets — never dropped) and lead with `summary`, the real "what happened".
 *     Links to the source PDF.
 *   • News (press) — Google News coverage. Real article title, publication name,
 *     external link.
 *
 * Replaces the legacy phantom news.tsx (10 hardcoded mock articles, 3 fake filter
 * dropdowns, fiction NewsArticle interface — all removed). Every field is real or
 * honest-empty; null AI fields (sentiment) are marked Phase-2 stubs, never blanks.
 * Tokens only, matched to the Health/Overview rhythm (eyebrow · Panel · .num).
 *
 * DISPLAY discipline: this tab shows filings and press. It does not summarize, rate,
 * or advise.
 */

import { useEffect, useMemo, useState } from "react";
import { useStockNews } from "@/lib/api/hooks/use-stock-news";
import { getFilingTypeLabel, FAMILY_META } from "@/lib/news/filing-types";
import type { NewsSourceType, StockNewsItem } from "@/types/news";
import { Icons, type Icon } from "@/lib/icons";
import { isApiError } from "@/lib/api/client";
import { QueryError } from "@/components/ui/query-error";
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { Panel, SectionEyebrow, tint } from "./health/shared";

const WINDOW_DAYS = 90;
const PAGE_SIZE = 20;
const MAX_LIMIT = 50; // backend hard cap on `limit`

// Stream identity — filings and press must never look alike, so each owns an accent.
const STREAMS: Record<
  NewsSourceType,
  { label: string; sub: string; icon: Icon; accent: string }
> = {
  nse_announcement: {
    label: "Filings",
    sub: "NSE regulatory disclosures",
    icon: Icons.results,
    accent: "var(--p-found)",
  },
  google_news: {
    label: "News",
    sub: "Press coverage",
    icon: Icons.news,
    accent: "var(--p-mom)",
  },
};

/** "24 Jun '26 · 4:11 PM" — publication moment, compact. */
function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const month = d.toLocaleString("en-GB", { month: "short" });
  const year = String(d.getFullYear()).slice(2);
  const h = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${day} ${month} '${year} · ${h12}:${mins} ${ampm}`;
}

// ── small shared row primitives ────────────────────────────────────────────────

/** High-impact marker — significance (identity), not a good/bad grade. */
function HighImpactBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={tint("var(--p-mkt)", 12, 30)}
    >
      <Icons.bolt weight="fill" className="h-3 w-3" />
      High impact
    </span>
  );
}

/** Phase-2 AI stub — marked, descriptive, clearly not-live (never a blank slot). */
function SentimentStub() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line2 bg-surface-2 px-2.5 py-1 text-[10.5px] text-ink3">
      <Icons.brain className="h-3 w-3" />
      AI sentiment · Phase 2
    </span>
  );
}

/** An external/PDF source link. */
function SourceLink({
  href,
  label,
  icon: Glyph,
  accent,
}: {
  href: string;
  label: string;
  icon: Icon;
  accent: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line2 bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:border-line3 hover:bg-surface-3"
      style={{ color: accent }}
    >
      <Glyph className="h-3.5 w-3.5" />
      {label}
      <Icons.arrowUpRight className="h-3 w-3" />
    </a>
  );
}

// ── filing row (NSE stream) ─────────────────────────────────────────────────────
function FilingRow({ item }: { item: StockNewsItem }) {
  const filing = getFilingTypeLabel(item.headline);
  const { accent } = FAMILY_META[filing.family];
  const hasFullText = item.extractionStatus === "extracted";

  return (
    <Panel className="relative overflow-hidden p-0">
      {/* left-edge accent bar — family color (categorical identity, not severity) */}
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accent }} />
      <div className="p-5 pl-6">
        {/* head: filing-type label (primary tag, family-tinted) + impact · datetime */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11.5px] font-semibold"
            style={tint(accent, 12, 30)}
          >
            <Icons.results className="h-3.5 w-3.5" />
            {filing.label}
          </span>
          {item.isHighImpact && <HighImpactBadge />}
          <span className="num ml-auto shrink-0 text-[12px] text-ink3">
            {fmtDateTime(item.publishedAt)}
          </span>
        </div>

        {/* hero: the real "what happened" lives in summary */}
        {item.summary ? (
          <p className="text-[13.5px] leading-relaxed text-ink">{item.summary}</p>
        ) : (
          <p className="text-[12.5px] italic text-ink3">
            No filing excerpt provided — open the source filing for details.
          </p>
        )}

        {/* footer: source PDF · full-text affordance · Phase-2 stub */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-line pt-3.5">
          {item.pdfUrl && (
            <SourceLink
              href={item.pdfUrl}
              label="View filing (PDF)"
              icon={Icons.results}
              accent={FAMILY_META[filing.family].accent}
            />
          )}
          {hasFullText && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line2 bg-surface-2 px-2.5 py-1 text-[10.5px] text-ink2">
              <Icons.check className="h-3 w-3" />
              Full text available
            </span>
          )}
          <span className="ml-auto">
            <SentimentStub />
          </span>
        </div>
      </div>
    </Panel>
  );
}

// ── news row (Google stream) ─────────────────────────────────────────────────────
function NewsRow({ item }: { item: StockNewsItem }) {
  const { accent } = STREAMS.google_news;

  return (
    <Panel className="relative overflow-hidden p-0">
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accent }} />
      <div className="p-5 pl-6">
        {/* head: publication + impact · date */}
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          {item.category && (
            <span
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11.5px] font-medium"
              style={tint(accent, 12, 30)}
            >
              <Icons.news className="h-3.5 w-3.5" />
              {item.category}
            </span>
          )}
          {item.isHighImpact && <HighImpactBadge />}
          <span className="num ml-auto shrink-0 text-[12px] text-ink3">
            {fmtDateTime(item.publishedAt)}
          </span>
        </div>

        {/* hero: the real article title */}
        <h3 className="text-[15px] font-semibold leading-snug text-ink">
          {item.headline}
        </h3>
        {item.summary && item.summary.trim() !== item.headline.trim() && (
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink2">{item.summary}</p>
        )}

        {/* footer: article link · Phase-2 stub */}
        <div className="mt-4 grid sm:flex flex-wrap items-center gap-2.5 border-t border-line pt-3.5">
          {item.externalUrl && (
            <SourceLink
              href={item.externalUrl}
              label="Read article"
              icon={Icons.news}
              accent={accent}
            />
          )}
          <span className="mx-auto sm:ml-auto">
            <SentimentStub />
          </span>
        </div>
      </div>
    </Panel>
  );
}

// ── the tab ──────────────────────────────────────────────────────────────────────
export default function News({ symbol }: { symbol: string }) {
  // Default to Filings — the regulatory truth the platform is built around.
  const [stream, setStream] = useState<NewsSourceType>("nse_announcement");
  const [highImpactOnly, setHighImpactOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Reset paging when the view (stream / filter / stock) changes.
  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [stream, highImpactOnly, symbol]);

  const { data, isLoading, isError, error, refetch, isFetching } = useStockNews(symbol, {
    type: stream,
    days: WINDOW_DAYS,
    limit,
    highImpact: highImpactOnly ? true : undefined,
  });

  const meta = STREAMS[stream];
  // Deduplicate by normalized headline — the feed occasionally ingests the same story
  // twice with different DB IDs (Google News re-fetches). Keep the first occurrence
  // (most recent, since the backend orders by publishedAt DESC).
  const rows = useMemo(() => {
    const raw = data?.data.news ?? [];
    const seen = new Set<string>();
    return raw.filter((item) => {
      const key = item.headline.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data?.data.news]);
  const total = data?.data.pagination.total ?? 0;
  // Show "Load more" only when:
  //   • total > 10 — dataset is large enough to warrant it (don't show for tiny sets)
  //   • limit < total — there are still items on the backend we haven't fetched yet
  //   • limit < MAX_LIMIT — we haven't hit the backend cap
  // When limit >= total, everything is already in the frontend → hide unconditionally.
  const allFetched = limit >= total;
  const canLoadMore = !allFetched && total > 10 && limit < MAX_LIMIT;

  const headerSub = useMemo(
    () =>
      data?.data.name
        ? `NSE regulatory filings and press coverage for ${data.data.name}.`
        : "NSE regulatory filings and press coverage — filings and press, not a generic news feed.",
    [data?.data.name],
  );

  if (!symbol) return null;

  return (
    <div className="space-y-5">
      {/* header */}
      <div>
        <SectionEyebrow
          label="Disclosures & Announcements"
          icon={Icons.news}
          accent="var(--p-found)"
        />
        <p className="-mt-2 text-[12.5px] text-ink3">{headerSub}</p>
      </div>

      {/* controls: stream toggle (primary) + the ONE real filter */}
      <div className="flex flex-wrap items-center gap-3">
        {/* stream segmented toggle */}
        <div className="inline-flex rounded-xl border border-line bg-surface-1 p-1 max-sm:w-full">
          {(Object.keys(STREAMS) as NewsSourceType[]).map((key) => {
            const s = STREAMS[key];
            const active = stream === key;
            const Glyph = s.icon;
            return (
              <button
                key={key}
                onClick={() => setStream(key)}
                className={`inline-flex w-full justify-center items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                  active ? "text-ink" : "text-ink3 hover:text-ink"
                }`}
                style={active ? tint(s.accent, 12, 30) : undefined}
              >
                <Glyph className="h-3.5 w-3.5" />
                {s.label}
                <span className=" max-sm:hidden text-[11px] text-ink3">· {s.sub}</span>
              </button>
            );
          })}
        </div>

        {/* high-impact toggle — the single real filter (isHighImpact) */}
        <button
          onClick={() => setHighImpactOnly((v) => !v)}
          aria-pressed={highImpactOnly}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[12.5px] font-medium transition-colors ${
            highImpactOnly
              ? ""
              : "border-line bg-surface-1 text-ink3 hover:text-ink"
          }`}
          style={highImpactOnly ? tint("var(--p-mkt)", 12, 36) : undefined}
        >
          <Icons.bolt weight={highImpactOnly ? "fill" : "regular"} className="h-3.5 w-3.5" />
          High impact only
        </button>
      </div>

      {/* states */}
      {isLoading ? (
        <QuerySkeleton rows={5} rowHeight="h-28" />
      ) : isError ? (
        (() => {
          const maybeApiErr = (error as unknown as { apiError?: unknown })?.apiError;
          const apiErr = isApiError(maybeApiErr) ? maybeApiErr : null;
          return (
            <QueryError
              message={
                apiErr?.status === 404
                  ? `“${symbol}” isn't part of the tracked universe yet.`
                  : `Something went wrong loading disclosures for ${symbol}.`
              }
              onRetry={() => refetch()}
            />
          );
        })()
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface-1 px-5 py-12 text-center">
          <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full border border-line2 bg-surface-2">
            <meta.icon className="size-5 text-ink3" />
          </div>
          <p className="text-[13px] font-medium text-ink2">
            {highImpactOnly
              ? `No high-impact ${meta.label.toLowerCase()} on record for ${data?.data.name ?? symbol} in the last ${WINDOW_DAYS} days.`
              : `No ${meta.label.toLowerCase()} on record for ${data?.data.name ?? symbol} in the last ${WINDOW_DAYS} days.`}
          </p>
          <p className="mt-1 text-[12px] text-ink3">
            {stream === "nse_announcement"
              ? "Try the News stream for press coverage."
              : "Try the Filings stream for NSE regulatory disclosures."}
          </p>
        </div>
      ) : (
        <>
          {/* count line */}
          <p className="text-[12px] text-ink3">
            Showing <span className="num font-medium text-ink2">{rows.length}</span> of{" "}
            <span className="num font-medium text-ink2">{total}</span>{" "}
            {meta.label.toLowerCase()} from the last {WINDOW_DAYS} days
            {highImpactOnly ? " · high impact only" : ""}.
          </p>

          {/* rows */}
          <div className="space-y-3">
            {rows.map((item) =>
              stream === "nse_announcement" ? (
                <FilingRow key={item.id} item={item} />
              ) : (
                <NewsRow key={item.id} item={item} />
              ),
            )}
          </div>

          {/* load more — real pagination via the endpoint's limit/total */}
          {canLoadMore && (
            <div className="flex justify-center pt-1">
              <button
                onClick={() => setLimit((l) => Math.min(l + PAGE_SIZE, MAX_LIMIT))}
                disabled={isFetching}
                className="inline-flex items-center gap-2 rounded-lg border border-line2 bg-surface-1 px-5 py-2 text-[12.5px] font-medium text-ink transition-colors hover:bg-surface-2 disabled:opacity-60"
              >
                {isFetching ? "Loading…" : "Load more"}
                <Icons.caretDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
