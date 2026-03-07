"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { DateRange, FilterState } from "@/app/(main)/calendar/page";
import { Calendar, Table, Grid3x3, X, Save, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateRange as DateRangeType } from "react-day-picker";

// Simple date formatter
const formatDate = (date: Date, formatStr: string) => {
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
  const day = date.getDate();
  const month = months[date.getMonth()];

  if (formatStr === "MMM dd") {
    return `${month} ${day}`;
  }
  return date.toLocaleDateString();
};

interface FilterControlsProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  viewMode: "table" | "calendar";
  onViewModeChange: (mode: "table" | "calendar") => void;
  showPastEvents: boolean;
  onShowPastEventsChange: (show: boolean) => void;
}

export function FilterControls({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  showPastEvents,
  onShowPastEventsChange,
}: FilterControlsProps) {
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const [dateRangeValue, setDateRangeValue] = React.useState<
    DateRangeType | undefined
  >(undefined);
  const [selectedDateRange, setSelectedDateRange] = React.useState<string>(
    filters.dateRange,
  );

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Source options
  const sourceOptions: MultiSelectOption[] = [
    { label: "My Portfolio (5)", value: "portfolio" },
    { label: "My Watchlist (12)", value: "watchlist" },
    { label: "All Stocks", value: "all" },
  ];

  const getSelectedSources = () => {
    const selected: string[] = [];
    if (filters.showPortfolio) selected.push("portfolio");
    if (filters.showWatchlist) selected.push("watchlist");
    if (filters.showAllStocks) selected.push("all");
    return selected;
  };

  const handleSourceChange = (values: string[]) => {
    onFiltersChange({
      ...filters,
      showPortfolio: values.includes("portfolio"),
      showWatchlist: values.includes("watchlist"),
      showAllStocks: values.includes("all"),
    });
  };

  // Event type options
  const eventTypeOptions: MultiSelectOption[] = [
    { label: "Earnings Results", value: "earnings" },
    { label: "Dividends", value: "dividends" },
    { label: "AGM/Board Meetings", value: "agm" },
    { label: "Bonus/Splits", value: "bonusSplit" },
    { label: "Record Dates", value: "recordDate" },
    { label: "Ex-Dates", value: "exDate" },
  ];

  // Sector options
  const sectorOptions: MultiSelectOption[] = [
    { label: "Banking", value: "banking" },
    { label: "IT Services", value: "it" },
    { label: "Automobile", value: "auto" },
    { label: "Pharma", value: "pharma" },
    { label: "FMCG", value: "fmcg" },
    { label: "Energy", value: "energy" },
    { label: "Metals", value: "metals" },
  ];

  // Market Cap options
  const marketCapOptions: MultiSelectOption[] = [
    { label: "Large Cap", value: "large" },
    { label: "Mid Cap", value: "mid" },
    { label: "Small Cap", value: "small" },
  ];

  // Impact Level options
  const impactOptions: MultiSelectOption[] = [
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
  ];

  const getSelectedEventTypes = () => {
    const selected: string[] = [];
    if (filters.eventTypes.earnings) selected.push("earnings");
    if (filters.eventTypes.dividends) selected.push("dividends");
    if (filters.eventTypes.agm) selected.push("agm");
    if (filters.eventTypes.bonusSplit) selected.push("bonusSplit");
    if (filters.eventTypes.recordDate) selected.push("recordDate");
    if (filters.eventTypes.exDate) selected.push("exDate");
    return selected;
  };

  const handleEventTypeChange = (values: string[]) => {
    onFiltersChange({
      ...filters,
      eventTypes: {
        earnings: values.includes("earnings"),
        dividends: values.includes("dividends"),
        agm: values.includes("agm"),
        bonusSplit: values.includes("bonusSplit"),
        recordDate: values.includes("recordDate"),
        exDate: values.includes("exDate"),
      },
    });
  };

  // Get selected sectors (convert from string to array)
  const getSelectedSectors = () => {
    return filters.sector === "all"
      ? []
      : filters.sector.split(",").filter(Boolean);
  };

  const handleSectorChange = (values: string[]) => {
    updateFilter("sector", values.length === 0 ? "all" : values.join(","));
  };

  // Get selected market caps
  const getSelectedMarketCaps = () => {
    return filters.marketCap === "all"
      ? []
      : filters.marketCap.split(",").filter(Boolean);
  };

  const handleMarketCapChange = (values: string[]) => {
    updateFilter("marketCap", values.length === 0 ? "all" : values.join(","));
  };

  // Get selected impact levels
  const getSelectedImpacts = () => {
    return filters.impactLevel === "all"
      ? []
      : filters.impactLevel.split(",").filter(Boolean);
  };

  const handleImpactChange = (values: string[]) => {
    updateFilter("impactLevel", values.length === 0 ? "all" : values.join(","));
  };
  
  const getActiveFilterCount = () => {
    let count = 0;
    const selectedSectors = getSelectedSectors();
    const selectedMarketCaps = getSelectedMarketCaps();
    const selectedImpacts = getSelectedImpacts();

    if (selectedSectors.length > 0) count++;
    if (selectedMarketCaps.length > 0) count++;
    if (selectedImpacts.length > 0) count++;
    if (filters.dateRange !== "week") count++;

    const defaultEventTypes = ["earnings", "dividends", "agm", "bonusSplit"];
    const currentEventTypes = getSelectedEventTypes();
    if (
      JSON.stringify(currentEventTypes.sort()) !==
      JSON.stringify(defaultEventTypes.sort())
    )
      count++;

    const defaultSources = ["portfolio", "watchlist"];
    const currentSources = getSelectedSources();
    if (
      JSON.stringify(currentSources.sort()) !==
      JSON.stringify(defaultSources.sort())
    )
      count++;

    return count;
  };

  const handleDateRangeChange = (range: string) => {
    setSelectedDateRange(range);
    if (range === "custom") {
      setDatePickerOpen(true);
    } else {
      updateFilter("dateRange", range as DateRange);
      updateFilter("customDateFrom", undefined);
      updateFilter("customDateTo", undefined);
      setDateRangeValue(undefined);
    }
  };

  const applyCustomDateRange = () => {
    if (dateRangeValue?.from && dateRangeValue?.to) {
      updateFilter("customDateFrom", dateRangeValue.from);
      updateFilter("customDateTo", dateRangeValue.to);
      updateFilter("dateRange", "custom");
      setDatePickerOpen(false);
    }
  };

  const getDateRangeLabel = () => {
    if (
      filters.dateRange === "custom" &&
      dateRangeValue?.from &&
      dateRangeValue?.to
    ) {
      return `${formatDate(dateRangeValue.from, "MMM dd")} - ${formatDate(dateRangeValue.to, "MMM dd")}`;
    }
    const options: { [key: string]: string } = {
      today: "Today",
      week: "This Week",
      month: "This Month",
      "30days": "Next 30 Days",
      custom: "Custom Range",
    };
    return options[selectedDateRange] || "Select Range";
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card className="p-4">
      {/* Compact Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Range Dropdown with Calendar */}
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <div>
              <Select
                value={selectedDateRange}
                onValueChange={handleDateRangeChange}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select range">
                    {getDateRangeLabel()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="30days">Next 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverTrigger>
          {selectedDateRange === "custom" && (
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-3">
                    Select Date Range
                  </h4>
                  <CalendarComponent
                    mode="range"
                    selected={dateRangeValue}
                    onSelect={setDateRangeValue}
                    numberOfMonths={2}
                    className="rounded-md border"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setDateRangeValue(undefined);
                      setSelectedDateRange("week");
                      updateFilter("dateRange", "week");
                      setDatePickerOpen(false);
                    }}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={applyCustomDateRange}
                    disabled={!dateRangeValue?.from || !dateRangeValue?.to}
                    className="flex-1"
                    size="sm"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          )}
        </Popover>

        <div className="h-6 w-px bg-border" />

        {/* Source Multi-Select */}
        <div className="min-w-[180px]">
          <MultiSelect
            options={sourceOptions}
            selected={getSelectedSources()}
            onChange={handleSourceChange}
            placeholder="Select sources..."
            className="h-9"
          />
        </div>

        {/* Event Types Multi-Select */}
        <div className="min-w-[180px]">
          <MultiSelect
            options={eventTypeOptions}
            selected={getSelectedEventTypes()}
            onChange={handleEventTypeChange}
            placeholder="Event types..."
            className="h-9"
          />
        </div>

        {/* Sector Multi-Select */}
        <div className="min-w-[150px]">
          <MultiSelect
            options={sectorOptions}
            selected={getSelectedSectors()}
            onChange={handleSectorChange}
            placeholder="All Sectors"
            className="h-9"
          />
        </div>

        {/* Market Cap Multi-Select */}
        <div className="min-w-[140px]">
          <MultiSelect
            options={marketCapOptions}
            selected={getSelectedMarketCaps()}
            onChange={handleMarketCapChange}
            placeholder="All Cap"
            className="h-9"
          />
        </div>

        {/* Impact Level Multi-Select */}
        <div className="min-w-[140px]">
          <MultiSelect
            options={impactOptions}
            selected={getSelectedImpacts()}
            onChange={handleImpactChange}
            placeholder="All Impact"
            className="h-9"
          />
        </div>

        <div className="h-6 w-px bg-border" />

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("table")}
            className="h-7 px-2"
          >
            <Table className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "calendar" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("calendar")}
            className="h-7 px-2"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
