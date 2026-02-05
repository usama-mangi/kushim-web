"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboard";
import { ComplianceScore } from "@/components/dashboard/ComplianceScore";
import { IntegrationHealth } from "@/components/dashboard/IntegrationHealth";
import { ControlStatus } from "@/components/dashboard/ControlStatus";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { ComplianceTrends } from "@/components/dashboard/ComplianceTrends";
import { AIInsightsBanner } from "@/components/ai/AIInsightsBanner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default function Home() {
  const {
    fetchDashboardData,
    isLoading,
    isRefreshing,
    error,
    lastRefresh,
    refreshInterval,
    clearError,
  } = useDashboardStore();

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh setup
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchDashboardData, refreshInterval]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
            <p className="text-muted-foreground mt-1">
              Real-time compliance monitoring and automated evidence collection
            </p>
          </div>
          <div className="flex items-center gap-3">
             {lastRefresh && (
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Updated {formatRelativeTime(lastRefresh)}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-9 px-4 shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Sync Now
              </Button>
          </div>
        </div>
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* AI Insights Banner */}
        <AIInsightsBanner />

        <div className="space-y-8">
          {/* Compliance Score Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ComplianceScore />
            </div>
            <div className="lg:col-span-2">
              <ComplianceTrends />
            </div>
          </div>

          {/* Integration Health Section */}
          <IntegrationHealth />

          {/* Control Status and Alerts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ControlStatus />
            </div>
            <div className="lg:col-span-1">
              <RecentAlerts />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
