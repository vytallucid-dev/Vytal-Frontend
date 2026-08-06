"use client";

/**
 * THE LANDING-SCAN FILTER BAR — two multi-select dropdowns (peer group · pattern) over a
 * tool's ranked landing, plus the active-selection chips and a clear-all.
 *
 * ── ★ THE NARROWING IS SERVER-SIDE, AND THAT IS THE WHOLE POINT ───────────────────────────
 * The landing is infinite-scrolled: the client holds only the pages it has scrolled to. So
 * these controls do NOT filter `items` — they change the QUERY, and the server filters the
 * ranked array before it slices a page (see tool-scan.page.ts). That is what keeps every
 * paging fact true under a filter: `total` counts the narrowed ranking, the scroll sentinel
 * keeps pulling until THAT ranking is exhausted, and "showing all N" means all N matches —
 * not "all N of the four pages you happen to have".
 *
 * ── OPTIONS COME FROM THE SCAN, NOT THE CATALOGUE ─────────────────────────────────────────
 * An option a reader can pick is an option that returns cards; a pond with no scored member
 * and a pattern nothing fired are not offered. The `count` beside each option is
 * cross-filtered (computed with the OTHER dropdown's selection applied), so a 0 reads
 * truthfully as "none of these, given your other filter" — and the row stays put rather than
 * vanishing mid-selection.
 */

import { useMemo, useState } from "react";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { bandMeta } from "@/components/stock-detail/health/shared";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  EMPTY_SCAN_FILTERS,
  scanFilterCount,
  type ScanFacetOption,
  type ScanFilters,
} from "@/types/research-tools";

/**
 * Re-label facet options from whichever map already owns those words on this tool.
 *
 * Some dimensions ARE named by the server, correctly and single-sourced: a pond's displayName,
 * a finding's catalogue name. Others are keys the client already has copy for — a band
 * (BAND_META) or an ownership tell (TELL_META) — and there the served label is either wrong for
 * the surface ("Pristine — fully priced" beside a card that says "Pristine") or a raw enum. So
 * the tool passes the map its own CARDS render from, guaranteeing the dropdown and the grid
 * agree. A mapper that returns undefined for a value it doesn't know keeps the served label, so
 * a newly-added key shows up named rather than blank.
 *
 * ⚠ THIS IS WHY THE `bandOptions` CALLERS STAY ON `BAND_META[v]?.label`, NOT `bandMeta(v).label`.
 *   bandMeta() resolves every input, which would make `?? o.label` unreachable here and replace
 *   an unrecognised band's SERVER label with its raw key — discarding real information the
 *   server already had for a locally-derived fallback that has nothing behind it. A server label
 *   beats a raw key; `bandMeta` belongs where nothing better exists, not where this map's own
 *   optional-chained miss already does the better thing. (Other call sites with no server label
 *   behind them — e.g. this file's band CHIP colour, `divergence-data.ts`, `trajectory-data.ts` —
 *   correctly use `bandMeta()`, since there `?.` had nothing to fall back to but neutral-or-throw.)
 */
export const relabel = (
  options: ScanFacetOption[],
  label: (value: string) => string | undefined,
): ScanFacetOption[] => options.map((o) => ({ ...o, label: label(o.value) ?? o.label }));

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  loading,
  emptyHint,
  searchable = true,
}: {
  label: string;
  options: ScanFacetOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  loading: boolean;
  emptyHint: string;
  /** A five-row ordered scale doesn't need a search box (and a search box would invite
   *  re-ordering it). Long lists — ponds, patterns — do. */
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const toggle = (value: string) =>
    onChange(selectedSet.has(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
            selected.length > 0
              ? "border-primary/40 bg-primary/8 text-primary"
              : "border-line2 bg-surface-1 text-ink2 hover:border-line3 hover:text-ink",
          )}
        >
          <span className="truncate">{label}</span>
          {selected.length > 0 && (
            <span className="num rounded-full bg-primary/20 px-1.5 text-[10px] leading-tight">
              {selected.length}
            </span>
          )}
          <Icons.caretDown className="size-3 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>

      {/* w-[min(20rem,calc(100vw-2rem))] — a fixed w-80 overflows a 360px phone once the
          popover is offset from the trigger; this pins it inside the viewport instead. */}
      <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-0">
        <Command
          // Filter on the LABEL, not the value: the values here are opaque (a peer-group
          // UUID, a `trajectory_T3` key) and cmdk's default matcher searches the value.
          filter={(value, search, keywords) => {
            const hay = `${value} ${(keywords ?? []).join(" ")}`.toLowerCase();
            return hay.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          {searchable && <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />}
          <CommandList className="max-h-64">
            <CommandEmpty>{loading ? "Loading…" : emptyHint}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const checked = selectedSet.has(o.value);
                return (
                  <CommandItem
                    key={o.value}
                    value={o.value}
                    keywords={[o.label]}
                    onSelect={() => toggle(o.value)}
                    className="group flex cursor-pointer items-center gap-2 data-[selected=true]:bg-surface-2"
                  >
                    <span
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded-sm border",
                        checked
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-line3 group-data-[selected=true]:border-line2",
                      )}
                    >
                      {checked && <Icons.check className="size-3" weight="bold" />}
                    </span>
                    <span
                      className={cn(
                        "flex-1 truncate text-ink2 group-data-[selected=true]:text-ink",
                        // an option the other filter has zeroed out — still pickable, still
                        // visible, just visibly empty
                        o.count === 0 && !checked && "text-ink3",
                      )}
                      title={o.label}
                    >
                      {o.label}
                    </span>
                    <span className="num text-[11px] text-ink3">{o.count}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ScanFilterBar({
  peerGroupOptions,
  patternOptions,
  patternLabel = "Pattern",
  bandOptions,
  filters,
  onChange,
  loading = false,
  matchCount,
}: {
  peerGroupOptions: ScanFacetOption[];
  patternOptions: ScanFacetOption[];
  /** What this tool CALLS its categorical dimension. Trajectory and Divergence narrow on fired
   *  findings ("Pattern"); Ownership fires none and narrows on its flow tell ("Tell"). One
   *  filter, one query param, one code path — only the word a reader sees differs. */
  patternLabel?: string;
  /** Already ordered best→worst by the backend's band mapping — rendered in the given order. */
  bandOptions: ScanFacetOption[];
  filters: ScanFilters;
  onChange: (next: ScanFilters) => void;
  loading?: boolean;
  /** Size of the narrowed ranking (the server's `total`) — undefined while it's in flight. */
  matchCount?: number;
}) {
  const active = scanFilterCount(filters);

  // The chips need a label (and, for a band, its condition colour) for a value the reader
  // picked — resolved off the facets. A selection whose option has since left the scan still
  // renders, as its raw value, so it can always be removed rather than becoming an invisible
  // filter.
  const labelOf = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of [...peerGroupOptions, ...patternOptions, ...bandOptions]) m.set(o.value, o.label);
    return (v: string) => m.get(v) ?? v;
  }, [peerGroupOptions, patternOptions, bandOptions]);

  const drop = (list: string[], v: string) => list.filter((x) => x !== v);
  const chips = [
    ...filters.bands.map((v) => ({
      key: `band:${v}`,
      label: labelOf(v),
      // the band chip wears its own condition colour — the same token the cards use
      color: bandMeta(v).cssVar,
      remove: () => onChange({ ...filters, bands: drop(filters.bands, v) }),
    })),
    ...filters.peerGroups.map((v) => ({
      key: `pg:${v}`,
      label: labelOf(v),
      color: undefined as string | undefined,
      remove: () => onChange({ ...filters, peerGroups: drop(filters.peerGroups, v) }),
    })),
    ...filters.patterns.map((v) => ({
      key: `pat:${v}`,
      label: labelOf(v),
      color: undefined as string | undefined,
      remove: () => onChange({ ...filters, patterns: drop(filters.patterns, v) }),
    })),
  ];

  return (
    <div className="mb-3.5 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-ink3">
          <Icons.filter weight={active > 0 ? "fill" : "regular"} className="size-3.5" />
          Filter
        </span>

        <MultiSelect
          label="Bands"
          options={bandOptions}
          selected={filters.bands}
          onChange={(bands) => onChange({ ...filters, bands })}
          loading={loading}
          emptyHint="No bands in this scan."
          searchable={false}
        />
        <MultiSelect
          label="Peer group"
          options={peerGroupOptions}
          selected={filters.peerGroups}
          onChange={(peerGroups) => onChange({ ...filters, peerGroups })}
          loading={loading}
          emptyHint="No peer groups in this scan."
        />
        <MultiSelect
          label={patternLabel}
          options={patternOptions}
          selected={filters.patterns}
          onChange={(patterns) => onChange({ ...filters, patterns })}
          loading={loading}
          emptyHint={`No ${patternLabel.toLowerCase()} readings in this scan.`}
        />

        {active > 0 && (
          <>
            {matchCount !== undefined && (
              <span className="text-[11.5px] text-ink3">
                <span className="num text-ink2">{matchCount}</span>{" "}
                {matchCount === 1 ? "match" : "matches"}
              </span>
            )}
            <button
              type="button"
              onClick={() => onChange(EMPTY_SCAN_FILTERS)}
              className="inline-flex items-center gap-1 text-[11.5px] font-medium text-ink3 transition-colors hover:text-ink"
            >
              <Icons.close className="size-3" />
              Clear
            </button>
          </>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={c.remove}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line2 bg-surface-1 py-0.5 pl-2.5 pr-1.5 text-[11px] text-ink2 transition-colors hover:border-line3 hover:text-ink"
            >
              {c.color && (
                <span className="size-1.5 shrink-0 rounded-full" style={{ background: c.color }} />
              )}
              <span className="truncate">{c.label}</span>
              <Icons.close className="size-2.5 shrink-0 opacity-70" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
