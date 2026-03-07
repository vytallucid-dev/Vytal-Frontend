"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FilterState, MarketEvent } from "@/app/(main)/calendar/page";
import {
  Star,
  Bookmark,
  Bell,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  ExternalLink,
  Clock,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EventTableProps {
  filters: FilterState;
  showPastEvents: boolean;
  expandedEventId: string | null;
  onExpandEvent: (id: string | null) => void;
  onSetReminder: (event: MarketEvent) => void;
}

// Mock data
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
    eventDetails: "Board Meeting",
    impactLevel: "low",
    inPortfolio: false,
    inWatchlist: true,
  },
  {
    id: "5",
    date: new Date("2026-03-15"),
    time: "Payment",
    company: {
      ticker: "ITC",
      name: "ITC",
      sector: "FMCG",
      price: 485,
    },
    eventType: "dividend",
    eventDetails: "Dividend Payment",
    impactLevel: "medium",
    inPortfolio: true,
    inWatchlist: false,
  },
  {
    id: "6",
    date: new Date("2026-03-20"),
    time: "Post Market",
    company: {
      ticker: "TECHM",
      name: "Tech Mahindra",
      sector: "IT Services",
      price: 1280,
    },
    eventType: "earnings",
    eventDetails: "Q4 Results",
    impactLevel: "medium",
    inPortfolio: false,
    inWatchlist: false,
  },
];

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case "earnings":
      return <TrendingUp className="h-4 w-4" />;
    case "dividend":
      return <DollarSign className="h-4 w-4" />;
    case "agm":
    case "board_meeting":
      return <Users className="h-4 w-4" />;
    case "bonus_split":
      return <Calendar className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
};

const getImpactBadge = (level: string) => {
  switch (level) {
    case "high":
      return (
        <Badge variant="destructive" className="gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          HIGH
        </Badge>
      );
    case "medium":
      return (
        <Badge
          variant="secondary"
          className="gap-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500"
        >
          <span className="h-2 w-2 rounded-full bg-yellow-500" />
          MED
        </Badge>
      );
    case "low":
      return (
        <Badge
          variant="secondary"
          className="gap-1 bg-green-500/10 text-green-600 dark:text-green-500"
        >
          <span className="h-2 w-2 rounded-full bg-green-500" />
          LOW
        </Badge>
      );
    default:
      return null;
  }
};

const formatDate = (date: Date) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${days[date.getDay()]}`;
};

const groupEventsByDate = (events: MarketEvent[]) => {
  const grouped: { [key: string]: MarketEvent[] } = {};
  events.forEach((event) => {
    const dateKey = event.date.toDateString();
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
  });
  return grouped;
};

export function EventTable({
  filters,
  showPastEvents,
  expandedEventId,
  onExpandEvent,
  onSetReminder,
}: EventTableProps) {
  const [selectedEvent, setSelectedEvent] = useState<MarketEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Filter events based on filters
  const filteredEvents = mockEvents.filter((event) => {
    if (!filters.showPortfolio && event.inPortfolio) return false;
    if (!filters.showWatchlist && event.inWatchlist) return false;
    if (!filters.showAllStocks && !event.inPortfolio && !event.inWatchlist)
      return false;
    return true;
  });

  const groupedEvents = groupEventsByDate(filteredEvents);
  const dateKeys = Object.keys(groupedEvents).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const getDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `TODAY - ${formatDate(date)}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow - ${formatDate(date)}`;
    } else {
      return formatDate(date);
    }
  };

  if (filteredEvents.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No events found</h3>
        <p className="text-muted-foreground">
          No events found for selected filters.
          <br />
          Try adjusting your date range or filters.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {dateKeys.map((dateKey) => {
        const events = groupedEvents[dateKey];
        const date = new Date(dateKey);

        return (
          <Card key={dateKey} className="overflow-hidden py-0 gap-0">
            <div
              className={cn(
                "px-4 py-3 border-primary font-semibold border-b",
                isToday(date) ? "bg-primary/10 text-primary" : "bg-muted/50",
              )}
            >
              {getDateHeader(dateKey)}
              <Badge variant="outline" className="ml-2 text-xs">
                {events.length} {events.length === 1 ? "event" : "events"}
              </Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent pointer-events-none">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[140px]">TIME</TableHead>
                  <TableHead>COMPANY</TableHead>
                  <TableHead className="w-[180px]">EVENT</TableHead>
                  <TableHead className="w-[120px]">SECTOR</TableHead>
                  <TableHead className="w-[100px]">IMPACT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow
                    key={event.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedEvent(event);
                      setSheetOpen(true);
                    }}
                  >
                    <TableCell>
                      {event.inPortfolio && (
                        <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                      )}
                      {!event.inPortfolio && event.inWatchlist && (
                        <Bookmark className="h-5 w-5 text-blue-500" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{event.time}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold">
                          {event.company.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.eventType)}
                        <span>{event.eventDetails}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.company.sector}</Badge>
                    </TableCell>
                    <TableCell>{getImpactBadge(event.impactLevel)}</TableCell>
                    <TableCell className="text-right w-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetReminder(event);
                        }}
                        className="mr-2"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        );
      })}

      {/* Event Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full px-4 pb-4 sm:max-w-3xl overflow-y-auto custom-scrollbar">
          {selectedEvent && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {selectedEvent.inPortfolio && (
                      <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                    )}
                    {!selectedEvent.inPortfolio &&
                      selectedEvent.inWatchlist && (
                        <Bookmark className="h-5 w-5 text-blue-500" />
                      )}
                    <span>{selectedEvent.company.ticker}</span>
                    <span className="text-muted-foreground font-normal">
                      {selectedEvent.company.name}
                    </span>
                  </div>
                </SheetTitle>
                <SheetDescription>
                  {selectedEvent.eventDetails} • {selectedEvent.time}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      onSetReminder(selectedEvent);
                      setSheetOpen(false);
                    }}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Set Reminder
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Add Notes
                  </Button>
                  <Button variant="outline" size="sm">
                    {selectedEvent.inPortfolio
                      ? "View in Portfolio"
                      : "Add to Portfolio"}
                  </Button>
                  <Button variant="outline" size="sm">
                    View Full Analysis
                  </Button>
                </div>

                {/* Event Overview */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Event Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Date & Time
                      </p>
                      <p className="text-sm font-medium">
                        {selectedEvent.date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.time}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Event Type
                      </p>
                      <Badge variant="outline" className="capitalize">
                        {selectedEvent.eventType.replace("_", " ")}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Impact Level
                      </p>
                      <Badge
                        variant={
                          selectedEvent.impactLevel === "high"
                            ? "destructive"
                            : selectedEvent.impactLevel === "medium"
                              ? "default"
                              : "secondary"
                        }
                        className="capitalize"
                      >
                        {selectedEvent.impactLevel}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Sector
                      </p>
                      <p className="text-sm font-medium">
                        {selectedEvent.company.sector}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Current Price
                      </p>
                      <p className="text-sm font-medium">
                        ₹{selectedEvent.company.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Event Details */}
                {selectedEvent.details && (
                  <>
                    {selectedEvent.details.description && (
                      <Card className="p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Event Details
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {selectedEvent.details.description}
                        </p>
                        {selectedEvent.details.timing && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <strong>Timing:</strong>{" "}
                            {selectedEvent.details.timing}
                          </p>
                        )}
                        {selectedEvent.details.webcastLink && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto mt-2"
                            asChild
                          >
                            <a
                              href={selectedEvent.details.webcastLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              Join Webcast
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </Card>
                    )}

                    {/* Analyst Estimates */}
                    {selectedEvent.details.estimates && (
                      <Card className="p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Analyst Estimates
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground mb-1">
                              Revenue
                            </p>
                            <p className="text-sm font-semibold">
                              ₹{selectedEvent.details.estimates.revenue}Cr
                            </p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground mb-1">
                              PAT
                            </p>
                            <p className="text-sm font-semibold">
                              ₹{selectedEvent.details.estimates.pat}Cr
                            </p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground mb-1">
                              EPS
                            </p>
                            <p className="text-sm font-semibold">
                              ₹{selectedEvent.details.estimates.eps}
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Last Quarter */}
                    {selectedEvent.details.lastQuarter && (
                      <Card className="p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Last Quarter Performance
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground mb-1">
                              Revenue
                            </p>
                            <p className="text-sm font-semibold">
                              ₹{selectedEvent.details.lastQuarter.revenue}Cr
                            </p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground mb-1">
                              PAT
                            </p>
                            <p className="text-sm font-semibold">
                              ₹{selectedEvent.details.lastQuarter.pat}Cr
                            </p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground mb-1">
                              Stock Reaction
                            </p>
                            <p
                              className={cn(
                                "text-sm font-semibold",
                                (selectedEvent.details.lastQuarter
                                  .stockReaction ?? 0) > 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400",
                              )}
                            >
                              {(selectedEvent.details.lastQuarter
                                .stockReaction ?? 0) > 0
                                ? "+"
                                : ""}
                              {selectedEvent.details.lastQuarter.stockReaction}%
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* User Holding */}
                    {selectedEvent.details.userHolding && (
                      <Card className="p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                          Your Holdings
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-amber-500/10 rounded">
                            <p className="text-xs text-muted-foreground mb-1">
                              Shares
                            </p>
                            <p className="text-sm font-semibold">
                              {selectedEvent.details.userHolding.shares}
                            </p>
                          </div>
                          <div className="p-3 bg-amber-500/10 rounded">
                            <p className="text-xs text-muted-foreground mb-1">
                              Value
                            </p>
                            <p className="text-sm font-semibold">
                              ₹
                              {(
                                selectedEvent.details.userHolding.value ?? 0
                              ).toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 bg-amber-500/10 rounded">
                            <p className="text-xs text-muted-foreground mb-1">
                              Portfolio %
                            </p>
                            <p className="text-sm font-semibold">
                              {
                                selectedEvent.details.userHolding
                                  .portfolioPercent
                              }
                              %
                            </p>
                          </div>
                          <div className="p-3 bg-amber-500/10 rounded">
                            <p className="text-xs text-muted-foreground mb-1">
                              Avg. Cost
                            </p>
                            <p className="text-sm font-semibold">
                              ₹{selectedEvent.details.userHolding.costBasis}
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
