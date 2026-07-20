import { assetClassLabel } from "@/lib/asset-class";

// The asset-class tag — a CATEGORY label ("Mutual fund", "ETF", "Bond"…), never a score/health/band.
// Neutral by design. Shared by the entry sheet (per picker result) and the ledger (per row), so a fund
// reads as a fund everywhere. Degrades to the raw enum for any unknown future class (never a crash).
export function AssetClassChip({ assetClass }: { assetClass: string }) {
  return (
    <span className="shrink-0 rounded border border-line2 bg-surface-2 px-1.5 py-0.5 text-[9.5px] font-medium text-ink3">
      {assetClassLabel(assetClass)}
    </span>
  );
}
