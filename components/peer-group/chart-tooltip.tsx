"use client";

// The peer-group charts use the shared SVG/HTML chart tooltip — kept here as a re-export so
// existing imports (`@/components/peer-group/chart-tooltip`) keep working.
export {
  useChartTooltip,
  ChartTooltip,
  TipBody,
  type ChartTip,
} from "@/components/ui/chart-tooltip";
