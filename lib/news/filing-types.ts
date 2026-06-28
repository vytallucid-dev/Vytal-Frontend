/**
 * NSE filing-type label + family mapping — ONE shared util (never scattered in JSX).
 *
 * An NSE announcement's `headline` is a raw filing-type bucket string ("Updates",
 * "ESOP/ESOS/ESPS"). This maps each known raw bucket to:
 *   • a clean, readable `label` (raw fallback for unknown types — never dropped)
 *   • a broad `family` (4 categorical buckets for color-coding — unknown → "routine")
 *
 * OPEN-SET SAFETY (critical): the NSE variant set is open — new filing types appear.
 *   • Unknown label  → raw string verbatim, `mapped: false` (still listed)
 *   • Unknown family → "routine" (the neutral catch-all, never a wrong specific family)
 *   A wrong color implies a wrong categorization; unknown must always resolve neutral.
 *
 * Keys are normalized (lower-cased, whitespace-collapsed) so trivial casing/spacing
 * drift in the feed still resolves cleanly.
 */

/** Normalize a raw headline to a stable lookup key. */
function normKey(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Four broad categorical families for color-coding.
 * These distinguish KIND of filing — they do NOT imply severity or quality.
 * Do NOT conflate with the condition/health tokens (healthy/crit/etc.).
 */
export type FilingFamily =
  | "corporate_action"   // what a holder receives: dividend, record date, buyback, bonus, split
  | "governance"         // board/shareholder meetings and decisions
  | "capital_ownership"  // equity instruments, takeover, allotment, ESOP
  | "routine";           // general updates and catch-all for any unknown type

/**
 * One accent CSS var per family — categorical (identity), not severity.
 * Uses pillar tokens (`--p-*`) which are identity tokens in the design system, already
 * established as non-grading on the Health/Overview tabs.
 */
export const FAMILY_META: Record<
  FilingFamily,
  { label: string; accent: string }
> = {
  corporate_action:  { label: "Corporate Action",    accent: "var(--p-mkt)"  },
  governance:        { label: "Governance",           accent: "var(--p-own)"  },
  capital_ownership: { label: "Capital & Ownership",  accent: "var(--p-found)" },
  routine:           { label: "Routine",              accent: "var(--p-mom)"  },
};

/** raw (normalized) → clean label. */
const FILING_TYPE_LABELS: Record<string, string> = {
  // ── present in the live data ──────────────────────────────────────────────
  "updates": "Company Update",
  "general updates": "General Update",
  "analysts/institutional investor meet/con. call updates": "Analyst / Investor Meet",
  "esop/esos/esps": "Employee Stock Options",
  "shareholders meeting": "Shareholders Meeting",
  "disclosure under sebi takeover regulations": "Takeover Disclosure",
  "copy of newspaper publication": "Newspaper Publication",
  "action(s) taken or orders passed": "Regulatory Action / Order",
  "press release": "Press Release",
  "credit rating": "Credit Rating",
  "credit rating- revision": "Credit Rating Revision",
  "credit rating - revision": "Credit Rating Revision",
  "record date": "Record Date",
  "suspension of trading": "Trading Suspension",
  "outcome of board meeting": "Board Meeting Outcome",
  "scheme of arrangement": "Scheme of Arrangement",
  "cessation": "Cessation (Director / KMP)",
  "acquisition": "Acquisition",
  // ── common NSE buckets (forward cover) ────────────────────────────────────
  "dividend": "Dividend",
  "financial result updates": "Financial Results",
  "financial results": "Financial Results",
  "investor presentation": "Investor Presentation",
  "board meeting": "Board Meeting",
  "board meeting intimation": "Board Meeting Intimation",
  "change in directors/key managerial personnel": "Board / KMP Change",
  "change in directors": "Board / KMP Change",
  "appointment": "Appointment",
  "resignation": "Resignation",
  "allotment of securities": "Securities Allotment",
  "trading window": "Trading Window",
  "spurt in volume": "Volume Spurt",
  "price movement": "Price Movement",
  "clarification": "Clarification",
  "agm/egm": "AGM / EGM",
  "buyback": "Buyback",
  "bonus": "Bonus Issue",
  "stock split": "Stock Split",
};

/**
 * raw (normalized) → family. Only explicitly known-and-unambiguous types get a
 * specific family; everything else → "routine" (open-set safe).
 */
const FILING_TYPE_FAMILIES: Record<string, FilingFamily> = {
  // corporate_action — what a holder directly receives
  "dividend":    "corporate_action",
  "record date": "corporate_action",
  "buyback":     "corporate_action",
  "bonus":       "corporate_action",
  "stock split": "corporate_action",

  // governance — board/shareholder meetings and formal decisions
  "shareholders meeting":       "governance",
  "outcome of board meeting":   "governance",
  "board meeting":              "governance",
  "board meeting intimation":   "governance",
  "agm/egm":                    "governance",

  // capital_ownership — equity instruments, structural deals, takeover
  "esop/esos/esps":                            "capital_ownership",
  "disclosure under sebi takeover regulations": "capital_ownership",
  "allotment of securities":                   "capital_ownership",
  "scheme of arrangement":                     "capital_ownership",
  "acquisition":                               "capital_ownership",
};

export interface FilingTypeLabel {
  /** Clean label if known, otherwise the raw headline verbatim. */
  label: string;
  /** False when the raw bucket wasn't in the label map (raw fallback in use). */
  mapped: boolean;
  /** Broad categorical family for color-coding. Unknown type → "routine". */
  family: FilingFamily;
}

/**
 * Resolve an NSE raw headline bucket to a display label + family.
 * Unknown label → raw string, `mapped: false`.
 * Unknown family → `"routine"` (neutral catch-all — never a wrong specific family).
 */
export function getFilingTypeLabel(rawHeadline: string): FilingTypeLabel {
  const raw = rawHeadline?.trim() ?? "";
  if (!raw) return { label: "Filing", mapped: false, family: "routine" };
  const key = normKey(raw);
  const labelHit = FILING_TYPE_LABELS[key];
  const familyHit = FILING_TYPE_FAMILIES[key];
  return {
    label: labelHit ?? raw,
    mapped: Boolean(labelHit),
    family: familyHit ?? "routine",
  };
}
