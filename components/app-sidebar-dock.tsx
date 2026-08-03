"use client";

/**
 * SidebarDock — the COLLAPSED rail as a macOS-style dock.
 *
 * ── THE THREE THINGS THAT MAKE IT FEEL PHYSICAL ───────────────────────────────────────────────────
 * 1 · ONE shared pointer position drives every tile. The container tracks the pointer along Y exactly
 *     once and publishes it as a MotionValue; each tile derives its own scale from its distance to
 *     that value. No tile has its own hover handler for magnification — per-tile hover produces a
 *     popping, discontinuous feel, and the continuous falloff IS the effect.
 * 2 · SPRING physics, never duration easing. A duration `ease` reads as a menu animation; a spring
 *     with a little overshoot reads as mass. See SPRING below.
 * 3 · A distance→scale falloff with a real radius, tuned so ~2 neighbours each side visibly move.
 *
 * ── GEOMETRY IS ANALYTIC, NOT MEASURED ────────────────────────────────────────────────────────────
 * Tiles are absolutely positioned at centres this module computes, so a tile's distance-to-pointer is
 * arithmetic on a number we already know. The alternative — getBoundingClientRect() per tile inside
 * the transform — is a forced layout read per tile per pointer move (16 reads/frame here). We take
 * exactly ONE rect read per move, on the container, before any writes.
 *
 * ── WHY THE RAIL IS WIDER WHEN COLLAPSED ──────────────────────────────────────────────────────────
 * A magnified tile needs somewhere to grow. `--sidebar-width-icon` is widened at the provider (see
 * app/(main)/layout.tsx) so peak scale + outward lift fits INSIDE the rail's own box — which is why
 * this file needs no overflow escapes and nothing clips.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

import { cn } from "@/lib/utils";
import type { Icon } from "@/lib/icons";

export type DockItemDef = { title: string; url: string; icon: Icon; ai?: boolean };
export type DockGroup = { label: string; items: DockItemDef[] };

// ── geometry (px) ─────────────────────────────────────────────────────────────────────────────────
const ICON_BOX = 34; // tile edge at rest
const GAP = 6; // between tiles in a group  → pitch 40
const PITCH = ICON_BOX + GAP;
const GROUP_SEP = 13; // 6 + hairline + 6, between groups
const PAD_Y = 16; // top/bottom breathing room so an end tile can magnify without clipping

/**
 * Peak magnification. 34 → 42.5px. Deliberately restrained: at 1.4 the hovered tile read as a
 * balloon rather than a lift, and the point of the effect is the CONTINUITY across neighbours, not
 * the size of the peak.
 */
const MAX_SCALE = 1.25;
/**
 * Falloff radius. 80px = 2 × PITCH exactly, which is the whole tuning: the tile one step away lands
 * mid-curve (≈1.13×) and the tile two steps away sits precisely ON the zero, so the wave dies at the
 * immediate neighbour instead of rippling three deep. Widen this and the rail starts to breathe as a
 * whole; tighten it below ~1.5 × PITCH and the falloff collapses into a plain hover.
 */
const RADIUS = 2 * PITCH;
/**
 * Neighbours slide AWAY from the pointer so the growing tile has room. Bounded and self-cancelling —
 * it peaks mid-radius and returns to 0 at the edge, so nothing drifts cumulatively down the rail
 * (which is what would push the last tiles off a vertical dock).
 *
 * Small on purpose: vertical travel is what actually reads as "wavy", and at MAX_SCALE 1.25 adjacent
 * tiles barely overlap (~0.4px), so there is almost nothing left for it to resolve. It survives as a
 * hint of give, not as displacement.
 */
const SPREAD = 3;
/** Outward travel toward the content area — the vertical rail's version of "rising out of the dock". */
const LIFT = 6;

/**
 * ζ ≈ 0.71 — one small overshoot, settles in ~200ms. Under-damped enough to read as mass, not so
 * loose that a fast sweep leaves the tiles wobbling behind the pointer.
 */
const SPRING = { stiffness: 400, damping: 20, mass: 0.5 } as const;

/** 1 at the pointer → 0 at the radius edge, flat-topped and flat-tailed (raised cosine). */
function bell(distance: number): number {
  const t = Math.min(Math.abs(distance) / RADIUS, 1);
  return 0.5 + 0.5 * Math.cos(Math.PI * t);
}

/** 0 at the pointer, peaks mid-radius, 0 again at the edge — the push, not the growth. */
function push(distance: number): number {
  const t = Math.min(Math.abs(distance) / RADIUS, 1);
  return Math.sign(distance) * Math.sin(Math.PI * t);
}

type Slot = { item: DockItemDef; center: number };

function DockTile({
  slot,
  active,
  pointerY,
  reduced,
}: {
  slot: Slot;
  active: boolean;
  pointerY: MotionValue<number>;
  reduced: boolean;
}) {
  // Signed distance from the pointer to THIS tile's centre. Positive ⇒ tile sits below the pointer.
  const distance = useTransform(pointerY, (py) => slot.center - py);

  const scale = useSpring(useTransform(distance, (d) => 1 + (MAX_SCALE - 1) * bell(d)), SPRING);
  const x = useSpring(useTransform(distance, (d) => LIFT * bell(d)), SPRING);
  const y = useSpring(useTransform(distance, (d) => SPREAD * push(d)), SPRING);

  const tile = (
    <Link
      href={slot.item.url}
      aria-label={slot.item.title}
      aria-current={active ? "page" : undefined}
      className={cn(
        "grid size-full place-items-center rounded-xl border outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-primary/40",
        // ★ THE ACTIVE MARK HAS TO SURVIVE MAGNIFICATION. The expanded rail marks the current route
        // with a left bar, which a 34px square has no room for. Here it is the primary border + a
        // FILLED primary glyph — both are painted inside the tile, so the one transform scales them
        // with it and the mark stays legible (and proportional) at every scale.
        active
          ? "border-primary/45 bg-surface-2"
          : "border-transparent text-ink3 hover:border-line2 hover:bg-surface-2 hover:text-ink",
      )}
    >
      <slot.item.icon
        weight={active ? "fill" : "regular"}
        // em, not px/rem: the glyph size derives from ICON_BOX via the wrapper's fontSize, so the
        // tile stays the single source of geometry.
        className={cn(
          "size-[1.15em] transition-colors",
          active ? "text-primary" : slot.item.ai ? "text-ai-from" : "text-current",
        )}
      />
    </Link>
  );

  const style: React.CSSProperties = {
    position: "absolute",
    top: slot.center - ICON_BOX / 2,
    left: "50%",
    width: ICON_BOX,
    height: ICON_BOX,
    marginLeft: -ICON_BOX / 2,
    fontSize: ICON_BOX / 2, // the em basis the glyph above reads
  };

  // Reduced motion: no magnification at all, plain hover states. The tile is a static box.
  if (reduced) return <div style={style}>{tile}</div>;

  return (
    <motion.div
      style={{
        ...style,
        scale,
        x,
        y,
        // Vertically symmetric growth (pairs with SPREAD); horizontally it grows from the centre and
        // LIFT carries it toward the content edge.
        transformOrigin: "center center",
        willChange: "transform",
      }}
    >
      {tile}
    </motion.div>
  );
}

export function SidebarDock({
  groups,
  isActive,
  className,
}: {
  groups: DockGroup[];
  isActive: (url: string) => boolean;
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  const railRef = useRef<HTMLDivElement>(null);
  const pointerY = useMotionValue(Number.POSITIVE_INFINITY);

  // The label is a single shared element, driven by the same pointer pass as the magnification —
  // not a per-tile tooltip. `top` is a viewport coordinate so it can escape the rail's scroll box.
  const [label, setLabel] = useState<{ title: string; top: number; left: number } | null>(null);
  const labelIndex = useRef(-1);

  const { slots, separators, height } = useMemo(() => {
    const out: Slot[] = [];
    const seps: number[] = [];
    let y = PAD_Y;
    groups.forEach((group, gi) => {
      if (gi > 0) {
        seps.push(y + GROUP_SEP / 2);
        y += GROUP_SEP;
      }
      group.items.forEach((item) => {
        out.push({ item, center: y + ICON_BOX / 2 });
        y += PITCH;
      });
      y -= GAP; // no trailing gap on the last tile of a group
    });
    return { slots: out, separators: seps, height: y + PAD_Y };
  }, [groups]);

  const clear = useCallback(() => {
    pointerY.set(Number.POSITIVE_INFINITY);
    labelIndex.current = -1;
    setLabel(null);
  }, [pointerY]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Touch/pen have no hover to track — a tap must not leave the rail magnified or labelled.
      if (e.pointerType !== "mouse") return;
      const el = railRef.current;
      if (!el) return;

      // ONE rect read, before any write. Everything downstream is arithmetic.
      const rect = el.getBoundingClientRect();
      const scrolled = el.scrollTop;
      const contentY = e.clientY - rect.top + scrolled;
      pointerY.set(contentY);

      // Which tile owns the label — derived from the same pointer position, so the label can never
      // disagree with the magnification. State is set only when the answer CHANGES, so a pointer
      // sweep re-renders ~16 times, not once per frame.
      let idx = -1;
      for (let i = 0; i < slots.length; i++) {
        if (Math.abs(slots[i].center - contentY) <= PITCH / 2) {
          idx = i;
          break;
        }
      }
      if (idx === labelIndex.current) return;
      labelIndex.current = idx;
      setLabel(
        idx === -1
          ? null
          : {
              title: slots[idx].item.title,
              top: rect.top + slots[idx].center - scrolled,
              left: rect.right,
            },
      );
    },
    [pointerY, slots],
  );

  return (
    <>
      <div
        ref={railRef}
        onPointerMove={onPointerMove}
        onPointerLeave={clear}
        // `hidden-scrollbar`, not `custom-scrollbar`: an 8px gutter would eat the room a magnified
        // tile grows into. The rail still scrolls by wheel/touch when the nav outruns the viewport.
        className={cn("hidden-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto", className)}
      >
        <div className="relative" style={{ height }}>
          {separators.map((top) => (
            <span
              key={top}
              aria-hidden
              className="absolute inset-x-3 h-px bg-line"
              style={{ top }}
            />
          ))}
          {slots.map((slot) => (
            <DockTile
              key={slot.item.url}
              slot={slot}
              active={isActive(slot.item.url)}
              pointerY={pointerY}
              reduced={reduced}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {label && (
          <motion.div
            // Fixed, so it is never clipped by the rail's scroll box. Springs in on the same family
            // as the tiles — it arrives WITH the magnification, not after it like a delayed tooltip.
            initial={reduced ? false : { opacity: 0, x: -6, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: -4, scale: 0.98 }}
            transition={reduced ? { duration: 0 } : { ...SPRING, opacity: { duration: 0.12 } }}
            style={{ top: label.top, left: label.left }}
            className="pointer-events-none fixed z-50 -translate-y-1/2 translate-x-3 rounded-lg border border-line2 bg-surface-3 px-3 py-1.5 text-xs whitespace-nowrap text-ink shadow-lg"
          >
            {label.title}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
