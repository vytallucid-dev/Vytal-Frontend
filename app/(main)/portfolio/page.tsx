"use client";

import AnalyticsTab from "@/components/portfolio/AnalyticsTab";
import HealthTab from "@/components/portfolio/HealthTab";
import HistoryTab from "@/components/portfolio/HistoryTab";
import HoldingsTab from "@/components/portfolio/HoldingsTab";
import OverviewTab from "@/components/portfolio/OverviewTab";
import { PortfolioNavigationCommandPalette } from "@/components/portfolio/navigation-command-palette";
import { BarChart3, Briefcase, Clock, Eye, Heart } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PortfolioContent = () => {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  // Handle URL query parameters for tab and section navigation
  useEffect(() => {
    const tab = searchParams.get("tab");
    const section = searchParams.get("section");

    if (tab) {
      setActiveTab(tab);
    }

    if (section) {
      // Wait for tab content to render before scrolling
      setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [searchParams]);

  const tabs = [
    { id: "overview", label: "Overview", icon: Eye },
    { id: "health", label: "Health", icon: Heart },
    { id: "holdings", label: "Holdings", icon: Briefcase },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "history", label: "History", icon: Clock },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "health":
        return <HealthTab />;
      case "holdings":
        return <HoldingsTab />;
      case "analytics":
        return <AnalyticsTab />;
      case "history":
        return <HistoryTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="space-y-6 p-6 pt-2 ">
      {/* Modern Tab Navigation */}
      <div className=" w-full flex justify-between items-center ">
        <div className="flex items-center gap-8 border-b border-border/30">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  router.push(`?tab=${tab.id}`);
                }}
                className={`
                  relative pb-4 px-1 text-sm font-medium transition-all duration-300 ease-in-out
                  flex items-center gap-2 hover:text-foreground
                  ${
                    activeTab === tab.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-muted-foreground/80"
                  }
                `}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}

                {/* Animated bottom border */}
                <div
                  className={`
                    absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ease-in-out
                    ${activeTab === tab.id ? "w-full opacity-100" : "w-0 opacity-0"}
                  `}
                />
              </button>
            );
          })}
        </div>

        {/* Navigation Command Palette */}
        <PortfolioNavigationCommandPalette />
      </div>

      {/* Tab Content */}
      <div className="mt-6">{renderTabContent()}</div>
    </div>
  );
};

const PortfolioPage = () => {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <PortfolioContent />
    </Suspense>
  );
};

export default PortfolioPage;
