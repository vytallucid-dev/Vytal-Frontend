"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";

// ─────────────────────────────────────────────────────────────────────────────────────
// Shared interactive-chart tooltip for HAND-ROLLED SVG / HTML charts (recharts has its own
// <Tooltip>). The hover position is read in SCREEN space (clientX/clientY relative to the
// chart container), so it works regardless of an SVG's viewBox scaling. Render-only and
// pointer-events-none — it never intercepts the hover it describes.
//
// Usage:
//   const ref = useRef<HTMLDivElement>(null);
//   const { tip, show, hide } = useChartTooltip(ref);
//   return <div ref={ref} className="relative"><ChartTooltip tip={tip} /><svg>…
//             <circle … onMouseMove={(e) => show(e, <TipBody title=… rows=… />)} onMouseLeave={hide} />
//          </svg></div>;
// ─────────────────────────────────────────────────────────────────────────────────────

export interface ChartTip {
  x: number; // px, relative to the container's top-left
  y: number;
  w: number; // container width, for edge-clamping
  content: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────────────
// Our hand-rolled SVG charts use a fixed viewBox stretched to `w-full`, so every value
// inside (font-size, r) is in viewBox units and scales DOWN with the container — great
// for line/shape geometry, bad for text and dots, which go illegibly small on a narrow
// phone. useElementWidth reports the container's live CSS px width so callers can convert
// a desired ON-SCREEN pixel size into the viewBox units that render at that size at the
// CURRENT width — text and dots stay a constant, legible pixel size at any breakpoint,
// with no min-width / horizontal scroll needed (the chart still fully occupies the width
// it's given).
// ─────────────────────────────────────────────────────────────────────────────────────
export function useElementWidth(ref: RefObject<HTMLElement | null>, fallback: number): number {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width || fallback;
}

export function useChartTooltip(containerRef: RefObject<HTMLDivElement | null>) {
  const [tip, setTip] = useState<ChartTip | null>(null);
  const show = (e: { clientX: number; clientY: number }, content: ReactNode) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, content });
  };
  const hide = () => setTip(null);
  return { tip, show, hide };
}

export function ChartTooltip({ tip }: { tip: ChartTip | null }) {
  if (!tip) return null;
  // keep the (centre-anchored) tooltip inside the container horizontally.
  const clampedX = Math.max(74, Math.min(tip.x, Math.max(74, tip.w - 74)));
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-line bg-surface-1 px-2.5 py-1.5 text-[11px] leading-snug shadow-lg"
      style={{ left: clampedX, top: tip.y - 10 }}
    >
      {tip.content}
    </div>
  );
}

/** A compact, consistent tooltip body: a bold title header + labelled metric rows. */
export function TipBody({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <div>
      <div className="num font-semibold text-ink">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between gap-3 text-ink2">
          <span className="text-ink3">{r.label}</span>
          <span className="num">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
