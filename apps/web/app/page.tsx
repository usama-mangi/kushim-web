"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { useDashboardStore } from "@/store/dashboard";
import { ComplianceScore } from "@/components/dashboard/ComplianceScore";
import { IntegrationHealth } from "@/components/dashboard/IntegrationHealth";
import { ControlStatus } from "@/components/dashboard/ControlStatus";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { ComplianceTrends } from "@/components/dashboard/ComplianceTrends";
import { AIInsightsBanner } from "@/components/ai/AIInsightsBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  AlertCircle, 
  Link as LinkIcon, 
  FileText, 
  Map, 
  BarChart3,
  ArrowRight,
  Shield
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

const quickActions = [
  {
    title: "Connect Integration",
    description: "Link AWS, GitHub, or Okta",
    icon: LinkIcon,
    href: "/integrations",
    color: "border-l-[var(--info)]"
  },
  {
    title: "Generate Policy",
    description: "Create AI-drafted policies",
    icon: FileText,
    href: "/policies",
    color: "border-l-[var(--pass)]"
  },
  {
    title: "Map Evidence",
    description: "Link evidence to controls",
    icon: Map,
    href: "/evidence",
    color: "border-l-[var(--warn)]"
  },
  {
    title: "View Reports",
    description: "Generate compliance reports",
    icon: BarChart3,
    href: "/reports",
    color: "border-l-foreground"
  },
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [selectedFramework, setSelectedFramework] = useState("SOC2");
  const {
    fetchDashboardData,
    isRefreshing,
    error,
    lastRefresh,
    refreshInterval,
    clearError,
  } = useDashboardStore();

  // Redirect to public landing if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/(public)");
    }
  }, [isAuthenticated, router]);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, isAuthenticated]);

  // Auto-refresh setup
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchDashboardData, refreshInterval, isAuthenticated]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Header with Framework Selector */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="flex items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight font-mono">System Overview</h1>
                <Badge variant="outline" className="rounded-none font-mono">
                  {selectedFramework === "SOC2" ? "SOC 2 Type II" : selectedFramework}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Real-time compliance monitoring and automated evidence collection
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedFramework} onValueChange={setSelectedFramework}>
              <SelectTrigger className="w-[180px] rounded-none">
                <Shield className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOC2">SOC 2 Type II</SelectItem>
                <SelectItem value="ISO27001">ISO 27001</SelectItem>
                <SelectItem value="HIPAA">HIPAA</SelectItem>
                <SelectItem value="PCIDSS">PCI DSS</SelectItem>
              </SelectContent>
            </Select>
            {lastRefresh && (
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider font-mono">
                Updated {formatRelativeTime(lastRefresh)}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-9 px-4 shrink-0 rounded-none"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Sync Now
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6 rounded-none">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError} className="rounded-none">
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className={`rounded-none border-l-4 ${action.color} hover:shadow-md transition-shadow cursor-pointer h-full`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <action.icon className="h-5 w-5 mb-2" />
                      <h3 className="font-semibold font-mono text-sm">{action.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

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
