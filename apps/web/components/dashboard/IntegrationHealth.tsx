"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle2, XCircle, AlertTriangle, Circle } from "lucide-react";
import { formatPercentage, getStatusBgColor } from "@/lib/utils";
import type { IntegrationHealth } from "@/lib/api/types";

interface IntegrationCardProps {
  name: string;
  integration: IntegrationHealth | null;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function IntegrationCard({ name, integration, icon, isLoading }: IntegrationCardProps) {
  if (isLoading && !integration) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            {icon}
            <h3 className="font-semibold">{name}</h3>
          </div>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!integration) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 opacity-50 grayscale">
              {icon}
              <h3 className="font-semibold">{name}</h3>
            </div>
            <Badge variant="secondary">Disconnected</Badge>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-bold opacity-30">--%</div>
              <div className="text-sm text-muted-foreground">Health Score</div>
            </div>
            <div className="text-xs text-muted-foreground pt-3 border-t">
              Configuration required
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getHealthStatus = (score: number) => {
    if (score >= 0.9) return { label: "Healthy", color: "success" };
    if (score >= 0.7) return { label: "Degraded", color: "warning" };
    return { label: "Unhealthy", color: "error" };
  };

  const getCircuitBreakerIcon = (state: string) => {
    switch (state) {
      case "CLOSED":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "OPEN":
        return <XCircle className="h-4 w-4 text-error" />;
      case "HALF_OPEN":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const status = getHealthStatus(integration.healthScore);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="font-semibold">{name}</h3>
          </div>
          <Badge className={getStatusBgColor(status.color as any)}>
            {status.label}
          </Badge>
        </div>

        <div className="space-y-3">
          {/* Health Score */}
          <div>
            <div className="text-3xl font-bold">
              {formatPercentage(integration.healthScore, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Health Score</div>
          </div>

          {/* Circuit Breaker Status */}
          {integration.circuitBreaker && (
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-sm text-muted-foreground">Circuit Breaker</span>
              <div className="flex items-center gap-2">
                {getCircuitBreakerIcon(integration.circuitBreaker.state)}
                <span className="text-sm font-medium">{integration.circuitBreaker.state}</span>
              </div>
            </div>
          )}

          {/* Failure Count */}
          {integration.circuitBreaker && integration.circuitBreaker.failureCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Failures</span>
              <Badge variant="destructive">{integration.circuitBreaker.failureCount}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function IntegrationHealth() {
  const { integrationHealth, isLoading, fetchDashboardData } = useDashboardStore();

  useEffect(() => {
    if (!integrationHealth.aws) {
      fetchDashboardData();
    }
  }, [integrationHealth, fetchDashboardData]);

  const integrations = [
    {
      name: "AWS",
      integration: integrationHealth.aws,
      icon: <Activity className="h-5 w-5 text-orange-500" />,
    },
    {
      name: "GitHub",
      integration: integrationHealth.github,
      icon: <Activity className="h-5 w-5 text-gray-700 dark:text-gray-300" />,
    },
    {
      name: "Okta",
      integration: integrationHealth.okta,
      icon: <Activity className="h-5 w-5 text-blue-500" />,
    },
    {
      name: "Jira",
      integration: integrationHealth.jira,
      icon: <Activity className="h-5 w-5 text-blue-600" />,
    },
    {
      name: "Slack",
      integration: integrationHealth.slack,
      icon: <Activity className="h-5 w-5 text-purple-500" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Integration Health</h2>
        <p className="text-muted-foreground">Monitor the health of all connected integrations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {integrations.map((int) => (
          <IntegrationCard
            key={int.name}
            name={int.name}
            integration={int.integration}
            icon={int.icon}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}
