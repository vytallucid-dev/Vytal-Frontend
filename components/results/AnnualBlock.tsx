"use client";

/**
 * Annual (full-year) cash-flow + balance-sheet HEADLINE for the viewed result — family-aware.
 * The backend gates this to the latest year-end (Q4) result and emits a family-appropriate shape
 * (banks show deposits/advances; NBFCs show AUM; insurers carry NO cash-flow statement → the CF
 * panel honest-empties "n/a for insurers", a real absence, not a bug). Per-line nulls render "—".
 * This is the BS-headline + CF only — NOT the granular sub-lines (parked SELECT work).
 */

import type { AnnualResultBlock, AnnualResultState, AnnualLine } from "@/types/result-detail";
import { Panel, HonestEmpty, fmtCr, DASH } from "./shared";

function fmtLine(l: AnnualLine): string {
  if (l.value == null) return DASH;
  return l.unit === "rupees" ? `₹${l.value.toFixed(2)}` : fmtCr(l.value);
}

function LineList({ lines }: { lines: AnnualLine[] }) {
  return (
    <div className="divide-y divide-line">
      {lines.map((l) => (
        <div key={l.key} className="flex items-center justify-between gap-4 px-1 py-2">
          <span className="text-[12.5px] text-ink2">{l.label}</span>
          <span className="num text-[13px] font-medium text-ink">{fmtLine(l)}</span>
        </div>
      ))}
    </div>
  );
}

function PanelHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink3">{children}</div>
  );
}

export function AnnualBlock({
  annual,
  annualState,
}: {
  annual: AnnualResultBlock | null;
  annualState: AnnualResultState;
}) {
  if (annualState !== "available" || !annual) {
    return (
      <HonestEmpty>
        Annual (full-year) cash-flow &amp; balance sheet are shown on the latest year-end (Q4)
        result.
      </HonestEmpty>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Panel>
        <PanelHeading>Balance sheet — headline</PanelHeading>
        <LineList lines={annual.balanceSheet} />
      </Panel>
      <div className="space-y-3">
        <Panel>
          <PanelHeading>Cash flow</PanelHeading>
          {annual.cashFlow ? (
            <LineList lines={annual.cashFlow} />
          ) : (
            <p className="px-1 py-2 text-[12.5px] leading-relaxed text-ink3">
              Not applicable for insurers — insurer annual filings carry no cash-flow statement.
            </p>
          )}
        </Panel>
        <Panel>
          <PanelHeading>Per share</PanelHeading>
          <LineList lines={annual.perShare} />
        </Panel>
      </div>
    </div>
  );
}
