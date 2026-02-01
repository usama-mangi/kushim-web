"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatPercentage } from "@/lib/utils";

export function ComplianceScore() {
  const { complianceScore, isLoading, fetchDashboardData } = useDashboardStore();

  useEffect(() => {
    if (!complianceScore) {
      fetchDashboardData();
    }
  }, [complianceScore, fetchDashboardData]);

  if (isLoading || !complianceScore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Score</CardTitle>
          <CardDescription>Overall compliance health</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-32 rounded-full mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    switch (complianceScore.trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-error" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "text-success";
    if (score >= 0.7) return "text-warning";
    return "text-error";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Compliance Score
        </CardTitle>
        <CardDescription>Overall compliance health</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Large Score Display */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <div className="flex items-center justify-center w-32 h-32 rounded-full border-8 border-muted">
              <span className={`text-4xl font-bold ${getScoreColor(complianceScore.overall)}`}>
                {formatPercentage(complianceScore.overall, 0)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            {getTrendIcon()}
            <span className="text-sm text-muted-foreground capitalize">
              {complianceScore.trend}
            </span>
          </div>
        </div>

        {/* Control Status Breakdown */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {complianceScore.passingControls}
            </div>
            <div className="text-xs text-muted-foreground">Passing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">
              {complianceScore.warningControls}
            </div>
            <div className="text-xs text-muted-foreground">Warning</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-error">
              {complianceScore.failingControls}
            </div>
            <div className="text-xs text-muted-foreground">Failing</div>
          </div>
        </div>

        {/* Total Controls */}
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">Total Controls</span>
          <Badge variant="secondary">{complianceScore.totalControls}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
