import { WelcomeHero } from "@/components/dashboard/welcome-hero";
import { MarketPulse } from "@/components/dashboard/market-pulse";
import { HealthSpotlight } from "@/components/dashboard/health-spotlight";
import { TrendingCarousel } from "@/components/dashboard/trending-carousel";
import { AllocationCard, EventsCard, WatchlistCard } from "@/components/dashboard/more-cards";
import {
  HoldingsCard,
  NewsCard,
  AlertsCard,
  InsightsCard,
} from "@/components/dashboard/cards";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-5 sm:gap-6">
      <WelcomeHero />

      <MarketPulse />

      {/* Health spotlight + holdings */}
      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <HealthSpotlight />
        </div>
        <div className="lg:col-span-2">
          <HoldingsCard />
        </div>
      </div>

      {/* Trending carousel — full width */}
      <TrendingCarousel />

      {/* Allocation + Watchlist + Events */}
      <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AllocationCard />
        <WatchlistCard />
        <EventsCard />
      </div>

      {/* News + Alerts */}
      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NewsCard />
        </div>
        <div className="lg:col-span-1">
          <AlertsCard />
        </div>
      </div>

      {/* AI insights — full width */}
      <InsightsCard />
    </div>
  );
}
