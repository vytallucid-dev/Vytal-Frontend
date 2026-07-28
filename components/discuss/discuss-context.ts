// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE DISCUSS CONTEXT CONTRACT — what a card hands the future "discuss this" conversation.
//
// This is the plumbing, and it is the part most likely to be wrong later, so it is designed against ONE
// rule: it is the thing the SERVER reads to compose the opening message — NOT a rendered prompt. Cards
// supply structured context; the phrasing of the opening line belongs next to the tone resolver and the
// grounding, server-side, so we can tune the chat's voice without a frontend deploy. That is why there
// is no `prompt` field here and never should be — a card describes WHAT the conversation is about; the
// server decides HOW to open it.
//
// Everything here MUST stay JSON-serializable (it will be POSTed to the server as-is): no functions, no
// React nodes, no class instances. Keep `detail` loose but typed as a record — it is seed material, and
// we do not yet know everything the chat will want from each surface.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

/** The kinds of thing a conversation can be *about*. Extend as new surfaces adopt the trigger. */
export type DiscussSubjectKind = "stock" | "portfolio" | "comparison" | "finding";

/** WHAT the conversation is about. `kind` is always set; the rest is filled per kind (a stock read sets
 *  `symbol`; a comparison sets `symbols`; a portfolio read may set only `name`). The server grounds the
 *  opening message on this — so it carries identity, never presentation. */
export interface DiscussSubject {
  kind: DiscussSubjectKind;
  /** Ticker when the subject is a single stock (or the stock a finding hangs off). */
  symbol?: string;
  /** A human name for the header + grounding — a company name, "Your portfolio", a finding's title. */
  name?: string;
  /** For a comparison: the tickers in play. */
  symbols?: string[];
}

/** The typed context a card hands the trigger. `surface` + `subject` are the server's to compose from;
 *  `label` is the card's own words for the affordance; `detail` is optional seed material. One object,
 *  one prop — a card drops in `<DiscussTrigger context={...} />` and nothing else. */
export interface DiscussContext {
  /** WHICH card/section raised this — the server keys the opening prompt off it.
   *  e.g. "stock_health_insight", "finding", "portfolio_health". Stable, snake_case, server-owned. */
  surface: string;
  /** WHAT it's about — see DiscussSubject. */
  subject: DiscussSubject;
  /** The button's own text — per-card and personalized ("Discuss this read", "Ask about this finding").
   *  It's the affordance's label, not prompt material; it travels with the context but the server needn't
   *  use it to phrase the opening. */
  label: string;
  /** Section-specific seed material the chat may weave into its opening — the numbers/text the user was
   *  just looking at. Loose by design; MUST be JSON-serializable. Never put observability-only fields
   *  (e.g. model-vs-fallback) or validation-only fields (citations) here — seed content, not mechanics. */
  detail?: Record<string, unknown>;
}
