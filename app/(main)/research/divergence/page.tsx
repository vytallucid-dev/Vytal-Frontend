import { Suspense } from "react";
import { DivergenceTool } from "@/components/research/tools/divergence/divergence-tool";
import { ToolPageSkeleton } from "@/components/research/tools/tool-page-skeleton";

// Dual-entry off `?symbol=` (read via useSearchParams) → wrap in Suspense so the
// route renders cleanly without bailing the whole tree out of static rendering.
export default function DivergencePage() {
  return (
    <Suspense fallback={<ToolPageSkeleton />}>
      <DivergenceTool />
    </Suspense>
  );
}
