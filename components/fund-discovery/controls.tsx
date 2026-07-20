"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import type { Facet } from "@/types/funds-browse";

// ── Segmented control — a small pill group for a 2–3-value exclusive choice (asset class, plan) ──
export interface SegmentOption<T extends string> {
  value: T | null;
  label: string;
}
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (v: T | null) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex items-center gap-0.5 rounded-lg border border-line2 bg-surface-1 p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.label}
            role="radio"
            aria-checked={active}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              active ? "bg-surface-3 text-ink" : "text-ink3 hover:text-ink2",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── A pill toggle (dormant) ──
export function TogglePill({
  active,
  onToggle,
  children,
}: {
  active: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-warning/40 bg-warning/10 text-warning"
          : "border-line2 text-ink3 hover:border-line3 hover:text-ink2",
      )}
    >
      <span
        className={cn(
          "grid h-3.5 w-3.5 place-items-center rounded-[4px] border",
          active ? "border-warning/60 bg-warning/20" : "border-line3",
        )}
      >
        {active && <Icons.check className="h-2.5 w-2.5" weight="bold" />}
      </span>
      {children}
    </button>
  );
}

// ── Multi-select facet (category, fund house) — a searchable checklist popover carrying the
//    server's counts. Counts already reflect the OTHER active filters; rendered as given. ──
export function MultiSelectFacet({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Facet[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedSet = new Set(selected);
  const toggle = (value: string) => {
    onChange(selectedSet.has(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
            selected.length > 0
              ? "border-primary/40 bg-primary/[0.08] text-primary"
              : "border-line2 text-ink2 hover:border-line3 hover:text-ink",
          )}
        >
          {label}
          {selected.length > 0 && (
            <span className="num rounded-full bg-primary/20 px-1.5 text-[10px] leading-tight">{selected.length}</span>
          )}
          <Icons.caretDown className="h-3 w-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder={`Filter ${label.toLowerCase()}…`} />
          <CommandList className="max-h-72">
            <CommandEmpty>None match the current filters.</CommandEmpty>
            <CommandGroup>
              {options.map((f) => {
                const checked = selectedSet.has(f.value);
                return (
                  <CommandItem
                    key={f.value}
                    value={f.value}
                    onSelect={() => toggle(f.value)}
                    // Override cmdk's default blue `bg-accent`/`text-accent-foreground` highlight (which
                    // left the gray label unreadable on hover) with the app's subtle surface highlight,
                    // and let the label/count brighten via the group-selected state.
                    className="group flex items-center gap-2 data-[selected=true]:bg-surface-2 cursor-pointer"
                  >
                    <span
                      className={cn(
                        "grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border",
                        checked ? "border-primary bg-primary/20 text-primary" : "border-line3 group-data-[selected=true]:border-line2",
                      )}
                    >
                      {checked && <Icons.check className="h-3 w-3" weight="bold" />}
                    </span>
                    <span className="flex-1 truncate text-ink2 group-data-[selected=true]:text-ink">{f.value}</span>
                    <span className="num text-[11px] text-ink3 group-data-[selected=true]:text-ink2">{f.count}</span>
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
