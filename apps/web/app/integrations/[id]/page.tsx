"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Cloud, 
  Github, 
  ShieldCheck, 
  Briefcase, 
  Slack,
  RefreshCw,
  Trash2,
  Settings,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { useDashboardStore } from "@/store/dashboard";

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  configFields: ConfigField[];
  features: string[];
}

interface ConfigField {
  name: string;
  label: string;
  type: "text" | "password" | "toggle";
  placeholder?: string;
  description?: string;
}

interface ActivityLog {
  id: string;
  action: string;
  status: "success" | "error" | "warning";
  timestamp: string;
  details?: string;
}

const integrations: Record<string, IntegrationConfig> = {
  aws: {
    id: "aws",
    name: "Amazon Web Services",
    description: "Cloud infrastructure monitoring, IAM policy checks, and security configuration compliance",
    icon: Cloud,
    color: "text-orange-500",
    features: [
      "IAM policy analysis",
      "S3 bucket security checks",
      "CloudTrail log monitoring",
      "Security group auditing",
      "KMS key rotation checks"
    ],
    configFields: [
      { name: "accessKeyId", label: "Access Key ID", type: "text", placeholder: "AKIA..." },
      { name: "secretAccessKey", label: "Secret Access Key", type: "password", placeholder: "••••••••" },
      { name: "region", label: "Default Region", type: "text", placeholder: "us-east-1" },
      { name: "autoSync", label: "Auto-sync every hour", type: "toggle" },
    ]
  },
  github: {
    id: "github",
    name: "GitHub",
    description: "Source code security, branch protection rules, and repository compliance monitoring",
    icon: Github,
    color: "",
    features: [
      "Branch protection monitoring",
      "Code scanning integration",
      "Secret scanning alerts",
      "Dependency vulnerability checks",
      "Commit signature verification"
    ],
    configFields: [
      { name: "organization", label: "Organization", type: "text", placeholder: "your-org" },
      { name: "repositories", label: "Repositories (comma-separated)", type: "text", placeholder: "repo1, repo2" },
      { name: "webhookEnabled", label: "Enable webhook notifications", type: "toggle" },
      { name: "autoRemediate", label: "Auto-remediate issues", type: "toggle" },
    ]
  },
  okta: {
    id: "okta",
    name: "Okta",
    description: "Identity and access management policy monitoring and SSO compliance",
    icon: ShieldCheck,
    color: "text-blue-500",
    features: [
      "MFA enforcement checks",
      "Password policy compliance",
      "Session timeout monitoring",
      "User provisioning audits",
      "Application access reviews"
    ],
    configFields: [
      { name: "domain", label: "Okta Domain", type: "text", placeholder: "your-company.okta.com" },
      { name: "apiToken", label: "API Token", type: "password", placeholder: "••••••••" },
      { name: "syncUsers", label: "Sync user data", type: "toggle" },
      { name: "mfaCheck", label: "Monitor MFA compliance", type: "toggle" },
    ]
  },
  jira: {
    id: "jira",
    name: "Jira",
    description: "Automated remediation task creation and compliance ticket tracking",
    icon: Briefcase,
    color: "text-blue-600",
    features: [
      "Auto-create remediation tickets",
      "Link evidence to issues",
      "Track compliance tasks",
      "SLA monitoring",
      "Custom workflow integration"
    ],
    configFields: [
      { name: "cloudId", label: "Atlassian Cloud ID", type: "text", placeholder: "your-cloud-id" },
      { name: "projectKey", label: "Default Project Key", type: "text", placeholder: "COMP" },
      { name: "autoCreate", label: "Auto-create tickets for failures", type: "toggle" },
      { name: "priority", label: "Default priority", type: "text", placeholder: "High" },
    ]
  },
  slack: {
    id: "slack",
    name: "Slack",
    description: "Real-time compliance notifications and alert management",
    icon: Slack,
    color: "text-purple-500",
    features: [
      "Real-time alerts",
      "Daily compliance summaries",
      "Interactive notifications",
      "Channel-based routing",
      "Escalation workflows"
    ],
    configFields: [
      { name: "channel", label: "Default Channel", type: "text", placeholder: "#compliance-alerts" },
      { name: "dailySummary", label: "Send daily summary", type: "toggle" },
      { name: "criticalOnly", label: "Critical alerts only", type: "toggle" },
      { name: "mentionOnFail", label: "Mention team on failures", type: "toggle" },
    ]
  }
};

// Mock activity data
const mockActivityLogs: ActivityLog[] = [
  { id: "1", action: "Compliance check completed", status: "success", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: "2", action: "Evidence collected", status: "success", timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: "3", action: "Configuration sync", status: "success", timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: "4", action: "Authentication refresh", status: "warning", timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), details: "Token expires in 7 days" },
  { id: "5", action: "Policy check", status: "error", timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), details: "2 controls failing" },
];

export default function IntegrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const integrationId = params.id as string;
  const { integrationHealth, fetchDashboardData } = useDashboardStore();
  
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, string | boolean>>({});
  
  const integration = integrations[integrationId];
  const health = integrationHealth[integrationId as keyof typeof integrationHealth];
  
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  if (!integration) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-4 font-mono">Integration Not Found</h1>
          <p className="text-muted-foreground mb-6">The integration &ldquo;{integrationId}&rdquo; does not exist.</p>
          <Button onClick={() => router.push("/integrations")} className="rounded-none">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Integrations
          </Button>
        </div>
      </div>
    );
  }
  
  const handleTest = async () => {
    setIsTesting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Connection test successful");
    } catch {
      toast.error("Connection test failed");
    } finally {
      setIsTesting(false);
    }
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Configuration saved");
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect this integration? This will stop all monitoring.")) return;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(`${integration.name} disconnected`);
      router.push("/integrations");
    } catch {
      toast.error("Failed to disconnect");
    }
  };
  
  const handleSync = async () => {
    toast.info("Sync started...");
    await fetchDashboardData();
    toast.success("Sync completed");
  };
  
  const formatTime = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };
  
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-[var(--pass)]" />;
      case "error":
        return <XCircle className="h-4 w-4 text-[var(--fail)]" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-[var(--warn)]" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/integrations")}
            className="rounded-none"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <integration.icon className={`h-8 w-8 ${integration.color}`} />
              <div>
                <h1 className="text-3xl font-bold tracking-tight font-mono">{integration.name}</h1>
                <p className="text-muted-foreground">{integration.description}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {health ? (
              <Badge 
                variant="outline" 
                className={`rounded-none ${
                  health.healthScore >= 80 
                    ? "border-[var(--pass)] text-[var(--pass)]" 
                    : health.healthScore >= 50 
                    ? "border-[var(--warn)] text-[var(--warn)]"
                    : "border-[var(--fail)] text-[var(--fail)]"
                }`}
              >
                {health.healthScore}% Health
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-none">Not Connected</Badge>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content - 8 columns */}
          <div className="lg:col-span-8 space-y-6">
            {/* Status Card */}
            <Card className="border-l-4 border-l-[var(--pass)] rounded-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-mono text-lg">Connection Status</CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSync}
                    className="rounded-none"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleTest}
                    disabled={isTesting}
                    className="rounded-none"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {isTesting ? "Testing..." : "Test Connection"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-mono">Status</div>
                    <div className="flex items-center gap-2">
                      {health ? (
                        <>
                          <div className="h-2 w-2 rounded-full bg-[var(--pass)]" />
                          <span className="font-medium">Connected</span>
                        </>
                      ) : (
                        <>
                          <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                          <span className="font-medium text-muted-foreground">Disconnected</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-mono">Last Sync</div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {health?.timestamp ? formatTime(health.timestamp) : "Never"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-mono">Health Score</div>
                    <span className="text-2xl font-bold font-mono">
                      {health?.healthScore ?? "--"}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Configuration */}
            <Card className="rounded-none shadow-sm">
              <CardHeader className="flex flex-row items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle className="font-mono text-lg">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {integration.configFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    {field.type === "toggle" ? (
                      <div className="flex items-center justify-between">
                        <Label htmlFor={field.name}>{field.label}</Label>
                        <Switch
                          id={field.name}
                          checked={!!configValues[field.name]}
                          onCheckedChange={(checked) => 
                            setConfigValues({ ...configValues, [field.name]: checked })
                          }
                        />
                      </div>
                    ) : (
                      <>
                        <Label htmlFor={field.name}>{field.label}</Label>
                        <Input
                          id={field.name}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={(configValues[field.name] as string) || ""}
                          onChange={(e) => 
                            setConfigValues({ ...configValues, [field.name]: e.target.value })
                          }
                          className="rounded-none font-mono"
                        />
                      </>
                    )}
                  </div>
                ))}
                
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="rounded-none"
                  >
                    {isSaving ? "Saving..." : "Save Configuration"}
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDisconnect}
                    className="rounded-none"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Activity Log */}
            <Card className="rounded-none shadow-sm">
              <CardHeader className="flex flex-row items-center gap-2">
                <Activity className="h-5 w-5" />
                <CardTitle className="font-mono text-lg">Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono">Status</TableHead>
                      <TableHead className="font-mono">Action</TableHead>
                      <TableHead className="font-mono">Details</TableHead>
                      <TableHead className="font-mono text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockActivityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <StatusIcon status={log.status} />
                        </TableCell>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {log.details || "-"}
                        </TableCell>
                        <TableCell className="text-right text-sm font-mono">
                          {formatTime(log.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar - 4 columns */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Features */}
            <Card className="border-l-4 border-l-[var(--info)] rounded-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-mono text-lg">Capabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {integration.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-[var(--pass)]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            {/* Quick Stats */}
            <Card className="rounded-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-mono text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Controls Monitored</span>
                  <span className="font-bold font-mono">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Evidence Collected</span>
                  <span className="font-bold font-mono">156</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Checks Today</span>
                  <span className="font-bold font-mono">48</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Issues Found</span>
                  <span className="font-bold font-mono text-[var(--warn)]">3</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Documentation Link */}
            <div className="bg-muted/50 p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-mono">Need Help?</div>
              <p className="text-sm text-muted-foreground mb-4">
                Check our documentation for detailed setup instructions and troubleshooting.
              </p>
              <Button variant="outline" className="w-full rounded-none" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  View Documentation
                </a>
              </Button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
