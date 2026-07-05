"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { useHoldings } from "@/lib/api/hooks/use-holdings";
import { usePortfolioSnapshot } from "@/lib/api/hooks/use-portfolio-snapshot";
import {
  PHS_BAND_META,
  phsColor,
  pillarRows,
  scoreBreakdown,
  attentionHoldings,
} from "@/components/portfolio/lib";
import { cn } from "@/lib/utils";

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface-1 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/12 ring-1 ring-primary/20">
          <Icons.health weight="duotone" className="size-4 text-primary" />
        </span>
        <div>
          <h3 className="font-display text-base font-bold text-ink">Portfolio Health</h3>
          <p className="text-xs text-ink3">Your weighted health score</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// Honest building/empty shell — never a fabricated score.
function BuildingCard({ title, body }: { title: string; body: string }) {
  return (
    <CardShell>
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

export function HealthSpotlight() {
  const snapQ = usePortfolioSnapshot();
  const holdQ = useHoldings();

  if (snapQ.isLoading || holdQ.isLoading) {
    return (
      <CardShell>
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
        body="Add holdings and Vytal computes a weighted portfolio health score — anchored on your holdings' quality, less what concentration and active red flags take off. Nothing is scored until you hold something."
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
  if (snapshot.phs == null || !snapshot.evaluable) {
    return (
      <BuildingCard
        title="Your health read is building"
        body="None of your holdings are scored yet, so there's no portfolio health score to show — we don't invent one. Add names in the scored universe and a weighted read appears here."
      />
    );
  }

  const band = snapshot.band!;
  const color = phsColor(band);
  const rows = pillarRows(snapshot);
  const breakdown = scoreBreakdown(snapshot);
  const coveragePct = Math.round(snapshot.coverage * 100);
  const attention = attentionHoldings(holdings);
  const q = breakdown ? Math.round(breakdown.quality) : null;
  const cD = breakdown ? Math.round(breakdown.constructionDrag) : 0;
  const fD = breakdown ? Math.round(breakdown.flagsDrag) : 0;

  return (
    <CardShell>
      {/* PHS headline + band */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="flex items-end gap-2">
            <span className="num font-display text-[52px] font-bold leading-none" style={{ color }}>
              {snapshot.phs}
            </span>
            <span className="mb-1 font-display text-base font-semibold" style={{ color }}>
              {PHS_BAND_META[band].label}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-ink3">
            Reflects <span className="num text-ink">{coveragePct}%</span> of your book by value
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {snapshot.provisional && (
            <span className="rounded-md bg-warning/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
              Provisional
            </span>
          )}
          {snapshot.ceilingApplied && (
            <span className="rounded-md bg-info/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-info">
              Coverage-capped
            </span>
          )}
        </div>
      </div>

      {/* pillar mini-bars — Quality (anchor) · Structure · Signals (penalty-only) */}
      <div className="mt-4 space-y-2.5">
        {rows.map((p, i) => (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, x: 8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-ink3">
                {p.label}
                {p.key === "quality" && <span className="ml-1 text-[10px] text-ink3/60">anchor</span>}
              </span>
              <span className="num font-medium" style={{ color: p.color }}>
                {p.value != null ? Math.round(p.value) : "—"}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-3/60">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${p.value ?? 0}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: p.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* anchor − deductions reconciliation (real stored numbers, never recomputed) */}
      {breakdown && q != null && (
        <div className="mt-4 rounded-xl border border-line2 bg-surface-2/40 p-3 text-xs leading-relaxed text-ink3">
          <Icons.info weight="duotone" className="mr-1 inline size-3.5 align-text-bottom text-primary" />
          Quality anchor <span className="num text-ink">{q}</span>
          {cD > 0 ? (
            <> · construction −<span className="num text-warning">{cD}</span></>
          ) : (
            <> · construction −<span className="num text-success">0</span></>
          )}
          {fD > 0 ? (
            <> · active flags −<span className="num text-warning">{fD}</span></>
          ) : (
            <> · no active flags</>
          )}{" "}
          → <span className="num" style={{ color }}>{snapshot.phs}</span>
          {attention.count > 0 && (
            <>
              . <span className="num text-ink">{attention.count}</span> holding
              {attention.count === 1 ? "" : "s"} need{attention.count === 1 ? "s" : ""} a look.
            </>
          )}
        </div>
      )}

      <Button asChild variant="outline" size="sm" className={cn("mt-4 w-full")}>
        <Link href="/portfolio?tab=health">
          Open portfolio health
          <Icons.arrowRight weight="bold" className="size-3.5" />
        </Link>
      </Button>
    </CardShell>
  );
}
