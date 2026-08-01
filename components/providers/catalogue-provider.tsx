"use client";

import { useEffect, type ReactNode } from "react";
import { useCatalogue } from "@/lib/api/hooks/use-catalogue";
import { reportFallback, setCatalogue } from "@/lib/findings/catalogue-store";

/**
 * ── THE ONE PLACE THE COPY CATALOGUE IS FETCHED ───────────────────────────────────────────────────
 *
 * Mounted once, at the root, inside QueryProvider. It renders `children` unchanged and NEVER blocks:
 * a page must not wait on its own vocabulary. While the fetch is in flight — and for as long as it
 * stays failed — every finding surface renders the BUNDLED copy it rendered before this stage, which
 * is the whole point of 5b.
 *
 * ⚠ IT RENDERS NOTHING AND GATES NOTHING. No spinner, no suspense boundary, no `isLoading &&
 * return null`. Any of those would turn a slow copy fetch into a blank stock page, which is a far
 * worse failure than a slightly older sentence.
 *
 * ⚠ WHY A PROVIDER AND NOT A HOOK IN EACH SURFACE. The four resolvers are synchronous module
 * functions called from ~13 places, several of them outside React entirely (`prepareCensus`,
 * `classifyMembers`, `eventPhrase`). They cannot call a hook. One fetch here, hydrating a module
 * store, keeps all four signatures and all ~13 call sites untouched.
 */
export function CatalogueProvider({ children }: { children: ReactNode }) {
  const { data, isError, error } = useCatalogue();

  useEffect(() => {
    if (!data?.data) return;
    setCatalogue(data.data); // reports its own fallback if the document is malformed
  }, [data]);

  useEffect(() => {
    if (!isError) return;
    // 5c — LOUD. The reader is fine (bundled copy renders); we are not, and this is the line that
    // says so. Without it an endpoint outage is invisible: every page looks correct, indefinitely.
    reportFallback(
      "fetch-failed",
      `GET /api/v1/catalogue failed — ${error instanceof Error ? error.message : String(error)}`,
    );
  }, [isError, error]);

  return <>{children}</>;
}
