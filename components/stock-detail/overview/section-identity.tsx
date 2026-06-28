"use client";

/**
 * §1 — Company Identity & What It Does. DISPLAY (honest factual).
 * Sources: /overview (editorial profile) + /price (price line, market cap, 52W) +
 * /health (sector/identity). Every sub-piece loads/honest-empties on its own; a
 * missing source never blanks the section. NO sector-template prose — the
 * "what it does" body is the real editorial row or an honest "not yet available".
 */

import { Icons } from "@/lib/icons";
import { useStockOverview } from "@/lib/api/hooks/use-stock-overview";
import { useStockPrice } from "@/lib/api/hooks/use-stock-price";
import { useStockHealth } from "@/lib/api/hooks/use-stock-health";
import { Panel } from "../health/shared";
import { Section, Chip, StatTile, HonestEmpty, DASH, fmtPrice, fmtSignedPct, fmtMarketCap, toneColor } from "./shared";

export function IdentitySection({ symbol }: { symbol: string }) {
  const { data: overview } = useStockOverview(symbol);
  const { data: price } = useStockPrice(symbol);
  const { data: health } = useStockHealth(symbol);

  const name = overview?.name ?? health?.identity.name ?? symbol;
  const sector = health?.identity.sector?.displayName ?? null;
  const industry = overview?.industry ?? null;
  const listedSince = overview?.listedSince ?? null;
  const cur = price?.current;

  const w52 =
    cur?.week52High != null && cur?.week52Low != null
      ? `${fmtPrice(cur.week52Low)} – ${fmtPrice(cur.week52High)}`
      : DASH;

  const hasProfileBody =
    overview?.hasProfile && (overview.coreBusiness || overview.revenueModel || overview.businessTags.length > 0);

  return (
    <Section id="overview-identity" label="Company" icon={Icons.building} accent="var(--p-found)">
      {/* Gradient hero card — mirrors the Health tab's first-section .card-hero treatment */}
      <div className="card-hero relative overflow-hidden rounded-2xl border border-line2">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full opacity-60"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--p-found) 22%, transparent), transparent 68%)" }}
        />
        {/* Identity header — name, symbol, sector, industry, listed-since, price line */}
        <div className="relative flex flex-col gap-4 border-b border-line2 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h2 className="font-display text-2xl font-semibold text-ink">{name}</h2>
              <span className="num text-[13px] text-ink3">{symbol}</span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {sector && <Chip>{sector}</Chip>}
              {industry && <Chip tone="accent">{industry}</Chip>}
              {listedSince != null && (
                <Chip>
                  <Icons.calendar className="h-3 w-3" />
                  Listed <span className="num">{listedSince}</span>
                </Chip>
              )}
            </div>
          </div>

          {/* Price line — current-state fact, neutral (no buy-grade colouring) */}
          <div className="shrink-0 text-left lg:text-right">
            {cur?.price != null ? (
              <>
                <div className="num text-2xl font-semibold text-ink">{fmtPrice(cur.price)}</div>
                <div className="num mt-1 text-[12.5px]">
                  <span style={{ color: toneColor(cur.dayChangePct) }}>{fmtSignedPct(cur.dayChangePct)}</span>{" "}
                  <span className="text-ink3">today</span>
                </div>
                {price?.asOfDate && (
                  <div className="num mt-0.5 text-[10.5px] text-ink3">as of {price.asOfDate}</div>
                )}
              </>
            ) : (
              <div className="text-[12px] text-ink3">Price not available</div>
            )}
          </div>
        </div>

        {/* Quick facts strip */}
        <div className="relative grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
          <StatTile label="Market cap" value={fmtMarketCap(cur?.marketCap)} />
          <StatTile label="52-week range" value={w52} />
          <StatTile
            label="From 52W high"
            value={cur?.pctFrom52WHigh != null ? fmtSignedPct(cur.pctFrom52WHigh) : DASH}
          />
        </div>
      </div>

      {/* What it does — real editorial prose + tags, or an honest not-available state */}
      <div className="mt-3">
        {hasProfileBody ? (
          <Panel>
            <div className="grid gap-5 lg:grid-cols-2">
              {overview?.coreBusiness && (
                <div>
                  <div className="eyebrow mb-2">What it does</div>
                  <p className="text-[13px] leading-relaxed text-ink2">{overview.coreBusiness}</p>
                </div>
              )}
              {overview?.revenueModel && (
                <div>
                  <div className="eyebrow mb-2">How it earns</div>
                  <p className="text-[13px] leading-relaxed text-ink2">{overview.revenueModel}</p>
                </div>
              )}
            </div>
            {overview && overview.businessTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                {overview.businessTags.map((t) => (
                  <Chip key={t} tone="accent">
                    {t}
                  </Chip>
                ))}
              </div>
            )}
          </Panel>
        ) : (
          <HonestEmpty>Company profile not yet available for this stock.</HonestEmpty>
        )}
      </div>
    </Section>
  );
}
