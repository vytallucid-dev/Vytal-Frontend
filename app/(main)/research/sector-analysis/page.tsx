import { redirect } from "next/navigation";

// The sector index was replaced by the peer-group index (the real-data prospecting
// ground). This route redirects so any lingering links don't 404. The mock per-sector
// detail at ./[sector] is now unreferenced and will be superseded by the per-pond
// Health page under /research/peer-groups/[id].
export default function SectorAnalysisIndexRedirect() {
  redirect("/research/peer-groups");
}
