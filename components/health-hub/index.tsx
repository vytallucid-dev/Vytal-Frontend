"use client";

import { useState } from "react";
import Link from "next/link";
import { useUniverseHealth } from "@/lib/api/hooks/use-universe-health";
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { QueryError } from "@/components/ui/query-error";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { BriefingTab } from "./briefing-tab";
import { FlagsTab } from "./flags-tab";
import { ScreenTab } from "./screen-tab";

// ─────────────────────────────────────────────────────────────────────────────
// The Health Hub — flagship surface, faithful to docs/vytal_health_hub_full.html.
// Three tabs (Briefing live · Flags & Screen marked `soon` per the prototype) over
// a scope switcher (Universe LIVE + default; Portfolio/Watchlist coming-soon; per-PG
// funnels to the existing Peer Groups surface). All Universe data is real, from
// GET /api/universe/health. Honest calm-states stand where the data is sparse.
// ─────────────────────────────────────────────────────────────────────────────

type TabId = "brief" | "flags" | "screen";
const TABS: { id: TabId; label: string; icon: React.ReactNode; soon: boolean }[] = [
  { id: "brief", label: "Briefing", icon: <Icons.results className="size-[15px]" />, soon: false },
  { id: "flags", label: "Flags & Patterns", icon: <Icons.warning className="size-[15px]" />, soon: false },
  { id: "screen", label: "Screen", icon: <Icons.screener className="size-[15px]" />, soon: false },
];

type ScopeId = "portfolio" | "watchlist" | "universe";
const SCOPES: { id: ScopeId; label: string; live: boolean }[] = [
  { id: "portfolio", label: "My Portfolio", live: false },
  { id: "watchlist", label: "Watchlist", live: false },
  { id: "universe", label: "Scored Universe", live: true },
];

function ComingSoonScope({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line2 px-8 py-20 text-center">
      <Icons.portfolio className="mx-auto mb-4 size-8 text-ink3 opacity-60" />
      <h3 className="font-display text-[20px] font-medium text-ink2">{label} — connect your holdings</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink3">
        This scope re-runs the same Briefing, Flags and Screen over your own {label.toLowerCase()}.
        The switcher is live from day one; {label.toLowerCase()} health lights up here the moment
        holdings are connected — no rebuild. Nothing is shown until then, by design.
      </p>
      <Link
        href="/research/peer-groups"
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-surface-1 px-3.5 py-2 text-[12px] text-ink2 transition-colors hover:border-line3 hover:text-ink"
      >
        Browse the Scored Universe by peer group
        <Icons.arrowUpRight className="size-3.5" />
      </Link>
    </div>
  );
}

export function HealthHub() {
  const [tab, setTab] = useState<TabId>("brief");
  const [scope, setScope] = useState<ScopeId>("universe");
  const { data, isLoading, isError, error, refetch } = useUniverseHealth();

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0">
      {/* slim control strip */}
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-line pb-3 pt-1">
        {/* tabs */}
        <div className="flex gap-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                tab === t.id ? "bg-surface-3 text-ink" : "text-ink3 hover:bg-surface-1 hover:text-ink2",
              )}
            >
              {t.icon}
              {t.label}
              {t.soon && (
                <span className="rounded-[4px] border border-line2 px-1.5 py-px text-[8.5px] uppercase tracking-wider text-ink3">
                  soon
                </span>
              )}
            </button>
          ))}
        </div>

        <span className="h-5 w-px bg-line2" />

        {/* scopes */}
        <div className="flex flex-wrap gap-1.5">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScope(s.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] transition-colors",
                scope === s.id
                  ? "border-line3 bg-surface-3 font-medium text-ink"
                  : "border-line2 bg-surface-1 text-ink2 hover:border-line3 hover:text-ink",
              )}
            >
              {s.live && (
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: scope === s.id ? "var(--p-own)" : "var(--ink3)" }}
                />
              )}
              {s.label}
            </button>
          ))}
          <Link
            href="/research/peer-groups"
            className="inline-flex items-center gap-1 rounded-lg border border-line2 bg-surface-1 px-3 py-1.5 text-[12px] text-ink3 transition-colors hover:border-line3 hover:text-ink2"
          >
            <Icons.plus className="size-3" />
            Peer group
          </Link>
        </div>

        {/* as-of indicator */}
        <span className="ml-auto text-[11.5px] text-ink3">
          {scope === "universe" && data?.scored ? (
            <>
              as of <span className="num text-ink2">{data.asOfDate}</span> · {data.periodKey}
            </>
          ) : (
            <>since your last look</>
          )}
        </span>
      </div>

      {/* body */}
      {scope !== "universe" ? (
        <ComingSoonScope label={SCOPES.find((s) => s.id === scope)!.label} />
      ) : isLoading ? (
        <QuerySkeleton rows={6} rowHeight="h-16" className="mt-2" />
      ) : isError ? (
        <QueryError
          message={(error as Error)?.message ?? "Failed to load the scored universe"}
          onRetry={() => refetch()}
          className="mt-2"
        />
      ) : !data || !data.scored || !data.aggregate ? (
        <div className="rounded-xl border border-line bg-surface-1 py-16 text-center">
          <p className="text-sm font-medium text-ink2">No scored universe yet</p>
          <p className="mx-auto mt-1 max-w-sm text-[12px] text-ink3">
            There are no in-force snapshots to aggregate. Coverage is rolling out.
          </p>
        </div>
      ) : tab === "brief" ? (
        <BriefingTab view={data} />
      ) : tab === "flags" ? (
        <FlagsTab view={data} />
      ) : (
        <ScreenTab view={data} />
      )}
    </div>
  );
}
