import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Calendar, Clock, AlertCircle, Info, ArrowRight, CheckCircle, Users } from "lucide-react";

interface EventDetail {
  title: string;
  date: string;
  description: string;
  details?: string;
  estimate?: string;
  impact: "high" | "moderate" | "low";
  watchFor?: string;
}

interface EventCategory {
  category: string;
  priority: "high" | "medium" | "low";
  events: EventDetail[];
}

const CalendarComponent = () => {
  // Mock data for upcoming events
  const upcomingEvents: EventCategory[] = [
    {
      category: "Next 30 Days",
      priority: "high",
      events: [
        {
          title: "Quarterly Results",
          date: "October 25, 2024",
          description: "Q2 FY25 Results",
          details: "Revenue ₹33,500 Cr, Profit ₹8,200 Cr",
          estimate: "EPS ₹11.2",
          impact: "high",
          watchFor: "Margin trends, asset quality, guidance"
        },
        {
          title: "Dividend Ex-Date",
          date: "October 30, 2024",
          description: "₹8 per share (Interim)",
          details: "Yield: 0.44%",
          impact: "moderate",
          watchFor: "Buy before Oct 29 to be eligible"
        },
        {
          title: "Board Meeting",
          date: "November 5, 2024",
          description: "Consider fundraising plans",
          details: "QIP/Rights/Bonus discussion",
          impact: "moderate",
          watchFor: "Depends on announcement"
        }
      ]
    },
    {
      category: "Next 60-90 Days",
      priority: "medium",
      events: [
        {
          title: "Investor/Analyst Meet",
          date: "November 15, 2024",
          description: "Post-results analyst conference",
          details: "Management guidance, strategy update",
          impact: "moderate",
          watchFor: "Clarity on outlook"
        },
        {
          title: "RBI Policy Meeting",
          date: "December 6, 2024",
          description: "Banking sector impact",
          details: "Rates likely to hold",
          impact: "moderate",
          watchFor: "Sector-wide impact"
        },
        {
          title: "AGM",
          date: "December 18, 2024",
          description: "Annual General Meeting",
          details: "Final dividend approval",
          impact: "low",
          watchFor: "Routine"
        }
      ]
    },
    {
      category: "Longer Term (3-6 Months)",
      priority: "low",
      events: [
        {
          title: "Q3 Results",
          date: "January 22, 2025",
          description: "Third Quarter Results",
          impact: "high",
          watchFor: "Performance continuation"
        },
        {
          title: "Budget 2025",
          date: "February 2025",
          description: "Tax, banking sector announcements",
          impact: "moderate",
          watchFor: "Sector announcements"
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Stay ahead - track upcoming major events that could impact the stock
        </p>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          📅 Upcoming Events Calendar
        </h2>
      </div>

      {/* Events Timeline */}
      {upcomingEvents.map((category, catIndex) => (
        <div key={catIndex} className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold">{category.category}</h3>
            <Badge 
              variant={
                category.priority === "high" 
                  ? "destructive" 
                  : category.priority === "medium" 
                  ? "default" 
                  : "outline"
              }
              className="text-[10px] px-2 py-0.5 h-5"
            >
              {category.priority === "high" ? "High Priority" : category.priority === "medium" ? "Medium Priority" : "Low Priority"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {category.events.map((event, eventIndex) => (
              <Card 
                key={eventIndex} 
                className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                  event.impact === "high" 
                    ? "border-red-500/30 bg-red-500/[0.02] hover:border-red-500/50 hover:shadow-red-500/5" 
                    : event.impact === "moderate"
                    ? "border-yellow-500/30 bg-yellow-500/[0.02] hover:border-yellow-500/50 hover:shadow-yellow-500/5"
                    : "border-green-500/30 bg-green-500/[0.02] hover:border-green-500/50 hover:shadow-green-500/5"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon - Compact */}
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-lg ring-1 transition-all group-hover:scale-110 ${
                        event.impact === "high"
                          ? "bg-red-500/10 text-red-600 ring-red-500/20 group-hover:ring-red-500/40"
                          : event.impact === "moderate"
                          ? "bg-yellow-500/10 text-yellow-600 ring-yellow-500/20 group-hover:ring-yellow-500/40"
                          : "bg-green-500/10 text-green-600 ring-green-500/20 group-hover:ring-green-500/40"
                      }`}>
                        <Calendar className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm leading-tight mb-1">{event.title}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span className="font-medium">{event.date}</span>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            event.impact === "high" 
                              ? "destructive" 
                              : event.impact === "moderate"
                              ? "default"
                              : "success"
                          }
                          className="text-[10px] px-2 py-0.5 h-5 shrink-0"
                        >
                          {event.impact === "high" ? "🔴 High" : event.impact === "moderate" ? "🟡 Moderate" : "🟢 Low"}
                        </Badge>
                      </div>

                      {/* Description & Details */}
                      <div className="space-y-1">
                        <p className="text-sm font-semibold leading-snug">{event.description}</p>
                        {event.details && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{event.details}</p>
                        )}
                        {event.estimate && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Estimate:</span> {event.estimate}
                          </p>
                        )}
                      </div>

                      {/* What to Watch - Compact */}
                      {event.watchFor && (
                        <div className={`flex items-start gap-2 p-2 rounded-md text-xs border ${
                          event.impact === "high"
                            ? "bg-red-500/5 border-red-500/20"
                            : event.impact === "moderate"
                            ? "bg-yellow-500/5 border-yellow-500/20"
                            : "bg-green-500/5 border-green-500/20"
                        }`}>
                          <Info className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                          <p className="leading-relaxed">
                            <span className="font-semibold text-foreground">Watch: </span>
                            <span className="text-muted-foreground">{event.watchFor}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Corporate Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Corporate Actions (Announced/Expected)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stock Split */}
            <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                Stock Split
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">Under consideration</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ratio:</span>
                  <span className="font-medium">1:2 or 1:5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timeline:</span>
                  <span className="font-medium">Q4 (if approved)</span>
                </div>
                <Badge variant="outline" className="w-full justify-center mt-2 text-yellow-600">
                  🟡 Positive (Improves liquidity)
                </Badge>
              </div>
            </div>

            {/* Bonus Issue */}
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Bonus Issue
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">Not announced</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">History:</span>
                  <span className="font-medium">Last: 2019 (1:1)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Probability:</span>
                  <span className="font-medium">Low in near term</span>
                </div>
                <Badge variant="outline" className="w-full justify-center mt-2">
                  Monitoring
                </Badge>
              </div>
            </div>

            {/* Buyback */}
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Buyback
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">No active program</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Buyback:</span>
                  <span className="font-medium">2022 (₹800 Cr)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Need:</span>
                  <span className="font-medium">Low (stock doing well)</span>
                </div>
                <Badge variant="outline" className="w-full justify-center mt-2">
                  Not Expected
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Impact Summary */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-base">Event Impact Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Events to Watch Closely */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Events to Watch Closely:</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-red-600 flex-shrink-0" />
                <span><strong>Oct 25: Q2 Results</strong> - Most important near-term event</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                <span><strong>Oct 30: Dividend ex-date</strong> - Short-term price support</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                <span><strong>Nov 5: Board meeting</strong> - Potential fundraising clarity</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                <span><strong>Dec 6: RBI Policy</strong> - Sector-wide sentiment impact</span>
              </div>
            </div>
          </div>

          {/* Key Dates for Traders */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Key Dates for Traders:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Oct 23-24</p>
                <p className="text-sm font-medium">Build positions before results (if bullish)</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Oct 29</p>
                <p className="text-sm font-medium">Last day to buy for dividend</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Nov 6-8</p>
                <p className="text-sm font-medium">Watch for board meeting outcome</p>
              </div>
            </div>
          </div>

          {/* Key Dates for Investors */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              Key Dates for Investors:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span><strong>Oct 25: Results day</strong> - Assess if fundamentals improving</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span><strong>Nov 15: Analyst meet</strong> - Get clarity on FY guidance</span>
              </div>
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <span><strong>Long-term holders:</strong> Events are noise, focus on business</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarComponent;
