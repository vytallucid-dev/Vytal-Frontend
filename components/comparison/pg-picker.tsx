"use client";

/**
 * PeerGroupPicker — the calm, token-only peer-group picker for the Comparison landing.
 *
 * The PG-mode sibling of EntityPicker. Reads the live PG index (usePeerGroups, passed in
 * as `groups`). Presents as a dropdown TRIGGER button; clicking it opens a popover with
 * the search box INSIDE, over a filtered result list. Picks into local state via onPick.
 *
 * Honesty rules baked in:
 *  - Only SCORED peer groups are selectable — an unscored pond has no distribution to
 *    compare, so it renders disabled (visible but non-clickable), never silently dropped.
 *  - Excludes the already-chosen group (`disabledId`) so A and B can't be the same field.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";

export interface PickerPeerGroup {
  id: string;
  name: string;
  displayName: string;
  sector: string;
  memberCount: number;
  scored: boolean;
  medianComposite: number | null;
}

export function PeerGroupPicker({
  groups,
  loading,
  disabledId,
  onPick,
  placeholder = "Search peer groups…",
}: {
  groups: PickerPeerGroup[];
  loading: boolean;
  /** An id to exclude from results (the one already chosen on the other side). */
  disabledId: string | null;
  onPick: (g: PickerPeerGroup) => void;
  placeholder?: string;
}) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Selectable rows only (scored + not the other pick) drive keyboard nav; unscored
  // rows still render but are inert, so we track the navigable subset separately.
  const results = useMemo(() => {
    const base = groups.filter((g) => g.id !== disabledId);
    const q = term.trim().toLowerCase();
    // No query → browse all peer groups (scrollable). With a query → top matches.
    if (!q) return base;
    return base
      .filter(
        (g) =>
          g.displayName.toLowerCase().includes(q) ||
          g.name.toLowerCase().includes(q) ||
          g.sector.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [term, groups, disabledId]);

  const navigable = useMemo(() => results.filter((g) => g.scored), [results]);

  // Click-outside closes the dropdown.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Focus the search box the moment the popover opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function choose(g: PickerPeerGroup) {
    if (!g.scored) return; // honest: nothing to compare in an unscored pond
    onPick(g);
    setTerm("");
    setOpen(false);
    setHighlight(-1);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || navigable.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlight((p) => (p < navigable.length - 1 ? p + 1 : p));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlight((p) => (p > 0 ? p - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlight >= 0 && highlight < navigable.length) choose(navigable[highlight]);
        break;
      case "Escape":
        setOpen(false);
        setHighlight(-1);
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger — a select-style button; the search lives inside the popover. */}
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-2 rounded-xl border bg-surface px-4 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          open ? "border-line3" : "border-line hover:border-line3",
        )}
      >
        <span className="flex min-w-0 items-center gap-2 text-ink3">
          <Icons.search className="h-4 w-4 shrink-0" />
          <span className="truncate">{loading ? "Loading peer groups…" : placeholder}</span>
        </span>
        <Icons.caretDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink3 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-line bg-background shadow-lg"
          >
            {/* Search box — inside the popover */}
            <div className="relative border-b border-line p-2">
              <Icons.search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3" />
              <input
                ref={inputRef}
                type="text"
                value={term}
                placeholder="Search peer groups…"
                onChange={(e) => {
                  setTerm(e.target.value);
                  setHighlight(-1);
                }}
                onKeyDown={onKeyDown}
                className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink3 focus:border-line3"
              />
            </div>

            {results.length > 0 ? (
              <ul className="max-h-72 overflow-y-auto py-1">
                {results.map((g) => {
                  const navIndex = navigable.indexOf(g);
                  const isHighlight = g.scored && navIndex === highlight;
                  return (
                    <li key={g.id}>
                      <button
                        type="button"
                        disabled={!g.scored}
                        onClick={() => choose(g)}
                        onMouseEnter={() => g.scored && setHighlight(navIndex)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors",
                          !g.scored
                            ? "cursor-not-allowed opacity-50"
                            : isHighlight
                              ? "bg-line2/40"
                              : "hover:bg-line2/30",
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-ink">
                              {g.displayName}
                            </span>
                            {!g.scored && (
                              <span className="rounded-full bg-line2 px-2 py-0.5 text-[10px] font-medium text-ink3">
                                Not scored
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-ink2">
                            {g.memberCount} members
                            {g.sector ? ` · ${g.sector}` : ""}
                          </p>
                        </div>
                        {g.scored && g.medianComposite != null && (
                          <span className="num shrink-0 text-xs text-ink3">
                            med {Math.round(g.medianComposite)}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-ink3">
                {term.trim()
                  ? `No peer group matches “${term.trim()}”.`
                  : "No peer groups available."}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
