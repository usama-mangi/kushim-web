"use client";

import { useDashboardStore } from "@/store/dashboard";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { AwsConnectionForm } from "@/components/integrations/AwsConnectionForm";
import { GithubConnectionForm } from "@/components/integrations/GithubConnectionForm";
import { OktaConnectionForm } from "@/components/integrations/OktaConnectionForm";
import { JiraConnectionForm } from "@/components/integrations/JiraConnectionForm";
import { SlackConnectionForm } from "@/components/integrations/SlackConnectionForm";
import { Activity, Github, Shield, Trello, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function IntegrationsPage() {
  const { integrationHealth } = useDashboardStore();

  const handleConnect = (type: string) => {
    console.log(`Open connect dialog for ${type}`);
  };

  const handleDisconnect = (type: string) => {
    // Implement disconnect logic
    console.log(`Disconnect ${type}`);
  };

  const handleConfigure = (type: string) => {
    console.log(`Open configure dialog for ${type}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Integrations</h1>
              <p className="text-muted-foreground mt-1">
                Manage your connections to external services
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* AWS */}
          <IntegrationCard
            id="aws"
            name="AWS"
            description="Collect IAM, S3, and CloudTrail evidence"
            icon={<Activity className="h-6 w-6 text-orange-500" />}
            isConnected={!!integrationHealth.aws}
            healthScore={integrationHealth.aws?.healthScore}
            onConnect={() => handleConnect("aws")}
            onDisconnect={() => handleDisconnect("aws")}
            onConfigure={() => handleConfigure("aws")}
            connectionForm={<AwsConnectionForm onSuccess={() => {}} />}
          />

          {/* GitHub */}
          <IntegrationCard
            id="github"
            name="GitHub"
            description="Monitor branch protection and commits"
            icon={<Github className="h-6 w-6" />}
            isConnected={!!integrationHealth.github}
            healthScore={integrationHealth.github?.healthScore}
            onConnect={() => handleConnect("github")}
            onDisconnect={() => handleDisconnect("github")}
            onConfigure={() => handleConfigure("github")}
            connectionForm={<GithubConnectionForm onSuccess={() => {}} />}
          />

          {/* Okta */}
          <IntegrationCard
            id="okta"
            name="Okta"
            description="Verify MFA compliance and user access"
            icon={<Shield className="h-6 w-6 text-blue-500" />}
            isConnected={!!integrationHealth.okta}
            healthScore={integrationHealth.okta?.healthScore}
            onConnect={() => handleConnect("okta")}
            onDisconnect={() => handleDisconnect("okta")}
            onConfigure={() => handleConfigure("okta")}
            connectionForm={<OktaConnectionForm onSuccess={() => {}} />}
          />

          {/* Jira */}
          <IntegrationCard
            id="jira"
            name="Jira"
            description="Auto-create tickets for failed controls"
            icon={<Trello className="h-6 w-6 text-blue-600" />}
            isConnected={!!integrationHealth.jira}
            healthScore={integrationHealth.jira?.healthScore}
            onConnect={() => handleConnect("jira")}
            onDisconnect={() => handleDisconnect("jira")}
            onConfigure={() => handleConfigure("jira")}
            connectionForm={<JiraConnectionForm onSuccess={() => {}} />}
          />

          {/* Slack */}
          <IntegrationCard
            id="slack"
            name="Slack"
            description="Receive real-time compliance alerts"
            icon={<MessageSquare className="h-6 w-6 text-purple-500" />}
            isConnected={!!integrationHealth.slack}
            healthScore={integrationHealth.slack?.healthScore}
            onConnect={() => handleConnect("slack")}
            onDisconnect={() => handleDisconnect("slack")}
            onConfigure={() => handleConfigure("slack")}
            connectionForm={<SlackConnectionForm onSuccess={() => {}} />}
          />
        </div>
      </main>
    </div>
  );
}
