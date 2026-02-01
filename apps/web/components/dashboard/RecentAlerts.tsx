"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, AlertCircle, Info, ExternalLink } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export function RecentAlerts() {
  const { alerts, isLoading, fetchDashboardData } = useDashboardStore();

  useEffect(() => {
    if (alerts.length === 0) {
      fetchDashboardData();
    }
  }, [alerts.length, fetchDashboardData]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-error" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-error border-error/50 bg-error/10";
      case "warning":
        return "text-warning border-warning/50 bg-warning/10";
      default:
        return "text-blue-500 border-blue-500/50 bg-blue-500/10";
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Recent Alerts
        </CardTitle>
        <CardDescription>
          Latest compliance issues and notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto pr-2 custom-scrollbar">
        {isLoading && alerts.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8">
            <Info className="h-8 w-8 mb-2 opacity-50" />
            <p>No recent alerts</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border flex gap-4 ${
                  alert.severity === "critical" ? "bg-red-50 dark:bg-red-900/10" : ""
                }`}
              >
                <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{alert.message}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatRelativeTime(alert.timestamp)}
                    </span>
                  </div>
                  {alert.controlName && (
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                      <span>Control:</span>
                      <Badge variant="outline" className="text-[10px] h-5 px-1">
                        {alert.controlName}
                      </Badge>
                    </div>
                  )}
                  {alert.jiraTicketUrl && (
                    <a
                      href={alert.jiraTicketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-xs flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      View Jira Ticket <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
