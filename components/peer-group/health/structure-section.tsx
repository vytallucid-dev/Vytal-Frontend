"use client";

import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";
import { SectionEyebrow, Panel } from "@/components/stock-detail/health/shared";
import { pathologyLabel, pathologyRead } from "./lib";
import type { PeerGroupMover, PathologyCensusItem } from "@/types/peer-group";

function MoverSpark({ from, to }: { from: number; to: number }) {
  const up = to >= from;
  const col = up ? "var(--c-healthy)" : "var(--c-below)";
  // 2-point series prior→current, normalised into a 36×15 box.
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const rng = hi - lo || 1;
  const y = (v: number) => 13 - ((v - lo) / rng) * 11 + 1;
  return (
    <svg width={36} height={15} viewBox="0 0 36 15" className="shrink-0">
      <polyline
        points={`2,${y(from).toFixed(1)} 34,${y(to).toFixed(1)}`}
        fill="none"
        stroke={col}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoverRow({ mv, dir }: { mv: PeerGroupMover; dir: "up" | "down" }) {
  const recovering = dir === "up" && mv.composite < 62;
  return (
    <div
      className="flex items-center gap-3 rounded-[10px] border px-2.5 py-2"
      style={
        recovering
          ? { background: "color-mix(in srgb, var(--c-healthy) 12%, transparent)", borderColor: "color-mix(in srgb, var(--c-healthy) 40%, transparent)" }
          : { background: "var(--surface2)", borderColor: "var(--line)" }
      }
    >
      <span className="num flex-1 text-[13px] font-medium text-ink">{mv.symbol}</span>
      {recovering && (
        <span
          className="shrink-0 rounded-[5px] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
          style={{ color: "var(--c-healthy)", background: "color-mix(in srgb, var(--c-healthy) 16%, transparent)" }}
        >
          recovering
        </span>
      )}
      <MoverSpark from={mv.priorComposite} to={mv.composite} />
      <span
        className="num w-10 shrink-0 text-right text-[13px] font-medium"
        style={{ color: dir === "up" ? "var(--c-healthy)" : "var(--c-below)" }}
      >
        {dir === "up" ? "+" : ""}
        {mv.delta.toFixed(1)}
      </span>
    </div>
  );
}

function MoversColumn({
  title,
  dir,
  rows,
}: {
  title: string;
  dir: "up" | "down";
  rows: PeerGroupMover[];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div
        className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: dir === "up" ? "var(--c-healthy)" : "var(--c-below)" }}
      >
        {dir === "up" ? <Icons.trendUp className="size-3.5" /> : <Icons.trendDown className="size-3.5" />}
        {title}
      </div>
      {rows.length ? (
        rows.map((mv) => <MoverRow key={mv.symbol} mv={mv} dir={dir} />)
      ) : (
        <p className="text-[11.5px] text-ink3">None this period.</p>
      )}
    </div>
  );
}

function severityTone(sev: string | null): string {
  const s = (sev ?? "").toLowerCase();
  if (s === "critical") return "var(--c-fragile)";
  if (s === "high") return "var(--c-below)";
  return "var(--ink3)";
}

function PathologyCard({ p }: { p: PathologyCensusItem }) {
  const tone = severityTone(p.severity);
  return (
    <div
      className="rounded-xl border border-line bg-surface-2 p-3.5"
      style={{ borderLeft: `3px solid ${tone}` }}
    >
      <div className="flex items-center gap-2.5">
        <span className="num text-[14px] font-medium text-ink">
          {p.memberCount}/{p.outOf}
        </span>
        <span className="text-[13px] font-medium text-ink">{pathologyLabel(p.kind, p.key)}</span>
        <span
          className="ml-auto rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={
            p.reach === "widespread"
              ? { color: "var(--c-fragile)", background: "color-mix(in srgb, var(--c-fragile) 12%, transparent)" }
              : p.reach === "cluster"
                ? { color: "var(--c-below)", background: "color-mix(in srgb, var(--c-below) 12%, transparent)" }
                : { color: "var(--ink3)", background: "var(--surface3)" }
          }
        >
          {p.reach === "widespread" ? "group-wide" : p.reach}
        </span>
      </div>
      <div className="my-2 h-[5px] overflow-hidden rounded-[3px] bg-surface-3">
        <div
          className="h-full rounded-[3px]"
          style={{ width: `${(p.memberCount / p.outOf) * 100}%`, background: tone }}
        />
      </div>
      <div className="num text-[11.5px] text-ink2">{p.members.join(" · ")}</div>
      <div className="mt-1.5 text-[11px] italic text-ink3">
        {pathologyRead(p.reach, p.memberCount, p.outOf)}
      </div>
    </div>
  );
}

function PathologyEmpty() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <Icons.success weight="duotone" className="size-8 text-healthy" />
      <p className="text-[13px] font-medium text-ink">No group-wide concerns</p>
      <p className="max-w-xs text-[11.5px] text-ink3">
        No red flags or shared patterns cluster across this pond this period. Risk here is
        single-name, not systemic.
      </p>
    </div>
  );
}

export function StructureSection({
  movers,
  pathology,
}: {
  movers: { risers: PeerGroupMover[]; slippers: PeerGroupMover[] };
  pathology: PathologyCensusItem[];
}) {
  return (
    <section>
      <SectionEyebrow label="What's moving inside it" />
      <div className="grid gap-3.5 lg:grid-cols-2">
        <Reveal>
          <Panel>
            <div className="mb-3.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink3">
              Movers — who&apos;s pulling away, who&apos;s slipping
            </div>
            <div className="grid grid-cols-2 gap-4">
              <MoversColumn title="Rising" dir="up" rows={movers.risers} />
              <MoversColumn title="Slipping" dir="down" rows={movers.slippers} />
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={0.06}>
          <Panel>
            <div className="mb-3.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink3">
              Group pathology — is it clustering?
            </div>
            {pathology.length ? (
              <div className="flex flex-col gap-2.5">
                {pathology.map((p) => (
                  <PathologyCard key={`${p.kind}:${p.key}`} p={p} />
                ))}
              </div>
            ) : (
              <PathologyEmpty />
            )}
          </Panel>
        </Reveal>
      </div>
    </section>
  );
}
