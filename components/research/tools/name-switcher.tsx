"use client";

/**
 * Name-switcher — the frame-owned "Switch stock" panel. Reuses components/ui/sheet
 * (Radix dialog), reskinned to Vytal glass-strong, and reads the scored-stock
 * universe (GET /api/stocks) rather than a static file. Doubles as the "Search
 * stock" entry (opens focused) and the "Across your scope" list.
 */

import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Icons } from "@/lib/icons";
import { healthColorVar } from "@/lib/format";
import { bandMeta } from "@/components/stock-detail/health/shared";
import type { ScoredStockLite } from "@/types/research-tools";
import { cn } from "@/lib/utils";

export function NameSwitcher({
  open,
  onOpenChange,
  stocks,
  loading,
  current,
  onSelect,
  scopeLabel,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  stocks: ScoredStockLite[] | undefined;
  loading?: boolean;
  current: string | null;
  onSelect: (symbol: string) => void;
  scopeLabel: string;
}) {
  const [q, setQ] = useState("");

  // ★ THE UNMOUNT BACKSTOP FOR RADIX'S BODY LOCK.
  //   In modal mode Radix sets `pointer-events: none` on document.body while the dialog is open
  //   and removes it during exit cleanup. Selecting a stock fires onSelect (→ router.push) and
  //   onOpenChange(false) in the SAME tick; when the route change unmounts this tree before that
  //   cleanup runs, the style is never removed and the whole page goes dead to clicks — back
  //   button included — until a refresh.
  //
  //   This runs on unmount however the tree comes down. If Radix's own cleanup already ran, it is
  //   a no-op; if the route change won the race, it is the thing that unsticks the page. The race
  //   stops having a losing branch.
  //
  //   ⚠ It REMOVES the inline declaration rather than setting a value, so any stylesheet rule on
  //     body still governs. It touches nothing else on body and sets nothing on mount — this is a
  //     release valve for one specific leaked style, not a second owner of body styling.
  useEffect(() => {
    return () => {
      document.body.style.removeProperty("pointer-events");
    };
  }, []);

  // ★ THE RELEASE THAT ACTUALLY COVERS THE REPORTED PATH. The cleanup above only fires if this
  //   component unmounts, and on the path that produces the freeze it does not: NameSwitcher is
  //   rendered outside ToolFrame's landing/single ternary, and picking a stock is a same-route
  //   search-param change (`/research/x` → `/research/x?symbol=Y`), which re-renders rather than
  //   tears down. So the unmount cleanup guarded every path except the broken one.
  //   This one runs whenever the sheet reaches closed, mounted or not.
  //   ⚠ Removes only — it never sets `pointer-events`, on mount or otherwise, so it cannot itself
  //     become the thing that makes the page clickable when Radix means it not to be.
  useEffect(() => {
    if (!open) document.body.style.removeProperty("pointer-events");
  }, [open]);

  const list = useMemo(() => {
    const items = stocks ?? [];
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? items.filter(
          (s) =>
            s.symbol.toLowerCase().includes(needle) ||
            s.name.toLowerCase().includes(needle),
        )
      : items;
    return filtered.slice(0, 60);
  }, [stocks, q]);

  return (
    // ⚠ MODAL ON PURPOSE — the backdrop, focus trap and scroll lock are all wanted here. The
    //   `pointer-events: none` leak that modal mode brings with it is handled by the unmount
    //   cleanup above, NOT by weakening the dialog. Two rejected fixes, both recorded so they
    //   don't get re-proposed:
    //
    //   ✗ Deferring the navigation (setTimeout / onCloseAutoFocus / awaiting the exit animation)
    //     trades a rare hard failure for input lag on EVERY selection. This is a search panel,
    //     not a confirmation — it should not make the common path wait on the rare one.
    //   ✗ `modal={false}` does stop the leak at its source, but it pays for that by removing the
    //     backdrop entirely (Radix renders NO overlay off-modal), along with the focus trap and
    //     the scroll lock. That was the mispriced trade: it fixed a rare race by permanently
    //     degrading every open of the panel.
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[360px] max-w-[88vw] gap-0 border-l border-line2 p-0 sm:max-w-[360px]"
      >
        <div className="flex items-center justify-between border-b border-line px-4 pb-3.5 pt-4">
          <h3 className="font-display text-[17px] font-medium text-ink">Switch stock</h3>
        </div>

        <div className="relative px-4 py-3.5">
          <Icons.search className="absolute left-7 top-1/2 size-4 -translate-y-1/2 text-ink3" />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search any stock…"
            className="w-full rounded-[10px] border border-line2 bg-surface-2 py-2.5 pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink3 focus:border-line3"
          />
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <div className="px-1.5 pb-1.5 pt-3 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-ink3">
            {scopeLabel}
          </div>

          {loading && !stocks ? (
            <div className="space-y-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-[10px] bg-surface-2" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="px-2 py-6 text-[12px] text-ink3">
              No scored stock matches “{q}”.
            </div>
          ) : (
            list.map((s) => {
              const band = bandMeta(s.band);
              const isCur = s.symbol === current;
              return (
                <button
                  key={s.symbol}
                  onClick={() => {
                    onSelect(s.symbol);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[10px] p-2.5 text-left transition-colors",
                    isCur ? "bg-surface-3" : "hover:bg-surface-2",
                  )}
                >
                  <span
                    className="num grid size-9 shrink-0 place-items-center rounded-lg text-[13px] font-semibold"
                    style={{
                      color: healthColorVar(s.composite),
                      background: "color-mix(in oklab, var(--surface-3) 80%, transparent)",
                    }}
                  >
                    {Math.round(s.composite)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="num block text-[12.5px] font-medium text-ink">
                      {s.symbol}
                    </span>
                    <span className="block truncate text-[10px] text-ink3">
                      {s.sector?.displayName ?? s.name}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-[8.5px] font-semibold uppercase tracking-wide",
                      band.bg,
                      band.text,
                    )}
                  >
                    {band.label}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
