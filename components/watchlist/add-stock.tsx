"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useUniverseStocks } from "@/lib/api/hooks/use-stocks";
import { useWatchlistMutations } from "@/lib/api/hooks/use-watchlist";
import type { UniverseStockLite } from "@/types/research-tools";
import { BAND_META } from "./lib";

// ─────────────────────────────────────────────────────────────────────────────
// ADD TO WATCHLIST — the pin front door. A search over the FULL universe (scored +
// unscored, so half the universe is pinnable here too, first-class), each row a POST.
// Idempotent on (user, stock): re-pinning is a no-op the server returns as-is. The pin
// targets the Stock UUID (`id`), the universe-gated key — never a symbol guess.
// ─────────────────────────────────────────────────────────────────────────────

function BandTag({ stock }: { stock: UniverseStockLite }) {
  if (!stock.scored || !stock.band) {
    return (
      <span className="shrink-0 rounded-full border border-line2 bg-surface-3 px-2 py-0.5 text-[10px] text-ink3">
        Not scored
      </span>
    );
  }
  const meta = BAND_META[stock.band];
  return (
    <span
      className="num shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ color: meta.cssVar, background: `color-mix(in oklch, ${meta.cssVar} 14%, transparent)` }}
    >
      {stock.composite != null ? `${Math.round(stock.composite)} · ` : ""}
      {meta.label}
    </span>
  );
}

export function AddToWatchlist({
  pinnedIds,
  trigger,
}: {
  /** stockIds already on the watchlist — those rows show "Pinned", not a pin action. */
  pinnedIds: Set<string>;
  /** optional custom trigger; defaults to the primary "Add stock" button. */
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const universe = useUniverseStocks();
  const { pin } = useWatchlistMutations();

  const results = useMemo(() => {
    const all = universe.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) {
      // no query → surface the unpinned universe head (alpha), so it never opens blank
      return all.filter((s) => !pinnedIds.has(s.id)).slice(0, 40);
    }
    return all
      .filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      .slice(0, 40);
  }, [universe.data, query, pinnedIds]);

  const onPin = (stock: UniverseStockLite) => {
    if (pinnedIds.has(stock.id) || pendingId) return;
    setPendingId(stock.id);
    pin.mutate(stock.id, { onSettled: () => setPendingId(null) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground transition-[filter] hover:brightness-110"
          >
            <Icons.plus className="size-3.5" />
            Add stock
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg gap-0 border-line bg-surface-1 p-0">
        <DialogHeader className="border-b border-line px-5 pb-3 pt-5 text-left">
          <DialogTitle className="font-display text-[18px] font-semibold text-ink">Pin a stock to watch</DialogTitle>
          <DialogDescription className="text-[12.5px] text-ink3">
            Search the full universe — scored or not. Pinning captures today&apos;s health &amp; price as your baseline.
          </DialogDescription>
        </DialogHeader>

        {/* search */}
        <div className="relative border-b border-line px-5 py-3">
          <Icons.search className="pointer-events-none absolute left-8 top-1/2 size-4 -translate-y-1/2 text-ink3" />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ticker or company…"
            className="h-9 w-full rounded-lg border border-line2 bg-surface-2 pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink3 focus:border-primary/40"
          />
        </div>

        {/* results */}
        <div className="custom-scrollbar max-h-[52vh] overflow-y-auto px-2 py-2">
          {universe.isLoading ? (
            <p className="px-3 py-8 text-center text-[12.5px] text-ink3">Loading the universe…</p>
          ) : universe.isError ? (
            <p className="px-3 py-8 text-center text-[12.5px] text-danger">Couldn&apos;t load the stock universe.</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-8 text-center text-[12.5px] text-ink3">
              {query.trim() ? `No stocks match “${query.trim()}”.` : "Every tracked stock is already on your watchlist."}
            </p>
          ) : (
            <ul className="flex flex-col">
              {results.map((s) => {
                const isPinned = pinnedIds.has(s.id);
                const isPending = pendingId === s.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={isPinned || isPending}
                      onClick={() => onPin(s)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                        isPinned ? "cursor-default opacity-60" : "hover:bg-surface-2",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-semibold text-ink">{s.symbol}</span>
                          <BandTag stock={s} />
                        </div>
                        <p className="truncate text-[11.5px] text-ink3">{s.name}</p>
                      </div>
                      <span className="shrink-0">
                        {isPending ? (
                          <Icons.spinner className="size-4 animate-spin text-ink3" />
                        ) : isPinned ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink3">
                            <Icons.check className="size-3.5" /> Pinned
                          </span>
                        ) : (
                          <span className="inline-flex size-6 items-center justify-center rounded-md border border-line2 text-ink2">
                            <Icons.plus className="size-3.5" />
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {pin.isError && (
          <p className="border-t border-line px-5 py-2 text-[12px] text-danger">
            Couldn&apos;t pin that stock — please try again.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
