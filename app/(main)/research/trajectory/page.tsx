import { Suspense } from "react";
import { TrajectoryTool } from "@/components/research/tools/trajectory/trajectory-tool";
import { ToolPageSkeleton } from "@/components/research/tools/tool-page-skeleton";

// Dual-entry off `?symbol=` (read via useSearchParams) → wrap in Suspense so the
// route renders cleanly without bailing the whole tree out of static rendering.
export default function TrajectoryPage() {
  return (
    <Suspense fallback={<ToolPageSkeleton />}>
      <TrajectoryTool />
    </Suspense>
  );
}
