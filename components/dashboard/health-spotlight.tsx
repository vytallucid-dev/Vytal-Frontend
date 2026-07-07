"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { useHoldings } from "@/lib/api/hooks/use-holdings";
import { usePortfolioSnapshot } from "@/lib/api/hooks/use-portfolio-snapshot";
import type { PfFinding, PortfolioSnapshot } from "@/types/portfolio";
import {
  CONSTRUCTION_BAND_META,
  COVERAGE_COLOR,
  HEALTH_BAND_META,
  allFindings,
  attentionHoldings,
  constructionColor,
  findingRead,
  healthColor,
  scoreBreakdown,
} from "@/components/portfolio/lib";

function CardShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface-1 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/12 ring-1 ring-primary/20">
          <Icons.health weight="duotone" className="size-4 text-primary" />
        </span>
        <div>
          <h3 className="font-display text-base font-bold text-ink">{title}</h3>
          <p className="text-xs text-ink3">{sub}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// Honest building/empty shell — never a fabricated score.
function BuildingCard({ title, body }: { title: string; body: string }) {
  return (
    <CardShell title="Portfolio Health" sub="Are the things you own sound?">
      <div className="mt-5 flex flex-1 flex-col justify-center rounded-xl border border-dashed border-line2 bg-surface-2/40 p-4">
        <p className="font-display text-base font-semibold text-ink">{title}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-ink3">{body}</p>
      </div>
      <Button asChild variant="outline" size="sm" className="mt-4 w-full">
        <Link href="/portfolio?tab=health">
          Open portfolio
          <Icons.arrowRight weight="bold" className="size-3.5" />
        </Link>
      </Button>
    </CardShell>
  );
}

// ── the single hook line — the loudest attention-worthy finding, so the glance pulls in. ──
function hookFinding(s: PortfolioSnapshot): PfFinding | null {
  const order: Record<string, number> = { Concern: 0, Caution: 1, Neutral: 2, Constructive: 3 };
  const loud = allFindings(s)
    .filter((f) => f.loud && f.family !== "PV" && (f.tone === "Concern" || f.tone === "Caution"))
    .sort((a, b) => order[a.tone] - order[b.tone]);
  return loud[0] ?? null;
}

export function HealthSpotlight() {
  const snapQ = usePortfolioSnapshot();
  const holdQ = useHoldings();

  if (snapQ.isLoading || holdQ.isLoading) {
    return (
      <CardShell title="Portfolio Health" sub="Are the things you own sound?">
        <div className="mt-5 flex-1 animate-pulse rounded-xl bg-surface-2/50" />
      </CardShell>
    );
  }

  const snapshot = snapQ.data?.snapshot ?? null;
  const holdings = holdQ.data?.holdings ?? [];
  const hasHoldings = snapQ.data?.hasHoldings ?? holdings.length > 0;

  if (!hasHoldings) {
    return (
      <BuildingCard
        title="No health read yet"
        body="Add holdings and Vytal computes a weighted portfolio health score — your holdings' quality, less what active red flags take off. Nothing is scored until you hold something."
      />
    );
  }
  if (!snapshot) {
    return (
      <BuildingCard
        title="Your health read is preparing"
        body="Portfolio health is computed when your book changes or on the nightly refresh — not on the fly. It appears here once that lands; nothing is estimated in the meantime."
      />
    );
  }

  // ── health null — a confident Construction glance + the unlock promise (the v1.2 payoff) ──
  if (!snapshot.healthRead || snapshot.healthRead.value == null || !snapshot.healthRead.band) {
    const c = snapshot.constructionRead;
    const color = constructionColor(c.band);
    return (
      <CardShell title="How your book is built" sub="Is this book safely held?">
        <div className="mt-4 flex items-end gap-2.5">
          <span className="num font-display text-[52px] font-bold leading-none" style={{ color }}>
            {Math.round(c.value)}
          </span>
          <span className="mb-1 font-display text-base font-semibold" style={{ color }}>
            {CONSTRUCTION_BAND_META[c.band].label}
          </span>
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink2">
          <Icons.spark weight="fill" className="mt-0.5 size-4 shrink-0" style={{ color: COVERAGE_COLOR.scored }} />
          <span>Health unlocks as we score your holdings.</span>
        </p>
        <div className="flex-1" />
        <Button asChild variant="outline" size="sm" className="mt-4 w-full">
          <Link href="/portfolio?tab=health">
            Open portfolio health
            <Icons.arrowRight weight="bold" className="size-3.5" />
          </Link>
        </Button>
      </CardShell>
    );
  }

  const h = snapshot.healthRead;
  const band = h.band!;
  const color = healthColor(band);
  const breakdown = scoreBreakdown(snapshot);
  const cs = snapshot.coverageState;
  const coveragePct = Math.round(cs.scoredWeight * 100);
  const attention = attentionHoldings(holdings);
  const hook = hookFinding(snapshot);
  const q = breakdown ? Math.round(breakdown.quality) : null;
  const fD = breakdown ? Math.round(breakdown.flagsDrag) : 0;

  const hookText = hook
    ? hook.label
    : attention.count > 0
      ? `${attention.names[0]} needs a look`
      : "Sound overall — nothing needs a look";

  return (
    <CardShell title="Portfolio Health" sub="Are the things you own sound?">
      {/* Health Score + band */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="flex items-end gap-2">
            <span className="num font-display text-[52px] font-bold leading-none" style={{ color }}>
              {h.value}
            </span>
            <span className="mb-1 font-display text-base font-semibold" style={{ color }}>
              {HEALTH_BAND_META[band].label}
            </span>
          </div>
          {/* mandatory coverage micro-line — true / uncapped */}
          <p className="mt-1.5 text-xs text-ink3">
            Covers <span className="num text-ink">{cs.scoredCount}</span> of{" "}
            <span className="num text-ink">{cs.totalCount}</span> · {coveragePct}% of value
          </p>
        </div>
        {h.provisional && (
          <span className="rounded-md bg-warning/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
            Provisional
          </span>
        )}
      </div>

      {/* two-step reconciliation — Quality anchor − active flags → Health (never blended) */}
      {breakdown && q != null && (
        <div className="mt-4 rounded-xl border border-line2 bg-surface-2/40 p-3 text-xs leading-relaxed text-ink3">
          <Icons.info weight="duotone" className="mr-1 inline size-3.5 align-text-bottom text-primary" />
          Quality anchor <span className="num text-ink">{q}</span>
          {fD > 0 ? (
            <> · active flags −<span className="num text-warning">{fD}</span></>
          ) : (
            <> · no active flags</>
          )}{" "}
          → <span className="num" style={{ color }}>{h.value}</span>
        </div>
      )}

      {/* one hook line — the loudest thing worth a look, else calm */}
      <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-ink2">
        {hook ? (
          <>
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: color }} />
            <span>
              <span className="font-medium text-ink">{hook.label}.</span>{" "}
              {findingRead(hook) !== hook.label ? findingRead(hook) : ""}
            </span>
          </>
        ) : (
          <>
            <Icons.check weight="bold" className="mt-0.5 size-4 shrink-0" style={{ color: "var(--rec)" }} />
            <span>{hookText}</span>
          </>
        )}
      </p>

      <div className="flex-1" />
      <Button asChild variant="outline" size="sm" className="mt-4 w-full">
        <Link href="/portfolio?tab=health">
          Open portfolio health
          <Icons.arrowRight weight="bold" className="size-3.5" />
        </Link>
      </Button>
    </CardShell>
  );
}
