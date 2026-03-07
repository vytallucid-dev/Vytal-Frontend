"use client";

import { QuarterlyResult } from "@/lib/quarterly-results-data";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight, 
  Target,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AISummaryTabProps {
  result: QuarterlyResult;
}

export default function AISummaryTab({ result }: AISummaryTabProps) {
  const { aiSummary } = result;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
        <Sparkles className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-purple-500 mb-1">AI-Powered Analysis</p>
          <p className="text-muted-foreground">
            Plain English summary of quarterly results. Auto-generated from financial data.
          </p>
        </div>
      </div>

      {/* Main AI Summary Card */}
      <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20">
        <CardContent className="p-8 space-y-8">
          {/* Performance Summary */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Performance Summary</h3>
            </div>
            <p className="text-base leading-relaxed text-foreground/90">
              {aiSummary.performanceSummary}
            </p>
          </div>

          {/* Key Positives */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="text-xl font-bold">Key Positives</h3>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                {aiSummary.keyPositives.length} highlights
              </Badge>
            </div>
            <ul className="space-y-3">
              {aiSummary.keyPositives.map((positive, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-base leading-relaxed text-foreground/90">
                    {positive}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas of Concern */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold">Areas of Concern</h3>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                {aiSummary.areasOfConcern.length} items
              </Badge>
            </div>
            <ul className="space-y-3">
              {aiSummary.areasOfConcern.map((concern, index) => (
                <li key={index} className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-base leading-relaxed text-foreground/90">
                    {concern}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quarter-on-Quarter Analysis */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ArrowRight className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold">Quarter-on-Quarter</h3>
            </div>
            <p className="text-base leading-relaxed text-foreground/90">
              {aiSummary.qoqAnalysis}
            </p>
          </div>

          {/* Bottom Line */}
          <div className="border-t border-border/50 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold">Bottom Line</h3>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <p className="text-base leading-relaxed font-medium text-foreground">
                {aiSummary.bottomLine}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
        <p className="text-xs text-muted-foreground">
          <strong>Disclaimer:</strong> This AI-generated summary is based on reported financial data and 
          historical patterns. It should not be considered as investment advice. Always review original 
          documents and consult with a financial advisor before making investment decisions.
        </p>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Overall Sentiment</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-bold text-lg">Positive</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Growth Momentum</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="font-bold text-lg">Strong</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Risk Level</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="font-bold text-lg">Moderate</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
