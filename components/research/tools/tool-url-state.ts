/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 * THE TOOLS' URL STATE — what survives a navigation, and what does not. One rule, one home.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 *
 * All three research tools (Trajectory / Divergence / Ownership) carry their view state in the URL
 * rather than in component state, for the reason `?pattern=` and `?view=` already do it: a view a
 * reader can send to someone else, that survives a refresh, and that comes back intact on Back.
 * A window held in `useState` did none of those — it reset on stock switch, on tool switch, on back
 * navigation, and could not be linked at all.
 *
 * ── ★ THE PARAM SCOPE RULE ───────────────────────────────────────────────────────────────────────
 *
 *   A param survives a stock switch only if its value is valid for EVERY stock.
 *   A value whose validity depends on the incoming stock's own data — data we do not have at
 *   navigation time — is stock-scoped, and is dropped so the tool re-resolves it from what that
 *   stock actually has.
 *
 * That single sentence decides every param, and it deliberately CUTS THROUGH two of them rather
 * than classifying them whole — because neither `view` nor `window` is uniformly one or the other:
 *
 *   pattern        → always dropped. A finding id belongs to the stock it fired on.
 *   view=full      → carried. "Every pillar and the composite" is drawable on any scored stock.
 *   view=pattern   → dropped. It needs the incoming stock to HAVE a reading to focus. Carried onto
 *                    a stock that fires nothing, `resolveSelected` returns null, SelectionChart and
 *                    SelectionReadout both render nothing, and the Pattern button that would undo it
 *                    is itself disabled — the reader is stranded in an empty mode. Dropping it lets
 *                    trajectory-tool's own default resolve the mode from what this stock fires,
 *                    which lands on "pattern" anyway whenever the new stock has readings. This is
 *                    the same hazard trajectory-mode.tsx's header already warns about for the
 *                    absent-param case; carrying it across stocks is the other door into it.
 *   window quarterly → carried. It slices `trajectory.series`, which every scored stock has.
 *   window daily/custom → dropped. Both are defined against ONE stock's daily retention (custom
 *                    literally carries that stock's dates). On a stock with no daily history they
 *                    slice to zero points, and the empty-state copy tells the reader to "widen the
 *                    dates" using controls that render disabled for exactly that stock.
 *
 * ⚠ EVERY STOCK-CHANGING NAVIGATION GOES THROUGH `paramsForStockSwitch`. Not one of them re-derives
 *   this locally. Deciding it per call site is the drift this codebase has already paid for twice.
 */

import {
  DAY_OPTIONS,
  DEFAULT_WINDOW,
  QUARTER_OPTIONS,
  windowKey,
  type DayCount,
  type QuarterCount,
  type ToolWindow,
} from "./tool-frame.types";

export const WINDOW_PARAM = "window";
export const VIEW_PARAM = "view";
export const PATTERN_PARAM = "pattern";
export const SYMBOL_PARAM = "symbol";

const ISO = "(\\d{4}-\\d{2}-\\d{2})?";
const CUSTOM_RE = new RegExp(`^c${ISO}_${ISO}$`);

/**
 * Parse `?window=` into a ToolWindow. The wire format is `windowKey`'s output, so the serializer
 * already existed and this is its inverse — `q12` · `d60` · `c2026-01-01_2026-06-30`.
 *
 * ⚠ TOTAL, AND FALLS BACK RATHER THAN THROWING. This value arrives from a URL, which means a stale
 *   link, a hand-edited address bar or a shared view from a build that had different options. An
 *   unrecognised value resolves to the default window — never a broken chart, never a throw.
 *
 * ⚠ VALIDATED AGAINST THE OPTION LISTS, NOT A HARD-CODED SET, so a count added to QUARTER_OPTIONS /
 *   DAY_OPTIONS becomes linkable without a second edit here.
 *
 * The custom halves are OPTIONAL on purpose: the date inputs can be cleared to "", `windowKey` then
 * emits `c_2026-06-30`, and sliceWindow already reads an empty bound as open-ended. Discarding that
 * to the default would turn "clear the start date" into "jump back to 3Y quarterly".
 */
export function parseWindow(raw: string | null | undefined): ToolWindow {
  if (!raw) return DEFAULT_WINDOW;

  const q = /^q(\d+)$/.exec(raw);
  if (q) {
    const n = Number(q[1]);
    return QUARTER_OPTIONS.some((o) => o.value === n)
      ? { mode: "quarterly", quarters: n as QuarterCount }
      : DEFAULT_WINDOW;
  }

  const d = /^d(\d+)$/.exec(raw);
  if (d) {
    const n = Number(d[1]);
    return DAY_OPTIONS.some((o) => o.value === n)
      ? { mode: "daily", days: n as DayCount }
      : DEFAULT_WINDOW;
  }

  const c = CUSTOM_RE.exec(raw);
  if (c) {
    const start = c[1] ?? "";
    const end = c[2] ?? "";
    // A backwards range would slice to nothing with no way for the reader to see why.
    if (start && end && start > end) return DEFAULT_WINDOW;
    return { mode: "custom", start, end };
  }

  return DEFAULT_WINDOW;
}

/** Write a window into a param set — omitted entirely when it IS the default, so the common URL
 *  stays clean and an absent param and a default param can never disagree. */
export function writeWindowParam(params: URLSearchParams, w: ToolWindow): void {
  const key = windowKey(w);
  if (key === windowKey(DEFAULT_WINDOW)) params.delete(WINDOW_PARAM);
  else params.set(WINDOW_PARAM, key);
}

/**
 * ★ THE ONE PLACE A STOCK SWITCH DECIDES WHAT IT KEEPS. Applies the scope rule in this file's
 * header. Returns a fresh param set — it never mutates the current one.
 */
export function paramsForStockSwitch(
  current: URLSearchParams | { get(name: string): string | null },
  symbol: string,
): URLSearchParams {
  const next = new URLSearchParams();
  next.set(SYMBOL_PARAM, symbol);

  // window — quarterly carries (valid on every scored stock); daily/custom are stock-relative.
  const w = parseWindow(current.get(WINDOW_PARAM));
  if (w.mode === "quarterly") writeWindowParam(next, w);

  // view — only the explicitly stock-independent mode carries. "pattern" is re-resolved by the
  // tool's own default against what the incoming stock actually fires.
  if (current.get(VIEW_PARAM) === "full") next.set(VIEW_PARAM, "full");

  // pattern — never carried. Not listed here because "absent" IS the rule for it.
  return next;
}
