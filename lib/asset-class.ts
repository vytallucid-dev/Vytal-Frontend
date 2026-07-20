// ─────────────────────────────────────────────────────────────────────────────
// ASSET-CLASS VOCABULARY — what the catalogue's `asset_class` enum MEANS, in one place.
// Pure: no imports, no I/O, no React. A leaf, like lib/format.ts.
//
// WHY IT LIVES HERE AND NOT UNDER components/portfolio/transactions/. It used to live in the
// TRANSACTIONS lib, which is a ledger module that also parses wire errors — so it imports
// @/lib/api/client, which constructs the Supabase client at module scope. The moment
// components/portfolio/lib.ts (documented "pure derivations, no JSX") needed ONE label function
// from it, that pure module transitively acquired Supabase and could no longer be imported
// without env set. Nothing was broken at runtime — every consumer is a client component in the
// same bundle — which is exactly the point: this is how a module that "has no dependencies"
// quietly acquires the whole app.
//
// So the vocabulary sits where NEITHER caller owns it. `asset_class` is a property of the
// catalogue, not of the ledger: the ledger was only ever its first reader.
// ─────────────────────────────────────────────────────────────────────────────

/** Human labels for the catalogue's raw `asset_class` enum. Rendered on the picker so a fund is
 *  never mistaken for a stock (17,567 funds, near-identical names), and on every holdings surface
 *  as the true answer for a thing that has no sector. NOT a score/health/band — a category. */
export const ASSET_CLASS_LABEL: Record<string, string> = {
  stock: "Stock",
  etf: "ETF",
  bond: "Bond",
  gsec: "G-Sec",
  sgb: "SGB",
  mutual_fund: "Mutual fund",
  reit: "REIT",
  invit: "InvIT",
};

/** Label an asset class, degrading to the raw value for any unknown future class (never a crash). */
export function assetClassLabel(ac: string | null | undefined): string {
  if (!ac) return "Instrument";
  return ASSET_CLASS_LABEL[ac] ?? ac;
}

/** The coupon-bearing debt classes — a CLIENT MIRROR of the backend's COUPON_BEARING set
 *  (portfolio/disclosures.ts). These carry an income leg (coupons / SGB interest) this system does
 *  not track, so entry must disclose it and ask for a dirty (accrued-interest-inclusive) price.
 *  Kept in step with the backend by hand. */
const COUPON_BEARING: ReadonlySet<string> = new Set(["bond", "gsec", "sgb"]);

export function isCouponBearing(ac: string | null | undefined): boolean {
  return !!ac && COUPON_BEARING.has(ac);
}
