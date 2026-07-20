// ─────────────────────────────────────────────────────────────────────────────
// HOLDINGS TAB · PER-ENTITY ROWS — the "one instrument = one holding" model.
//
// The raw /me/holdings list is per-(account,instrument): RELIANCE-in-two-accounts is two lines, an
// NTPC stock + bond is two lines. This tab renders ONE row per ISSUER ENTITY — the SAME collapse the
// Health tab does — so the two tabs agree on what a holding is. We do NOT re-implement that collapse:
// we call the shared `aggregateHoldings` helper (health/lib) and project its `EntityHolding` onto a
// `Holding`-shaped row, so the existing positions table (columns, sort, group-by) renders it unchanged.
//
// THE ROW CARRIES ENTITY-LEVEL MONEY. invested / current / P&L / day-change SUM across the collapsed
// instruments. avgCost / LTP are per-instrument and DO NOT sum: a single-instrument entity shows its
// (account-blended) figure; a genuine multi-instrument entity (a stock + a bond) shows a DASH rather
// than a fabricated blend — the expand breaks out each instrument's own basis.
//
// FILTERING NARROWS THE LIST, NEVER THE NUMBERS. We aggregate the WHOLE book first (so every value is a
// full-portfolio value), then filter the entity rows to those that TOUCH the selected account. A
// holding in Grow 1 still shows its whole ~20.6% weight; account-SCOPED math is the account detail
// page's job, never this one's.
// ─────────────────────────────────────────────────────────────────────────────
import type { Holding } from "@/types/portfolio";
import type { AccountShare, EntityHolding } from "../health/lib";
import { aggregateHoldings } from "../health/lib";

export type { AccountShare, EntityHolding, EntityInstrument } from "../health/lib";

/** One positions-table row = one issuer entity, shaped as a `Holding` (so sort / group-by / columns
 *  render it unchanged) with the full `EntityHolding` attached for the "held in" indicator + the expand.
 *  Per-instrument-only fields that cannot be honestly summed across a stock and a bond are `null` on a
 *  multi-instrument row (`entity.multiInstrument`); the table dashes them and the expand breaks them out. */
export interface HoldingRow extends Holding {
  entity: EntityHolding;
}

/** Project an aggregated entity onto a `Holding`-shaped row. The base is the representative (so every
 *  Holding field — isin, tier, sector, assetClass, band — is populated), overlaid with the entity-level
 *  aggregates. `symbol` becomes the entity's display name; `quantity` / `avgCost` fall to the
 *  single-instrument figure (a multi-instrument entity's are dashed at the display layer). */
export function entityToRow(e: EntityHolding): HoldingRow {
  const single = !e.multiInstrument;
  return {
    ...e.representative,
    symbol: e.displayName,
    quantity: single ? e.representative.quantity : 0, // multi → meaningless; dashed in the table
    avgCost: e.avgCost ?? 0, // multi → dashed in the table (never a fabricated stock+bond blend)
    investedValue: e.invested,
    realizedPnl: e.realizedPnl,
    currentPrice: e.currentPrice, // null for multi → the LTP cell already dashes null
    marketValue: e.marketValue,
    dayChangePct: e.dayChangePct,
    dayChangeValue: e.dayChangeValue,
    unrealizedPnl: e.unrealizedPnl,
    health: e.health,
    band: e.band,
    tier: e.tier,
    weight: e.weight,
    sector: e.representative.sector,
    assetClass: e.representative.assetClass,
    disclosureNotes: e.disclosureNotes,
    priceSource: e.priceSource,
    priceAsOf: e.priceAsOf,
    accountName: e.accounts[0]?.accountName,
    entity: e,
  };
}

/** The whole book as per-entity rows (full-portfolio values), and the instrument-merged list the
 *  allocation donut reads. The donut stays INSTRUMENT-level so the class cut keeps a stock+bond
 *  issuer's bond honestly in "Bond" rather than folding it into "Stock". */
export interface AggregatedBook {
  rows: HoldingRow[]; // one per issuer entity — the positions table
  instruments: Holding[]; // instrument-merged (RELIANCE once; NTPC stock + bond separate) — the donut
}

export function aggregateBook(holdings: Holding[]): AggregatedBook {
  const entities = aggregateHoldings(holdings);
  return {
    rows: entities.map(entityToRow),
    instruments: entities.flatMap((e) => e.instruments.map((i) => i.instrument)),
  };
}

/** Does this entity row touch the given account? (any constituent instrument held there.) */
export function rowTouchesAccount(row: HoldingRow, accountId: string): boolean {
  return row.entity.accounts.some((a) => a.accountId === accountId);
}

/** The distinct accounts across a set of holdings, id → NAME, in first-seen order. Derived from the
 *  holdings themselves (no accounts fetch): the filter offers exactly the accounts that hold something.
 *  The id is the value/key ONLY — the label is always the account name, never the UUID (a raw id is not a
 *  thing a human can read; same rule as the disclosure codes and the mock-broker label). */
export function accountOptions(holdings: Holding[]): { id: string; name: string }[] {
  const m = new Map<string, string>();
  for (const h of holdings) if (h.accountId) m.set(h.accountId, h.accountName || "Unnamed account");
  return [...m.entries()].map(([id, name]) => ({ id, name }));
}

/** The compact "held in" label for a row — the account name(s) this entity touches. One account →
 *  its name; several → names joined, capped so the row stays legible ("Grow 1 · demo · +1"). */
export function heldInLabel(accounts: AccountShare[], max = 2): string {
  if (accounts.length === 0) return "";
  const names = accounts.map((a) => a.accountName);
  if (names.length <= max) return names.join(" · ");
  return `${names.slice(0, max).join(" · ")} · +${names.length - max}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Format an ISO/date string as "12 Jul 2026" — locale-free, so no server/client hydration drift. */
export function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/** The price stamp for a row — WHO priced it and WHEN, told truthfully. An AMFI NAV says "NAV as of
 *  {date}", NEVER "at last close" (a fund NAV is not an exchange close and may be days old); an exchange
 *  close keeps "at last close". `null` ⇒ no stamp (unpriced, or a multi-instrument entity). */
export function priceStamp(source: string | null | undefined, asOf: string | null | undefined): string | null {
  const date = fmtDate(asOf);
  if (source === "amfi_nav") return date ? `NAV as of ${date}` : "NAV";
  if (source === "exchange_close" || source === "stock_price") return date ? `at close · ${date}` : "at last close";
  return date ? `as of ${date}` : null;
}
