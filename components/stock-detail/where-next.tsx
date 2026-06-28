"use client";

/**
 * Shared "Where to next" nav — the colourful routing cards that close out every
 * stock-detail tab. One source so the Overview, Health, Fundamentals, Activity and
 * Technical tabs all get the same lively, token-coloured destinations (no pale
 * footers). Pass `exclude` with the current tab id so a tab never links to itself.
 */

import Link from "next/link";
import { Icons, type Icon } from "@/lib/icons";
import { SectionEyebrow, tint } from "./health/shared";

export interface NavDest {
  tab: string;
  icon: Icon;
  title: string;
  blurb: string;
  accent: string;
}

const DESTINATIONS: NavDest[] = [
  { tab: "overview", icon: Icons.compass, title: "Overview", blurb: "The lobby — a glance of the stock across every domain.", accent: "var(--p-found)" },
  { tab: "health", icon: Icons.health, title: "Health Score", blurb: "The full composite, four pillars, findings and trajectory.", accent: "var(--c-healthy)" },
  { tab: "fundamentals", icon: Icons.scales, title: "Fundamentals", blurb: "Quarterly spine, annual ratios and the balance sheet.", accent: "var(--p-own)" },
  { tab: "activity", icon: Icons.building, title: "Activity", blurb: "Ownership history, pledging, insider and block deals.", accent: "var(--p-found)" },
  { tab: "technical", icon: Icons.chartLine, title: "Technical", blurb: "Price structure and the market-pillar reads.", accent: "var(--p-mkt)" },
  { tab: "events", icon: Icons.calendar, title: "Events", blurb: "Earnings dates, dividends and corporate actions.", accent: "var(--p-mom)" },
  { tab: "news", icon: Icons.news, title: "News", blurb: "Recent announcements and coverage.", accent: "var(--p-found)" },
];

function NavCard({ symbol, dest }: { symbol: string; dest: NavDest }) {
  const Glyph = dest.icon;
  return (
    <Link
      href={`/research/stock-screener/${symbol}?tab=${dest.tab}`}
      className="group flex items-start gap-3 rounded-2xl border border-line bg-surface-1 p-4 transition-colors hover:border-line3 hover:bg-surface-2"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border" style={tint(dest.accent)}>
        <Glyph weight="duotone" className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
          {dest.title}
          <Icons.arrowUpRight className="h-3 w-3 text-ink3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
        <p className="mt-0.5 text-[12px] leading-relaxed text-ink3">{dest.blurb}</p>
      </div>
    </Link>
  );
}

export function WhereNext({ symbol, exclude = [] }: { symbol: string; exclude?: string[] }) {
  const dests = DESTINATIONS.filter((d) => !exclude.includes(d.tab));
  return (
    <section id="whats-next" className="scroll-mt-24">
      <SectionEyebrow label="Where to next" icon={Icons.compass} accent="var(--p-mkt)" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dests.map((d) => (
          <NavCard key={d.tab} symbol={symbol} dest={d} />
        ))}
      </div>
    </section>
  );
}
