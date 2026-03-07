import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  AlertCircle,
  Star,
  IndianRupee,
  WatchIcon,
  Binoculars,
  File,
  NotebookTabs,
} from "lucide-react";

interface SummaryCardsProps {
  thisWeekCount: number;
  highImpactCount: number;
  portfolioCount: number;
  watchlistCount: number;
}

export function SummaryCards({
  thisWeekCount,
  highImpactCount,
  portfolioCount,
  watchlistCount,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">This Week</p>
            <p className="text-2xl font-bold">
              {thisWeekCount}{" "}
              <span className="text-xs text-muted-foreground">events</span>
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">High Impact</p>
            <p className="text-2xl font-bold">
              {highImpactCount}{" "}
              <span className="text-xs text-muted-foreground">events</span>
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Star className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your Portfolio</p>
            <p className="text-2xl font-bold">
              {portfolioCount}{" "}
              <span className="text-xs text-muted-foreground">events</span>
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <NotebookTabs className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your Watchlist</p>
            <p className="text-2xl font-bold">
              {watchlistCount}{" "}
              <span className="text-xs text-muted-foreground">events</span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
