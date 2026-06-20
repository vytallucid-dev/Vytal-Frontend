import { Suspense } from "react";
import { OwnershipTool } from "@/components/research/tools/ownership/ownership-tool";

// Dual-entry off `?symbol=` (read via useSearchParams) → wrap in Suspense so the
// route renders cleanly without bailing the whole tree out of static rendering.
export default function OwnershipPage() {
  return (
    <Suspense fallback={null}>
      <OwnershipTool />
    </Suspense>
  );
}
