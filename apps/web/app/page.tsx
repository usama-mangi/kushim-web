"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboard";
import { ComplianceScore } from "@/components/dashboard/ComplianceScore";
import { IntegrationHealth } from "@/components/dashboard/IntegrationHealth";
import { ControlStatus } from "@/components/dashboard/ControlStatus";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Kushim Compliance Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Real-time compliance monitoring and automation
              </p>
            </div>
            <div className="flex items-center gap-4">
              {lastRefresh && (
                <span className="text-sm text-muted-foreground mr-4">
                  Last updated {formatRelativeTime(lastRefresh)}
                </span>
              )}
              <Link href="/integrations">
                <Button variant="outline" size="sm" className="mr-2">
                  Integrations
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" size="sm" className="mr-2">
                  Reports
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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

        <div className="space-y-8">
          {/* Compliance Score Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ComplianceScore />
            </div>
            <div className="lg:col-span-2">
              {/* Placeholder for additional metrics */}
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Additional metrics coming soon
              </div>
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
