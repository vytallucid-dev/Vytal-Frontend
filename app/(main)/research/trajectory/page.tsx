import { Suspense } from "react";
import { TrajectoryTool } from "@/components/research/tools/trajectory/trajectory-tool";

// Dual-entry off `?symbol=` (read via useSearchParams) → wrap in Suspense so the
// route renders cleanly without bailing the whole tree out of static rendering.
export default function TrajectoryPage() {
  return (
    <Suspense fallback={null}>
      <TrajectoryTool />
    </Suspense>
  );
}
