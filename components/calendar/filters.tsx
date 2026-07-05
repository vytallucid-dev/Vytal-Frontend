"use client";

// The filter control — a "Filters" button with an active-count badge that opens a popover.
// Type-group + impact as chips (only groups present in the data), sector as a labelled
// dropdown (display names), and the held-vs-all lens. Clear only appears when something is
// active. Applies to both the timeline and the month grid.

import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { tint } from "@/components/stock-detail/health/shared";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IMPACT_META,
  TYPE_GROUP_META,
  activeFilterCount,
  type CalendarFilters,
  type Impact,
  type TypeGroup,
} from "./lib";

function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
        active ? "text-ink" : "border-line2 text-ink3 hover:text-ink2",
      )}
      style={active ? tint(color ?? "var(--primary)", 12, 34) : undefined}
    >
      {children}
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink3">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

export function CalendarFiltersBar({
  filters,
  onChange,
  onClear,
  typeGroups,
  sectors,
  hasHoldings,
}: {
  filters: CalendarFilters;
  onChange: (next: CalendarFilters) => void;
  onClear: () => void;
  typeGroups: TypeGroup[];
  sectors: string[];
  hasHoldings: boolean;
}) {
  const active = activeFilterCount(filters);
  const impacts: Impact[] = ["high", "medium", "low"];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-1 px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-surface-2",
            active > 0 ? "text-ink" : "text-ink2 hover:text-ink",
          )}
          style={active > 0 ? tint("var(--primary)", 10, 32) : undefined}
        >
          <Icons.filter weight={active > 0 ? "fill" : "regular"} className="size-3.5" />
          Filters
          {active > 0 && (
            <span className="num grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold text-primary-foreground" style={{ background: "var(--primary)" }}>
              {active}
            </span>
          )}
          <Icons.caretDown className="size-3 opacity-60" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink3">Filter events</span>
          {active > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 text-[11.5px] font-medium text-ink3 transition-colors hover:text-ink"
            >
              <Icons.close className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3.5">
          {/* held vs all */}
          <Row label="Lens">
            <Chip active={!filters.heldOnly} onClick={() => onChange({ ...filters, heldOnly: false })}>
              All
            </Chip>
            <Chip
              active={filters.heldOnly}
              onClick={() => hasHoldings && onChange({ ...filters, heldOnly: true })}
            >
              <Icons.portfolio weight={filters.heldOnly ? "fill" : "regular"} className="h-3.5 w-3.5" />
              My holdings
              {!hasHoldings && <span className="text-[10px] text-ink3">(none)</span>}
            </Chip>
          </Row>

          <Row label="Type">
            <Chip active={filters.type === "all"} onClick={() => onChange({ ...filters, type: "all" })}>
              All
            </Chip>
            {typeGroups.map((g) => {
              const m = TYPE_GROUP_META[g];
              return (
                <Chip key={g} active={filters.type === g} onClick={() => onChange({ ...filters, type: g })}>
                  <m.icon weight={filters.type === g ? "fill" : "regular"} className="h-3.5 w-3.5" />
                  {m.label}
                </Chip>
              );
            })}
          </Row>

          <Row label="Impact">
            <Chip active={filters.impact === "all"} onClick={() => onChange({ ...filters, impact: "all" })}>
              All
            </Chip>
            {impacts.map((i) => (
              <Chip
                key={i}
                active={filters.impact === i}
                color={IMPACT_META[i].color}
                onClick={() => onChange({ ...filters, impact: i })}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: IMPACT_META[i].color }} />
                {IMPACT_META[i].label}
              </Chip>
            ))}
          </Row>

          {sectors.length > 0 && (
            <Row label="Sector">
              <Select
                value={filters.sector}
                onValueChange={(v) => onChange({ ...filters, sector: v as CalendarFilters["sector"] })}
              >
                <SelectTrigger className="h-8 w-full bg-surface-2 text-[12px]">
                  <SelectValue placeholder="All sectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sectors</SelectItem>
                  {sectors.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
