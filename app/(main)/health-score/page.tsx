import { HealthHub } from "@/components/health-hub";

// The Health Hub REPLACES the old mock /health-score table page. It is the flagship
// scoring surface: Briefing / Flags & Patterns / Screen over a scope switcher, all
// driven by real data (GET /api/universe/health). The old 9-pillar / 14-mock-stock
// table is retired; the "How this is scored" funnel still points at
// /health-score/methodology (kept).
export default function HealthScorePage() {
  return <HealthHub />;
}
