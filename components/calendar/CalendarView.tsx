"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FilterState, MarketEvent } from "@/app/(main)/calendar/page";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Bookmark,
  Bell,
  Plus,
  TrendingUp,
  DollarSign,
  Users,
  Calendar as CalendarIcon,
  ExternalLink,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  filters: FilterState;
  onEventClick: (eventId: string) => void;
  onSetReminder?: (event: MarketEvent) => void;
}

// Mock data - same as EventTable
const mockEvents: MarketEvent[] = [
  {
    id: "1",
    date: new Date("2026-03-05"),
    time: "Post Market",
    company: {
      ticker: "HDFCBANK",
      name: "HDFC Bank",
      sector: "Banking",
      price: 1820,
    },
    eventType: "earnings",
    eventDetails: "Q4 Results",
    impactLevel: "high",
    inPortfolio: true,
    inWatchlist: false,
    details: {
      description: "Quarterly earnings announcement",
      timing: "4:30 PM - 5:00 PM",
      webcastLink: "https://example.com",
      estimates: {
        revenue: 25400,
        pat: 12800,
        eps: 24.5,
      },
      lastQuarter: {
        revenue: 24200,
        pat: 12100,
        stockReaction: 3.2,
      },
      userHolding: {
        shares: 50,
        value: 91000,
        portfolioPercent: 15,
        costBasis: 1640,
      },
    },
  },
  {
    id: "2",
    date: new Date("2026-03-05"),
    time: "Ex-Date",
    company: {
      ticker: "TCS",
      name: "TCS",
      sector: "IT Services",
      price: 3620,
    },
    eventType: "dividend",
    eventDetails: "Dividend Ex-Date",
    impactLevel: "medium",
    inPortfolio: true,
    inWatchlist: false,
  },
  {
    id: "3",
    date: new Date("2026-03-10"),
    time: "3:30 PM",
    company: {
      ticker: "RELIANCE",
      name: "Reliance Industries",
      sector: "Energy",
      price: 2450,
    },
    eventType: "earnings",
    eventDetails: "Q4 Results",
    impactLevel: "high",
    inPortfolio: false,
    inWatchlist: true,
  },
  {
    id: "4",
    date: new Date("2026-03-12"),
    time: "2:00 PM",
    company: {
      ticker: "INFY",
      name: "Infosys",
      sector: "IT Services",
      price: 1380,
    },
    eventType: "board_meeting",
    eventDetails: "Board Meeting - Dividend Discussion",
    impactLevel: "medium",
    inPortfolio: false,
    inWatchlist: true,
  },
  {
    id: "5",
    date: new Date("2026-03-15"),
    time: "10:00 AM",
    company: {
      ticker: "ITC",
      name: "ITC Limited",
      sector: "FMCG",
      price: 450,
    },
    eventType: "agm",
    eventDetails: "Annual General Meeting",
    impactLevel: "low",
    inPortfolio: true,
    inWatchlist: false,
  },
  {
    id: "6",
    date: new Date("2026-03-20"),
    time: "Market Open",
    company: {
      ticker: "SUNPHARMA",
      name: "Sun Pharma",
      sector: "Pharmaceuticals",
      price: 1180,
    },
    eventType: "bonus_split",
    eventDetails: "Stock Split 1:2",
    impactLevel: "medium",
    inPortfolio: false,
    inWatchlist: true,
  },
];

const getEventsForDate = (dateObj: Date): MarketEvent[] => {
  return mockEvents.filter((event) => {
    const eventDate = new Date(event.date);
    return (
      eventDate.getDate() === dateObj.getDate() &&
      eventDate.getMonth() === dateObj.getMonth() &&
      eventDate.getFullYear() === dateObj.getFullYear()
    );
  });
};

export function CalendarView({ filters, onEventClick, onSetReminder }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToThisMonth = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  // Generate calendar days
  const calendarDays: (number | null)[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add the days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <Card className="p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {monthNames[month]} {year}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToThisMonth}>
            This Month
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-semibold text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="p-2" />;
          }

          const dateObj = new Date(year, month, day);
          const events = getEventsForDate(dateObj);
          const hasEvents = events.length > 0;
          const portfolioEvents = events.filter((e) => e.inPortfolio);
          const watchlistEvents = events.filter((e) => e.inWatchlist && !e.inPortfolio);

          return (
            <Card
              key={day}
              className={cn(
                "p-2 min-h-[100px] transition-colors",
                isToday(day) && "border-primary border-2",
                hasEvents && "bg-muted/30 cursor-pointer hover:bg-muted/50"
              )}
              onClick={() => {
                if (hasEvents) {
                  setSelectedDate(dateObj);
                  setSheetOpen(true);
                  setExpandedEventId(null); // Reset expansion when opening new date
                }
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isToday(day)
                      ? "text-primary text-lg"
                      : "text-foreground"
                  )}
                >
                  {day}
                </span>
                {hasEvents && (
                  <div className="flex gap-0.5">
                    {portfolioEvents.length > 0 && (
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                    )}
                    {watchlistEvents.length > 0 && (
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                    {events.some((e) => !e.inPortfolio && !e.inWatchlist) && (
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Event Tickers */}
              {hasEvents && (
                <div className="space-y-1">
                  {events.slice(0, 3).map((event) => (
                    <Badge
                      key={event.id}
                      variant="secondary"
                      className={cn(
                        "text-xs px-1.5 py-0.5 block text-center truncate",
                        event.inPortfolio && "bg-amber-500/20 text-amber-700 dark:text-amber-400",
                        !event.inPortfolio && event.inWatchlist && "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                      )}
                    >
                      {event.company.ticker}
                    </Badge>
                  ))}
                  {events.length > 3 && (
                    <div className="text-xs text-center text-muted-foreground">
                      +{events.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 pt-6 border-t text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">Portfolio</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Watchlist</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-400" />
          <span className="text-muted-foreground">Others</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="h-3 w-3 rounded border-2 border-primary" />
          <span className="text-muted-foreground">Today</span>
        </div>
      </div>

      {/* Event Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => {
        setSheetOpen(open);
        if (!open) setExpandedEventId(null); // Reset expansion when closing
      }}>
        <SheetContent className="w-full sm:max-w-3xl px-4 pb-4 overflow-y-auto custom-scrollbar">
          {selectedDate && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </SheetTitle>
                <SheetDescription>
                  {getEventsForDate(selectedDate).length} event(s) scheduled
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-3">
                {getEventsForDate(selectedDate).map((event, index) => {
                  const isExpanded = expandedEventId === event.id;
                  
                  return (
                    <div key={event.id}>
                      <Card 
                        className="overflow-hidden cursor-pointer transition-all hover:shadow-md"
                        onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                      >
                        {/* Compact View */}
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-base">
                                  {event.company.ticker}
                                </h3>
                                <span className="text-sm text-muted-foreground">
                                  {event.company.name}
                                </span>
                                {event.inPortfolio && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs"
                                  >
                                    <Star className="h-3 w-3 mr-1 fill-current" />
                                    Portfolio
                                  </Badge>
                                )}
                                {event.inWatchlist && !event.inPortfolio && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs"
                                  >
                                    <Bookmark className="h-3 w-3 mr-1 fill-current" />
                                    Watchlist
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3 mt-2">
                                <Badge
                                  variant={
                                    event.impactLevel === "high"
                                      ? "destructive"
                                      : event.impactLevel === "medium"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="capitalize text-xs"
                                >
                                  {event.impactLevel}
                                </Badge>
                                <Badge variant="outline" className="capitalize text-xs">
                                  {event.eventType.replace("_", " ")}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {event.eventDetails}
                                </span>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                                  <Clock className="h-3.5 w-3.5" />
                                  {event.time}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded View */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-0 border-t" onClick={(e) => e.stopPropagation()}>
                            <div className="pt-4 space-y-4">
                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                {onSetReminder && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSetReminder(event);
                                    }}
                                  >
                                    <Bell className="h-4 w-4 mr-2" />
                                    Set Reminder
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add to {event.inPortfolio ? "Watchlist" : "Portfolio"}
                                </Button>
                              </div>

                              {/* Company Info */}
                              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Sector
                                  </p>
                                  <p className="text-sm font-medium">
                                    {event.company.sector}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Current Price
                                  </p>
                                  <p className="text-sm font-medium">
                                    ₹{event.company.price.toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              {/* Detailed Information */}
                              {event.details && (
                                <>
                                  {event.details.description && (
                                    <div>
                                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Event Details
                                      </h4>
                                      <p className="text-sm text-muted-foreground">
                                        {event.details.description}
                                      </p>
                                      {event.details.timing && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          <strong>Timing:</strong> {event.details.timing}
                                        </p>
                                      )}
                                      {event.details.webcastLink && (
                                        <Button
                                          variant="link"
                                          size="sm"
                                          className="p-0 h-auto mt-2"
                                          asChild
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <a
                                            href={event.details.webcastLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1"
                                          >
                                            Join Webcast
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        </Button>
                                      )}
                                    </div>
                                  )}

                                  {/* Estimates */}
                                  {event.details.estimates && (
                                    <div>
                                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Analyst Estimates
                                      </h4>
                                      <div className="grid grid-cols-3 gap-3">
                                        <div className="p-2 bg-muted/50 rounded">
                                          <p className="text-xs text-muted-foreground mb-1">
                                            Revenue
                                          </p>
                                          <p className="text-sm font-semibold">
                                            ₹{event.details.estimates.revenue}Cr
                                          </p>
                                        </div>
                                        <div className="p-2 bg-muted/50 rounded">
                                          <p className="text-xs text-muted-foreground mb-1">
                                            PAT
                                          </p>
                                          <p className="text-sm font-semibold">
                                            ₹{event.details.estimates.pat}Cr
                                          </p>
                                        </div>
                                        <div className="p-2 bg-muted/50 rounded">
                                          <p className="text-xs text-muted-foreground mb-1">
                                            EPS
                                          </p>
                                          <p className="text-sm font-semibold">
                                            ₹{event.details.estimates.eps}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Last Quarter */}
                                  {event.details.lastQuarter && (
                                    <div>
                                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Last Quarter Performance
                                      </h4>
                                      <div className="grid grid-cols-3 gap-3">
                                        <div className="p-2 bg-muted/50 rounded">
                                          <p className="text-xs text-muted-foreground mb-1">
                                            Revenue
                                          </p>
                                          <p className="text-sm font-semibold">
                                            ₹{event.details.lastQuarter.revenue}Cr
                                          </p>
                                        </div>
                                        <div className="p-2 bg-muted/50 rounded">
                                          <p className="text-xs text-muted-foreground mb-1">
                                            PAT
                                          </p>
                                          <p className="text-sm font-semibold">
                                            ₹{event.details.lastQuarter.pat}Cr
                                          </p>
                                        </div>
                                        <div className="p-2 bg-muted/50 rounded">
                                          <p className="text-xs text-muted-foreground mb-1">
                                            Stock Reaction
                                          </p>
                                          <p
                                            className={cn(
                                              "text-sm font-semibold",
                                              (event.details.lastQuarter.stockReaction ?? 0) > 0
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-red-600 dark:text-red-400"
                                            )}
                                          >
                                            {(event.details.lastQuarter.stockReaction ?? 0) > 0
                                              ? "+"
                                              : ""}
                                            {event.details.lastQuarter.stockReaction}%
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* User Holding */}
                                  {event.details.userHolding && (
                                    <div>
                                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                        Your Holdings
                                      </h4>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="p-2 bg-amber-500/10 rounded">
                                          <p className="text-xs text-muted-foreground mb-1">
                                            Shares
                                          </p>
                                          <p className="text-sm font-semibold">
                                            {event.details.userHolding.shares}
                                          </p>
                                        </div>
                                        <div className="p-2 bg-amber-500/10 rounded">
                                          <p className="text-xs text-muted-foreground mb-1">
                                            Value
                                          </p>
                                          <p className="text-sm font-semibold">
                                            ₹{(event.details.userHolding.value ?? 0).toLocaleString()}
                                          </p>
                                        </div>
                                        <div className="p-2 bg-amber-500/10 rounded">
                                          <p className="text-xs text-muted-foreground mb-1">
                                            Portfolio %
                                          </p>
                                          <p className="text-sm font-semibold">
                                            {event.details.userHolding.portfolioPercent}%
                                          </p>
                                        </div>
                                        <div className="p-2 bg-amber-500/10 rounded">
                                          <p className="text-xs text-muted-foreground mb-1">
                                            Avg. Cost
                                          </p>
                                          <p className="text-sm font-semibold">
                                            ₹{event.details.userHolding.costBasis}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
