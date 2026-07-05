"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TOAST — the platform's single, theme-matched notification surface.
//
// Vytal has no toast library (the codebase historically used inline notices). This is
// a tiny, dependency-free replacement built to the design system: layered surface + a
// hairline border tinted by the toast's semantic accent, an icon chip in that accent,
// Inter title / ink3 detail, a thin progress bar, and a spring-in / fade-out motion.
//
// Two parts live here:
//   • an imperative `toast` API (a module-level store) — call `toast.success(...)` from
//     ANYWHERE, including non-React code (React Query mutation callbacks, event handlers).
//   • the <Toaster /> renderer — mounted ONCE in the root layout; portals the stack to
//     <body> so a toast fired from inside a Dialog/Sheet still sits above it.
//
// Accents map onto the Vytal semantic scale: success → rec (green) · error → crit (red) ·
// warning → high (amber) · info → pristine (cool blue) · loading → neutral primary.
// ─────────────────────────────────────────────────────────────────────────────

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icons, type Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

// ── types ────────────────────────────────────────────────────────────────────
export type ToastVariant =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "loading"
  | "default";

export interface ToastOptions {
  /** secondary line under the title (muted). */
  description?: React.ReactNode;
  /** ms before auto-dismiss. Defaults per variant; `loading` never auto-dismisses. */
  duration?: number;
  /** stable id — pass it again to UPDATE an existing toast (used by toast.promise). */
  id?: string | number;
  /** an inline action button on the right (e.g. Undo / View). */
  action?: { label: string; onClick: () => void };
}

interface ToastItem extends ToastOptions {
  id: string | number;
  title: React.ReactNode;
  variant: ToastVariant;
}

// ── the store (module-level singleton, framework-agnostic) ─────────────────────
const MAX_VISIBLE = 4;
let items: ToastItem[] = [];
const listeners = new Set<() => void>();
let counter = 0;

function emit() {
  for (const l of listeners) l();
}

function upsert(item: ToastItem): string | number {
  const idx = items.findIndex((t) => t.id === item.id);
  if (idx >= 0) {
    // update in place (keeps position) — powers toast.promise's loading→result swap
    const next = items.slice();
    next[idx] = { ...next[idx], ...item };
    items = next;
  } else {
    items = [item, ...items].slice(0, MAX_VISIBLE);
  }
  emit();
  return item.id;
}

function removeToast(id: string | number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 3500,
  info: 4000,
  warning: 5000,
  error: 6000,
  default: 4000,
  loading: Infinity,
};

function make(
  variant: ToastVariant,
  title: React.ReactNode,
  opts: ToastOptions = {},
): string | number {
  const id = opts.id ?? ++counter;
  return upsert({
    ...opts,
    id,
    title,
    variant,
    duration: opts.duration ?? DEFAULT_DURATION[variant],
  });
}

// ── the imperative API ─────────────────────────────────────────────────────────
type ToastFn = ((title: React.ReactNode, opts?: ToastOptions) => string | number) & {
  success: (title: React.ReactNode, opts?: ToastOptions) => string | number;
  error: (title: React.ReactNode, opts?: ToastOptions) => string | number;
  warning: (title: React.ReactNode, opts?: ToastOptions) => string | number;
  info: (title: React.ReactNode, opts?: ToastOptions) => string | number;
  loading: (title: React.ReactNode, opts?: ToastOptions) => string | number;
  message: (title: React.ReactNode, opts?: ToastOptions) => string | number;
  dismiss: (id?: string | number) => void;
  promise: <T>(
    promise: Promise<T>,
    msgs: {
      loading: React.ReactNode;
      success: React.ReactNode | ((data: T) => React.ReactNode);
      error: React.ReactNode | ((err: unknown) => React.ReactNode);
    },
    opts?: ToastOptions,
  ) => Promise<T>;
};

const base = ((title: React.ReactNode, opts?: ToastOptions) =>
  make("default", title, opts)) as ToastFn;

base.success = (title, opts) => make("success", title, opts);
base.error = (title, opts) => make("error", title, opts);
base.warning = (title, opts) => make("warning", title, opts);
base.info = (title, opts) => make("info", title, opts);
base.loading = (title, opts) => make("loading", title, opts);
base.message = (title, opts) => make("default", title, opts);
base.dismiss = (id) => {
  if (id == null) {
    items = [];
    emit();
  } else removeToast(id);
};
base.promise = (promise, msgs, opts) => {
  const id = make("loading", msgs.loading, opts);
  promise.then(
    (data) =>
      make("success", typeof msgs.success === "function" ? msgs.success(data) : msgs.success, {
        ...opts,
        id,
      }),
    (err) =>
      make("error", typeof msgs.error === "function" ? msgs.error(err) : msgs.error, {
        ...opts,
        id,
      }),
  );
  return promise;
};

export const toast = base;

// ── visual language ──────────────────────────────────────────────────────────
const VARIANT: Record<
  ToastVariant,
  { icon: Icon; cssVar: string; spin?: boolean }
> = {
  success: { icon: Icons.success, cssVar: "var(--rec)" },
  error: { icon: Icons.xCircle, cssVar: "var(--crit)" },
  warning: { icon: Icons.warningTriangle, cssVar: "var(--high)" },
  info: { icon: Icons.info, cssVar: "var(--info)" },
  loading: { icon: Icons.spinner, cssVar: "var(--primary)", spin: true },
  default: { icon: Icons.bell, cssVar: "var(--primary)" },
};

// ── one toast card (owns its own auto-dismiss timer; pauses on hover) ──────────
function ToastCard({ item }: { item: ToastItem }) {
  const { icon: Ico, cssVar, spin } = VARIANT[item.variant];
  const duration = item.duration ?? DEFAULT_DURATION[item.variant];
  const finite = Number.isFinite(duration);

  // hover pauses the countdown — track remaining time across pause/resume
  const [paused, setPaused] = React.useState(false);
  const remainingRef = React.useRef(duration);
  const startRef = React.useRef(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!finite || paused) return;
    startRef.current = Date.now();
    timerRef.current = setTimeout(() => removeToast(item.id), remainingRef.current);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // bank the elapsed time so a resume continues, not restarts
      remainingRef.current -= Date.now() - startRef.current;
    };
    // re-arm whenever pause flips or the toast is updated (duration change)
  }, [paused, finite, item.id, duration]);

  // a fresh update (toast.promise loading→success) resets the countdown
  React.useEffect(() => {
    remainingRef.current = duration;
  }, [item.variant, item.title, duration]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.16 } }}
      transition={{ type: "spring", stiffness: 460, damping: 34 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role={item.variant === "error" ? "alert" : "status"}
      aria-live={item.variant === "error" ? "assertive" : "polite"}
      className="glass-strong pointer-events-auto relative w-full overflow-hidden rounded-xl border shadow-[0_10px_40px_-12px_rgba(0,0,0,0.65)]"
      style={{ borderColor: `color-mix(in oklch, ${cssVar} 32%, var(--line2))` }}
    >
      {/* faint accent wash from the leading edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(100deg, color-mix(in oklch, ${cssVar} 10%, transparent), transparent 42%)`,
        }}
      />

      <div className="relative flex items-start gap-3 px-3.5 py-3">
        {/* icon chip */}
        <span
          className="mt-px grid size-7 shrink-0 place-items-center rounded-lg"
          style={{
            color: cssVar,
            background: `color-mix(in oklch, ${cssVar} 14%, transparent)`,
            boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${cssVar} 30%, transparent)`,
          }}
        >
          <Ico weight="fill" className={cn("size-4", spin && "animate-spin")} />
        </span>

        {/* copy */}
        <div className="min-w-0 flex-1 pt-px">
          <p className="text-[13px] font-semibold leading-snug text-ink">{item.title}</p>
          {item.description != null && (
            <p className="mt-0.5 text-[12px] leading-relaxed text-ink3">{item.description}</p>
          )}
          {item.action && (
            <button
              type="button"
              onClick={() => {
                item.action?.onClick();
                removeToast(item.id);
              }}
              className="mt-2 inline-flex h-7 items-center rounded-md border border-line2 bg-surface-2 px-2.5 text-[11.5px] font-medium text-ink2 transition-colors hover:border-line3 hover:text-ink"
            >
              {item.action.label}
            </button>
          )}
        </div>

        {/* dismiss */}
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => removeToast(item.id)}
          className="-mr-1 -mt-0.5 grid size-6 shrink-0 place-items-center rounded-md text-ink3 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <Icons.close className="size-3.5" />
        </button>
      </div>

      {/* progress bar — depletes over the toast's lifetime, freezes on hover */}
      {finite && (
        <motion.span
          aria-hidden
          className="absolute bottom-0 left-0 h-[2px]"
          style={{ background: cssVar }}
          initial={{ width: "100%" }}
          animate={{ width: paused ? undefined : "0%" }}
          transition={{ duration: paused ? 0 : remainingRef.current / 1000, ease: "linear" }}
        />
      )}
    </motion.div>
  );
}

// ── the renderer — mount once, high in the tree (see app/layout.tsx) ───────────
export function Toaster() {
  const [mounted, setMounted] = React.useState(false);
  const snapshot = React.useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => items,
    () => items,
  );

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[9999] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end sm:p-5"
      style={{ maxHeight: "100dvh" }}
    >
      <div className="flex w-full max-w-[calc(100vw-2rem)] flex-col gap-2 sm:w-[360px]">
        <AnimatePresence initial={false} mode="popLayout">
          {snapshot.map((item) => (
            <ToastCard key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </div>
    </div>,
    document.body,
  );
}
