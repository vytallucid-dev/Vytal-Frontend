import { PortfolioHub } from "@/components/portfolio";

// The Portfolio surface. Shared chrome (header + tab row) with the Overview tab —
// read-only over the pre-computed PHS snapshot (GET /api/v1/me/portfolio) + the
// materialized holdings (GET /api/v1/me/holdings). No client-side score/weight recompute.
export default function PortfolioPage() {
  return <PortfolioHub />;
}
