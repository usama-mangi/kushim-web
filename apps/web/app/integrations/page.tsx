"use client";

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/store/dashboard";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Cloud, 
  Github, 
  ShieldCheck, 
  Slack, 
  Briefcase,
  Layers
} from "lucide-react";
import { AwsConnectionForm } from "@/components/integrations/AwsConnectionForm";
import { GithubConnectionForm } from "@/components/integrations/GithubConnectionForm";
import { OktaConnectionForm } from "@/components/integrations/OktaConnectionForm";
import { JiraConnectionForm } from "@/components/integrations/JiraConnectionForm";
import { SlackConnectionForm } from "@/components/integrations/SlackConnectionForm";
import { disconnectIntegrationByType } from "@/lib/api/endpoints";

export default function IntegrationsPage() {
  const { integrationHealth, isLoading, fetchDashboardData } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const providers = [
    {
      id: "aws",
      name: "AWS",
      description: "Cloud infrastructure and IAM monitoring",
      icon: Cloud,
      health: integrationHealth.aws,
    },
    {
      id: "github",
      name: "GitHub",
      description: "Source code security and branch protection",
      icon: Github,
      health: integrationHealth.github,
    },
    {
        id: "okta",
        name: "Okta",
        description: "Identity and access management policy",
        icon: ShieldCheck,
        health: integrationHealth.okta,
    },
    {
      id: "jira",
      name: "Jira",
      description: "Automated remediation and task tracking",
      icon: Briefcase,
      health: integrationHealth.jira,
    },
    {
      id: "slack",
      name: "Slack",
      description: "Real-time compliance notifications",
      icon: Slack,
      health: integrationHealth.slack,
    },
  ];

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Manage connections to your external services and monitor their health.
        </p>
      </div>

      {isLoading && !integrationHealth.aws ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[250px] w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => {
            const ConnectionForm = {
              aws: AwsConnectionForm,
              github: GithubConnectionForm,
              okta: OktaConnectionForm,
              jira: JiraConnectionForm,
              slack: SlackConnectionForm,
            }[provider.id] || (() => null);

            return (
              <IntegrationCard
                key={provider.id}
                id={provider.id}
                name={provider.name}
                description={provider.description}
                icon={<provider.icon className="h-6 w-6 text-primary" />}
                isConnected={!!provider.health}
                healthScore={provider.health?.healthScore}
                lastSync={provider.health?.timestamp ? new Date(provider.health.timestamp) : undefined}
                onDisconnect={async () => {
                  try {
                    await disconnectIntegrationByType(provider.id.toUpperCase());
                    fetchDashboardData();
                  } catch (err) {
                    console.error(`Failed to disconnect ${provider.name}`, err);
                  }
                }}
                connectionForm={<ConnectionForm onSuccess={() => fetchDashboardData()} />}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
