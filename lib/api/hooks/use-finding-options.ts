"use client";

import { useMemo } from "react";
import { useCatalogueNames } from "@/lib/api/hooks/use-catalogue";
import { FINDING_OPTIONS, findingOptionsFrom, type FindingOption } from "@/lib/alerts";

/**
 * 1d · THE ALERT PICKER'S OPTION LIST, with a real loading state.
 *
 * `FINDING_OPTIONS` was a module-eval constant — computed before any fetch could have happened, so it
 * could never see served copy. This replaces it with the 1.9 KB `key → name` projection.
 *
 * ⚠ `options` IS NEVER EMPTY. While loading, and on failure, it is the bundled list — so the picker
 * always renders and a reader can always set an alert. `isLoading` exists so the UI can say the list
 * is settling, NOT so it can hide the list.
 */
export function useFindingOptions(): {
  options: FindingOption[];
  isLoading: boolean;
  isFallback: boolean;
} {
  const { data, isLoading, isError } = useCatalogueNames();

  const options = useMemo(() => {
    const names = data?.data?.names;
    if (!names || Object.keys(names).length === 0) return FINDING_OPTIONS;
    return findingOptionsFrom(names);
  }, [data]);

  return {
    options,
    isLoading,
    isFallback: isError || !data?.data?.names,
  };
}
