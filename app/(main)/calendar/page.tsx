"use client";

import { useState } from "react";
import { SummaryCards } from "@/components/calendar/SummaryCards";
import { FilterControls } from "@/components/calendar/FilterControls";
import { EventTable } from "@/components/calendar/EventTable";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ReminderModal } from "@/components/calendar/ReminderModal";

export type EventType =
  | "earnings"
  | "dividend"
  | "agm"
  | "board_meeting"
  | "bonus_split"
  | "record_date"
  | "ex_date";

export type ImpactLevel = "high" | "medium" | "low";

export type MarketEvent = {
  id: string;
  date: Date;
  time: string;
  company: {
    ticker: string;
    name: string;
    sector: string;
    price: number;
  };
  eventType: EventType;
  eventDetails: string;
  impactLevel: ImpactLevel;
  inPortfolio: boolean;
  inWatchlist: boolean;
  details?: {
    description?: string;
    timing?: string;
    webcastLink?: string;
    estimates?: {
      revenue?: number;
      pat?: number;
      eps?: number;
    };
    lastQuarter?: {
      revenue?: number;
      pat?: number;
      stockReaction?: number;
    };
    userHolding?: {
      shares?: number;
      value?: number;
      portfolioPercent?: number;
      costBasis?: number;
    };
  };
};

export type DateRange = "today" | "week" | "month" | "30days" | "custom";

export type FilterState = {
  dateRange: DateRange;
  customDateFrom?: Date;
  customDateTo?: Date;
  showPortfolio: boolean;
  showWatchlist: boolean;
  showAllStocks: boolean;
  eventTypes: {
    earnings: boolean;
    dividends: boolean;
    agm: boolean;
    bonusSplit: boolean;
    recordDate: boolean;
    exDate: boolean;
  };
  sector: string;
  marketCap: string;
  impactLevel: string;
};

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [reminderModalEvent, setReminderModalEvent] =
    useState<MarketEvent | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    dateRange: "week",
    showPortfolio: true,
    showWatchlist: true,
    showAllStocks: false,
    eventTypes: {
      earnings: true,
      dividends: true,
      agm: true,
      bonusSplit: true,
      recordDate: false,
      exDate: false,
    },
    sector: "all",
    marketCap: "all",
    impactLevel: "all",
  });

  // Get filtered events count
  const getEventCounts = () => {
    // This would filter the actual events data
    return {
      thisWeek: 18,
      inPortfolio: 5,
      inWatchlist: 12,
      highImpact: 6,
      dividendsDue: 4200,
      dividendStocks: 3,
    };
  };

  const counts = getEventCounts();

  return (
    <div className="flex gap-6 p-6">
      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        <SummaryCards
          thisWeekCount={counts.thisWeek}
          highImpactCount={counts.highImpact}
          portfolioCount={counts.inPortfolio}
          watchlistCount={counts.inWatchlist}
        />

        <FilterControls
          filters={filters}
          onFiltersChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showPastEvents={showPastEvents}
          onShowPastEventsChange={setShowPastEvents}
        />

        {viewMode === "table" ? (
          <EventTable
            filters={filters}
            showPastEvents={showPastEvents}
            expandedEventId={expandedEventId}
            onExpandEvent={setExpandedEventId}
            onSetReminder={setReminderModalEvent}
          />
        ) : (
          <CalendarView
            filters={filters}
            onEventClick={(eventId: string) => {
              setViewMode("table");
              setExpandedEventId(eventId);
            }}
            onSetReminder={setReminderModalEvent}
          />
        )}
      </div>

      {/* Reminder Modal */}
      {reminderModalEvent && (
        <ReminderModal
          event={reminderModalEvent}
          onClose={() => setReminderModalEvent(null)}
        />
      )}
    </div>
  );
}
