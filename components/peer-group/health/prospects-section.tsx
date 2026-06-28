"use client";

import Link from "next/link";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import { SectionEyebrow } from "@/components/stock-detail/health/shared";
import { classifyMembers, TONE_VAR, type Classified } from "./lib";
import type { PeerGroupMemberView } from "@/types/peer-group";

function PhCard({ c }: { c: Classified }) {
  const tone = TONE_VAR[c.tone];
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-line bg-surface-1 p-4"
      style={{ paddingLeft: 18 }}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: tone }} />
      <div className="flex items-center gap-2.5">
        <span className="num text-[14px] font-medium text-ink">{c.m.symbol}</span>
        <span className="num text-[12px] text-ink2">{Math.round(c.m.composite)}</span>
        <span
          className="ml-auto rounded-md px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide"
          style={{ color: tone, background: `color-mix(in srgb, ${tone} 14%, transparent)` }}
        >
          {c.tag}
        </span>
      </div>
      <p className="my-2.5 text-[12px] leading-snug text-ink2">{c.why}</p>
      <Link
        href={`/research/stock-screener/${c.m.symbol}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-surface-2 px-2.5 py-1.5 text-[11px] text-ink transition-colors hover:border-line3 hover:bg-surface-3"
      >
        Open health
        <Icons.arrowUpRight className="size-3" />
      </Link>
    </div>
  );
}

function Column({
  title,
  tone,
  icon,
  rows,
  emptyText,
}: {
  title: string;
  tone: string;
  icon: React.ReactNode;
  rows: Classified[];
  emptyText: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold" style={{ color: tone }}>
        {icon}
        {title}
      </div>
      {rows.length ? (
        <StaggerGroup className="flex flex-col gap-2.5">
          {rows.map((c) => (
            <StaggerItem key={c.m.symbol}>
              <PhCard c={c} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      ) : (
        <div className="rounded-xl border border-line bg-surface-1 px-4 py-8 text-center text-[11.5px] text-ink3">
          {emptyText}
        </div>
      )}
    </div>
  );
}

export function ProspectsSection({ members }: { members: PeerGroupMemberView[] }) {
  const { prospects, hazards } = classifyMembers(members);

  return (
    <section>
      <SectionEyebrow label="Where to look" icon={Icons.target} accent="var(--p-own)" pill="funnels into each stock's page" />
      <Reveal>
        <div className="grid gap-3.5 lg:grid-cols-2">
          <Column
            title="Worth a closer look"
            tone="var(--c-healthy)"
            icon={<Icons.search className="size-4" />}
            rows={prospects}
            emptyText="No standout prospects — the pond's strength sits in its mid-pack."
          />
          <Column
            title="Hazards to avoid"
            tone="var(--c-fragile)"
            icon={<Icons.warning className="size-4" />}
            rows={hazards}
            emptyText="No fragile, deteriorating, or flagged names this period."
          />
        </div>
      </Reveal>
    </section>
  );
}
