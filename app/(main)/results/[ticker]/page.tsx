"use client";

import AISummaryTab from "@/components/results/AISummaryTab";
import FinancialsTab from "@/components/results/FinancialsTab";
import OverviewTab from "@/components/results/OverviewTab";
import VisualizationTab from "@/components/results/VisualizationTab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hdfcBankQ2FY25 } from "@/lib/quarterly-results-data";
import {
  Bell,
  Calendar,
  ChevronDown,
  Download,
  Plus,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

interface ResultsViewerPageProps {
  params: {
    ticker: string;
  };
}

export default function ResultsViewerPage({ params }: ResultsViewerPageProps) {
  // For now, we're using the hardcoded HDFC Bank data
  // In a real app, you would fetch the data based on params.ticker
  const [result] = useState(hdfcBankQ2FY25);
  const [activeTab, setActiveTab] = useState("overview");

  const handleExportPDF = () => {
    // Implement PDF export functionality
    console.log("Exporting PDF...");
  };

  const getHealthColor = (score: number) => {
    if (score >= 80)
      return "bg-green-500/10 text-green-500 border-green-500/20";
    if (score >= 60)
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    return "bg-red-500/10 text-red-500 border-red-500/20";
  };

  return (
    <div className="min-h-screen pb-12">
      {/* FIXED HEADER */}
      <div className="bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Left: Company Info */}
            <div className="flex flex-col gap-3">
              {/* Row 1: Company Name */}
              <div className="flex items-baseline gap-3">
                <h1 className="text-3xl font-bold">{result.companyName}</h1>
                <span className="text-lg text-muted-foreground">
                  {result.quarter} {result.fiscalYear}
                </span>
              </div>

              {/* Row 2: All badges/pills */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  {result.announcementDate}
                </Badge>
                <Badge variant="outline">{result.sector}</Badge>
                <Badge className={getHealthColor(result.healthScore)}>
                  Health: {result.healthScore}/100
                </Badge>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleExportPDF}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Quick Actions
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Portfolio
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="w-4 h-4 mr-2" />
                    Set Alert
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Compare with Peer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: "overview", label: "Overview" },
              { id: "visualization", label: "Visualization" },
              { id: "financials", label: "Financials" },
              { id: "ai-summary", label: "AI Summary" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "overview" && <OverviewTab result={result} />}
        {activeTab === "visualization" && <VisualizationTab result={result} />}
        {activeTab === "financials" && <FinancialsTab result={result} />}
        {activeTab === "ai-summary" && <AISummaryTab result={result} />}
      </div>
    </div>
  );
}
