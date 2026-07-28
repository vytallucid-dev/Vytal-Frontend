// ─────────────────────────────────────────────────────────────────────────────
// CHANGE-KEYS PROOF — the CLIENT half of the chat's post-write invalidation, against a REAL QueryClient.
//
// The end-to-end chain is: server sends `changed:["alerts"]` → invalidateChanged → React Query marks
// ["me","alerts"] stale → useAlerts refetches → the navbar bell recomputes its count. Only the last
// link needs a browser; every link before it is decidable here, so it is proven here rather than
// asserted. What this pins:
//   · each domain invalidates the keys the recon's staleness map says it must
//   · PREFIX semantics actually hold — ["me","alerts"] really does reach ["me","alerts","events"],
//     and ["me","portfolio"] really does reach holdings/snapshot/nav (that is the whole reason the
//     map is short)
//   · unrelated caches are NOT dropped (an over-broad invalidation is a silent performance bug)
//   · an unknown domain from a newer backend degrades to "no refresh", never a throw
//
//   npx tsx lib/api/change-keys.verify.ts
// ─────────────────────────────────────────────────────────────────────────────
import { QueryClient } from "@tanstack/react-query";
import { CHANGE_KEYS, invalidateChanged, type ChangeDomain } from "./change-keys.js";

let failures = 0;
const ok = (n: string, c: boolean, d = "") => {
  console.log(`  ${c ? "✅" : "❌"} ${n}${d ? ` — ${d}` : ""}`);
  if (!c) failures++;
};
const section = (t: string) => console.log(`\n══ ${t} ══`);

/** Every cache the app actually keeps, mirroring the real hooks' keys. */
const ALL_KEYS: [string, unknown[]][] = [
  ["watchlist", ["me", "watchlist"]],
  ["alerts", ["me", "alerts"]],
  ["alert events", ["me", "alerts", "events", 50]],
  ["reminders", ["me", "reminders"]],
  ["transactions", ["me", "portfolio", "transactions"]],
  ["holdings", ["me", "portfolio", "holdings"]],
  ["phs snapshot", ["me", "portfolio", "snapshot"]],
  ["nav", ["me", "portfolio", "nav"]],
  ["relational", ["relational", "stock", "abc", "reader-1"]],
  ["stock health (unrelated)", ["stock", "health", "ACC"]],
  ["universe (unrelated)", ["universe", "stocks"]],
];

function freshClient(): QueryClient {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  for (const [, key] of ALL_KEYS) qc.setQueryData(key, { seeded: true });
  return qc;
}
/** Which of the seeded caches are now stale. */
function staleAfter(domains: string[]): string[] {
  const qc = freshClient();
  invalidateChanged(qc, domains);
  return ALL_KEYS.filter(([, key]) => qc.getQueryState(key)?.isInvalidated).map(([label]) => label);
}

function main() {
  section("1 · Each domain invalidates exactly what the staleness map says");
  {
    const w = staleAfter(["watchlist"]);
    ok("watchlist → watchlist + relational", w.join("|") === "watchlist|relational", w.join(", "));

    const a = staleAfter(["alerts"]);
    ok("★ alerts → the alerts list AND the fired-events feed (prefix match)", a.join("|") === "alerts|alert events", a.join(", "));
    ok("…which is what makes the NAVBAR BELL COUNT refresh", a.includes("alerts"));

    const r = staleAfter(["reminders"]);
    ok("reminders → reminders (the bell's other half)", r.join("|") === "reminders", r.join(", "));

    const p = staleAfter(["portfolio"]);
    ok("★ portfolio → the WHOLE portfolio tree + relational (prefix match)",
      p.join("|") === "transactions|holdings|phs snapshot|nav|relational", p.join(", "));
  }

  section("2 · Unrelated caches survive");
  {
    for (const d of Object.keys(CHANGE_KEYS) as ChangeDomain[]) {
      const s = staleAfter([d]);
      ok(`${d} leaves stock-health and universe alone`, !s.includes("stock health (unrelated)") && !s.includes("universe (unrelated)"), s.join(", "));
    }
  }

  section("3 · Multiple domains, and the degenerate cases");
  {
    const both = staleAfter(["alerts", "reminders"]);
    ok("★ both bell halves at once", both.join("|") === "alerts|alert events|reminders", both.join(", "));
    ok("empty list → nothing invalidated", staleAfter([]).length === 0);
    ok("undefined → nothing invalidated, no throw", (() => { const qc = freshClient(); invalidateChanged(qc, undefined); return ALL_KEYS.every(([, k]) => !qc.getQueryState(k)?.isInvalidated); })());
    ok("★ an UNKNOWN domain from a newer backend is ignored, not thrown on", staleAfter(["something_new"]).length === 0);
    ok("…and a known domain alongside it still works", staleAfter(["something_new", "alerts"]).includes("alerts"));
  }

  section("4 · The vocabulary matches the backend's ChangeDomain union");
  {
    const expected = ["watchlist", "alerts", "reminders", "portfolio"].sort().join(",");
    ok("four domains, exactly", Object.keys(CHANGE_KEYS).sort().join(",") === expected, Object.keys(CHANGE_KEYS).join(", "));
  }

  console.log(`\n${failures === 0 ? "═══ ALL CHANGE-KEY CHECKS PASSED ✅ ═══" : `═══ ${failures} FAILURE(S) ❌ ═══`}`);
  if (failures) process.exitCode = 1;
}

main();
