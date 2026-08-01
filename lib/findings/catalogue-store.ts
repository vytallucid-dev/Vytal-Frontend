// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE CATALOGUE STORE — how fetched copy reaches four SYNCHRONOUS resolvers without changing them.
//
// ── THE PROBLEM THIS SOLVES ───────────────────────────────────────────────────────────────────────
// `findingName(key)`, `findingDescription(key)`, `doesntMean(key)` and `renderVerdict(key, ev)` are
// pure synchronous functions called from ~13 places, most of them deep inside render trees and inside
// non-React helpers (`prepareCensus`, `classifyMembers`, `eventPhrase`). Turning them into hooks would
// mean touching every one of those call sites and would make several of them impossible — a plain
// module function cannot call `useQuery`.
//
// So the fetch does NOT happen inside the resolvers. It happens ONCE, in a provider, which hydrates
// this module-level store; the resolvers read the store synchronously and fall back to the constants
// they already had. Signatures unchanged, call sites unchanged, and the copy is now server-owned.
//
// ── ⚠ THE FALLBACK IS THE POINT, NOT A CONVENIENCE (5b) ───────────────────────────────────────────
// A cold or failed fetch degrades to TODAY'S BEHAVIOUR — the full bundled copy, every name, every
// description, every boundary. It does NOT degrade to the documented "render title only when absent"
// path. That path was written for a world where a missing description meant one card had no
// description; in a world where the whole catalogue is fetched, it means EVERY card on EVERY surface
// silently loses its explanatory line at once, which reads as a styling glitch rather than an outage.
// A reader would not report it and we would not notice.
//
// ── ⚠ AND THE FALLBACK IS LOUD (5c) ───────────────────────────────────────────────────────────────
// Graceful for the reader, loud for us. See `reportFallback` below. A fallback nobody can see firing
// is how an outage lasts a week.
//
// ── ⚠ THE STORE IS SET ONCE PER PAGE LOAD, AND MUST NEVER BE PER-USER ─────────────────────────────
// Module-level mutable state is shared by everything in the JS context. That is safe here for exactly
// one reason: the catalogue is STATIC PRODUCT VOCABULARY — the same bytes for every reader, changing
// only on deploy. Nothing per-user may ever be routed through this module. If that ever stops being
// true, this design stops being safe, and the answer is a React context, not a bigger store.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import type { FindingConcern, FindingFamily } from "./descriptions";
// The generated fallback, imported DIRECTLY (it has no imports of its own, so there is no cycle with
// descriptions.ts, which imports this store). Used only by the staleness detector below.
import {
  GENERATED_FROM_VERSION,
  GEN_FINDING_DESCRIPTIONS,
  GEN_FINDING_NAMES,
} from "./generated/copy.generated";

/** One served stock-finding entry. Mirrors the backend's StockFindingEntry. */
export interface CatalogueStockEntry {
  registry: "stock_finding";
  key: string;
  name: string;
  description: string;
  family: FindingFamily;
  concern: FindingConcern;
  status: "live" | "dormant" | "synthesised";
  doesntMean: string;
}

/** One served three-lens face. Mirrors the backend's LensFaceEntry. */
export interface CatalogueLensEntry {
  registry: "lens_face";
  key: string;
  name: string;
  description: string;
  tone: string;
  fieldVerdict: "PG_WEAK" | "PG_STRONG" | null;
  escalates: boolean;
  doesntMean: string;
}

export interface CatalogueBoundaries {
  /** Family letter → mandatory boundary line. Total over A–I + N. */
  family: Record<string, string>;
  /** Lowercase face id (lm3 / lm7 / lp2 / lp5) → escalating lens boundary. */
  lens: Record<string, string>;
}

/** The shape of GET /api/v1/catalogue's `data`. Only the parts the frontend reads are typed. */
export interface CatalogueDocument {
  version: string;
  registries: {
    stock_finding: { count: number; entries: Record<string, CatalogueStockEntry> };
    lens_face: { count: number; entries: Record<string, CatalogueLensEntry> };
    [k: string]: { count: number; entries: Record<string, unknown> } | undefined;
  };
  boundaries: CatalogueBoundaries;
}

// ── the store ─────────────────────────────────────────────────────────────────────────────────────
let DOC: CatalogueDocument | null = null;

/** Where the copy a reader is currently seeing came from. Exposed for the monitor + the proofs. */
export type CopySource = "catalogue" | "bundled";

export function catalogueSource(): CopySource {
  return DOC ? "catalogue" : "bundled";
}

export function catalogueVersion(): string | null {
  return DOC?.version ?? null;
}

/**
 * Hydrate the store. Called ONCE by CatalogueProvider on a successful fetch.
 * Rejects a malformed document rather than half-installing it: a payload missing its stock_finding
 * registry would otherwise silently strip every description in the product while `catalogueSource()`
 * cheerfully reported "catalogue".
 */
export function setCatalogue(doc: unknown): boolean {
  const d = doc as CatalogueDocument | null;
  const entries = d?.registries?.stock_finding?.entries;
  if (!d || !entries || typeof entries !== "object" || Object.keys(entries).length === 0) {
    reportFallback("malformed-document", "the served document has no stock_finding entries");
    return false;
  }
  if (!d.boundaries?.family || !d.boundaries?.lens) {
    reportFallback("malformed-document", "the served document has no boundary maps");
    return false;
  }
  DOC = d;
  checkFallbackFreshness(d);
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ★ STAGE 6 · THE RUNTIME STALENESS DETECTOR — the safety net that needs no setup at all.
//
// The bundled fallback is MACHINE-GENERATED from the backend catalogue, and a backend-side gate
// (`npm run verify:copy-fresh`) fails when the committed file drifts. But that gate needs BOTH repos
// checked out side by side, which is exactly the kind of local-setup assumption that quietly stops
// being true — a second machine, a different CI runner, a clone that only pulled one repo.
//
// So the check also runs HERE, at the moment the served document arrives, against the copy actually
// shipped in this bundle. It needs no environment, no paths and no configuration: if the deployed
// frontend was built from a different catalogue than the deployed backend is serving, this fires the
// first time any reader loads a page, and `window.__vytalCopyFallback` says so.
//
// ⚠ IT DOES NOT SWITCH ANYTHING OFF. Stale-but-present bundled copy is still the right fallback for
// an outage — the served copy is already installed and wins. This reports; it never degrades.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
function checkFallbackFreshness(d: CatalogueDocument): void {
  if (d.version === GENERATED_FROM_VERSION) return;

  // A version mismatch alone is worth reporting, but the useful signal is WHICH strings differ — a
  // version can change for a reason that touched nothing this bundle renders.
  const served = d.registries.stock_finding.entries;
  const differing: string[] = [];
  for (const [key, entry] of Object.entries(served)) {
    const bundled = GEN_FINDING_DESCRIPTIONS[key];
    if (!bundled) { differing.push(`${key} (absent from the bundle)`); continue; }
    if (bundled.description !== entry.description || bundled.doesntMean !== entry.doesntMean) differing.push(key);
    else if (GEN_FINDING_NAMES[key] !== entry.name) differing.push(`${key} (name)`);
  }
  for (const key of Object.keys(GEN_FINDING_DESCRIPTIONS)) {
    if (!served[key]) differing.push(`${key} (bundled but no longer served)`);
  }

  reportFallback(
    "fallback-stale",
    `the bundled copy was generated from catalogue ${GENERATED_FROM_VERSION} but the endpoint is serving ${d.version}` +
      (differing.length
        ? ` — ${differing.length} entr${differing.length === 1 ? "y differs" : "ies differ"}: ${differing.slice(0, 8).join(", ")}${differing.length > 8 ? " …" : ""}`
        : " — no rendered string differs, so this bundle is safe; regenerate at your convenience"),
  );
}

/** Test/reset hook — also what the fallback proof uses to simulate a cold start. */
export function clearCatalogue(): void {
  DOC = null;
}

export function stockEntry(key: string): CatalogueStockEntry | null {
  return DOC?.registries.stock_finding.entries[key] ?? null;
}

export function lensEntry(faceIdUpper: string): CatalogueLensEntry | null {
  return DOC?.registries.lens_face?.entries[faceIdUpper] ?? null;
}

export function familyBoundary(family: string): string | null {
  return DOC?.boundaries.family[family] ?? null;
}

export function lensBoundary(faceIdLower: string): string | null {
  return DOC?.boundaries.lens[faceIdLower] ?? null;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ★ 5c · THE LOUD SIGNAL. Graceful for the reader, impossible to miss for us.
//
// Three channels, because each catches a different way of not noticing:
//
//   console.error   with a STABLE, GREPPABLE prefix. Shows up in any error-reporting integration that
//                   hooks console, and in a support screenshot.
//   window counter  `window.__vytalCopyFallback` — a live tally anyone can read in a console without
//                   reproducing the failure. `{ source, version, reasons: {...}, total }`.
//   CustomEvent     `vytal:copy-fallback` on window — the seam a real telemetry sink attaches to
//                   without this module having to know it exists.
//
// ⚠ DEDUPED PER REASON, NOT SILENCED. The FIRST occurrence of each reason always logs at full volume.
// Later ones increment the counter only. Without that, one unresolved key inside a list render would
// emit thousands of identical lines and the signal would be indistinguishable from noise — which is
// the same as being silent, just louder.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

export type FallbackReason =
  | "fetch-failed" // the catalogue request errored or never resolved
  | "malformed-document" // it resolved, but the payload is not usable
  | "key-missing" // catalogue is live but does not carry a key that reached a payload
  | "cold" // a resolver ran before the fetch completed (expected once per load)
  | "verdict-missing" // a finding row arrived with no server-rendered verdict
  | "fallback-stale"; // ★ the GENERATED bundled copy disagrees with what the endpoint served

const seen = new Set<FallbackReason>();
const counts: Record<string, number> = {};

interface FallbackWindow {
  __vytalCopyFallback?: {
    source: CopySource;
    version: string | null;
    reasons: Record<string, number>;
    total: number;
  };
}

export function reportFallback(reason: FallbackReason, detail: string): void {
  counts[reason] = (counts[reason] ?? 0) + 1;

  if (typeof window !== "undefined") {
    const w = window as unknown as FallbackWindow;
    w.__vytalCopyFallback = {
      source: catalogueSource(),
      version: catalogueVersion(),
      reasons: { ...counts },
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    };
    try {
      window.dispatchEvent(new CustomEvent("vytal:copy-fallback", { detail: { reason, detail, count: counts[reason] } }));
    } catch {
      /* a browser that dislikes CustomEvent must never break a render */
    }
  }

  if (seen.has(reason)) return; // first of each reason is loud; the rest only count
  seen.add(reason);
  // eslint-disable-next-line no-console
  console.error(
    `[copy-fallback] ${reason} — ${detail}. Rendering BUNDLED copy. ` +
      `Readers see full text, but the catalogue endpoint is not being used. ` +
      `Inspect window.__vytalCopyFallback for the running tally.`,
  );
}

/** The running tally, for the proofs and for anything that wants to assert on it. */
export function fallbackTally(): { reasons: Record<string, number>; total: number } {
  return { reasons: { ...counts }, total: Object.values(counts).reduce((a, b) => a + b, 0) };
}

/** Reset the dedupe + tally. Test hook only. */
export function resetFallbackTally(): void {
  seen.clear();
  for (const k of Object.keys(counts)) delete counts[k];
}
