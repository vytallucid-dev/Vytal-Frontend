"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// CURSOR-FOLLOWING TOOLTIP — the app's tooltip look (shadcn tokens: bg-surface-3, border-line2,
// shadow), portaled to <body> and positioned DIRECTLY at the pointer, tracking it on move. Direct
// fixed positioning (rAF-throttled) — no anchor/floating-ui to lag behind the cursor. One hook + one
// component, shared by the row visuals that want a per-row detail tooltip (P&L rows, attribution rows).
// ─────────────────────────────────────────────────────────────────────────────

export interface CursorPos {
  x: number;
  y: number;
}

/** Spread `handlers` onto each hoverable row; render one <CursorTooltip> with the returned open/pos and
 *  the hovered row's content. Pointer moves are rAF-throttled so a long list doesn't thrash React. */
export function useCursorTooltip() {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<CursorPos>({ x: 0, y: 0 });
  const raf = React.useRef<number | null>(null);
  const track = React.useCallback((x: number, y: number) => {
    if (raf.current != null) return;
    raf.current = requestAnimationFrame(() => { raf.current = null; setPos({ x, y }); });
  }, []);
  React.useEffect(() => () => { if (raf.current != null) cancelAnimationFrame(raf.current); }, []);
  const handlers = React.useMemo(
    () => ({
      onPointerEnter: (e: React.PointerEvent) => { setPos({ x: e.clientX, y: e.clientY }); setOpen(true); },
      onPointerMove: (e: React.PointerEvent) => track(e.clientX, e.clientY),
      onPointerLeave: () => setOpen(false),
    }),
    [track],
  );
  return { open, pos, handlers, setOpen };
}

export function CursorTooltip({
  open,
  pos,
  children,
  className,
}: {
  open: boolean;
  pos: CursorPos;
  children: React.ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted || !open) return null;

  // Keep it on-screen: flip to the other side of the cursor near the right / bottom edges.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const flipX = pos.x > vw - 240;
  const flipY = pos.y > vh - 140;
  const left = flipX ? pos.x - 14 : pos.x + 14;
  const top = flipY ? pos.y - 14 : pos.y + 14;
  const transform = `${flipX ? "translateX(-100%)" : ""} ${flipY ? "translateY(-100%)" : ""}`.trim() || undefined;

  return createPortal(
    <div
      role="tooltip"
      className={cn(
        "pointer-events-none fixed z-[60] max-w-[15rem] rounded-md border border-line2 bg-surface-3 px-2.5 py-1.5 text-[11px] text-ink shadow-lg",
        className,
      )}
      style={{ left, top, transform }}
    >
      {children}
    </div>,
    document.body,
  );
}

/** A label · value row for a tooltip body — consistent across every cursor tooltip. */
export function TipLine({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <span className="flex items-center justify-between gap-6">
      <span className="text-ink3">{label}</span>
      <span className={cn("num", className ?? "text-ink")}>{value}</span>
    </span>
  );
}
