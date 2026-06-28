"use client";

import { Icons } from "@/lib/icons";
import { Reveal } from "@/components/ui/reveal";
import type { ResultDetailData } from "@/types/result-detail";
import { Panel, SectionEyebrow, HonestEmpty, Chip, tint } from "./shared";

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const EVENT_LABEL: Record<string, string> = {
  dividend: "Dividend",
  agm: "AGM",
  board_meeting: "Board meeting",
  earnings: "Results",
};

export default function ContextTab({ data }: { data: ResultDetailData }) {
  const { news, ai, corporateEvents } = data;

  return (
    <div className="space-y-2">
      {/* ── News in window ───────────────────────────────────────────── */}
      <Reveal>
        <section>
          <SectionEyebrow label="News around the result" icon={Icons.news} accent="var(--p-mom)" pill={news.length ? `${news.length}` : undefined} />
          {news.length === 0 ? (
            <HonestEmpty>No news or filings captured in the days around this result.</HonestEmpty>
          ) : (
            <Panel className="p-0">
              <div className="divide-y divide-line">
                {news.map((n) => {
                  const Wrapper = n.url ? "a" : "div";
                  return (
                    <Wrapper
                      key={n.id}
                      {...(n.url ? { href: n.url, target: "_blank", rel: "noopener noreferrer" } : {})}
                      className={
                        "block px-5 py-3.5 transition-colors" + (n.url ? " hover:bg-surface-2" : "")
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[13.5px] font-medium leading-snug text-ink">{n.headline}</p>
                        {n.url && <Icons.arrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink3" />}
                      </div>
                      {n.summary && <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink3">{n.summary}</p>}
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-ink3">
                        <span>{n.source}</span>
                        <span>·</span>
                        <span className="num">{fmtDateTime(n.publishedAt)}</span>
                        {n.sentiment && (
                          <>
                            <span>·</span>
                            <span className="capitalize">{n.sentiment}</span>
                          </>
                        )}
                      </div>
                    </Wrapper>
                  );
                })}
              </div>
            </Panel>
          )}
        </section>
      </Reveal>

      {/* ── AI earnings analysis ─────────────────────────────────────── */}
      <Reveal>
        <section>
          <SectionEyebrow label="AI earnings analysis" icon={Icons.spark} accent="var(--p-own)" />
          <Panel>
            {ai.available ? (
              <div className="flex flex-col gap-3">
                {ai.headline && <p className="text-[15px] font-semibold leading-snug text-ink">{ai.headline}</p>}
                {ai.content && <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink2">{ai.content}</p>}
                {ai.keyPoints && ai.keyPoints.length > 0 && (
                  <ul className="flex flex-col gap-1.5">
                    {ai.keyPoints.map((p, i) => (
                      <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-ink2">
                        <Icons.check weight="bold" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-p-own" />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
                {ai.generatedAt && (
                  <p className="num text-[11px] text-ink3">
                    Generated {fmtDateTime(ai.generatedAt)}
                    {ai.modelVersion ? ` · ${ai.modelVersion}` : ""}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border" style={tint("var(--p-own)")}>
                  <Icons.spark weight="duotone" className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-ink">AI earnings analysis — coming soon</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink3">
                    A plain-English breakdown of this quarter (key positives, concerns and the bottom line) will
                    appear here once generated. Not yet available for this result.
                  </p>
                </div>
              </div>
            )}
          </Panel>
        </section>
      </Reveal>

      {/* ── Corporate actions ────────────────────────────────────────── */}
      <Reveal>
        <section>
          <SectionEyebrow label="Corporate actions" icon={Icons.calendar} accent="var(--p-mkt)" />
          {corporateEvents.length === 0 ? (
            <HonestEmpty>No dividends, AGM or board actions recorded around this result.</HonestEmpty>
          ) : (
            <Panel className="p-0">
              <div className="divide-y divide-line">
                {corporateEvents.map((e, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Chip tone="accent">{EVENT_LABEL[e.eventType] ?? e.eventType}</Chip>
                      <span className="text-[12.5px] text-ink2">
                        {e.dividendAmount != null
                          ? `₹${e.dividendAmount}/sh${e.dividendType ? ` (${e.dividendType})` : ""}`
                          : e.description ?? ""}
                      </span>
                    </div>
                    <span className="num text-[11.5px] text-ink3">{fmtDay(e.eventDate)}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </section>
      </Reveal>

      {/* ── Management commentary / concall (genuinely absent) ────────── */}
      <Reveal>
        <section>
          <SectionEyebrow label="Management commentary" icon={Icons.brain} accent="var(--p-found)" />
          <HonestEmpty>
            Management commentary, concall highlights and forward guidance aren&apos;t captured yet — no source
            currently holds this for the result. It&apos;s planned for a later phase; we won&apos;t fabricate it.
          </HonestEmpty>
        </section>
      </Reveal>
    </div>
  );
}
