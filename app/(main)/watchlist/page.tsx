import { WatchlistHub } from "@/components/watchlist";

// The Watchlist surface — the research "what's changed since I got interested?" read.
// Read-only over GET /api/v1/me/watchlist (current health/band + fired findings + base
// three-lens verdicts + the immutable pin-time baseline); pin/unpin via POST/DELETE.
// Nothing here recomputes a score, band, finding or verdict — it renders the read-join,
// leading with the health since-you-added transition. Chrome matches the portfolio surface.
export default function WatchlistPage() {
  return <WatchlistHub />;
}
