"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Webhook, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string | null;
  createdAt: string;
}

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggered: string | null;
}

const mockWebhooks: WebhookConfig[] = [
  { id: "1", url: "https://api.company.com/webhooks/kushim", events: ["compliance.check.failed", "evidence.collected"], active: true, lastTriggered: "2024-01-15T09:00:00Z" },
];

export default function ApiSettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [webhooks] = useState<WebhookConfig[]>(mockWebhooks);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const response = await fetch("/api/users/api-keys");
      const data = await response.json();
      setApiKeys(data);
    } catch (error) {
      console.error("Failed to load API keys:", error);
    }
  };

  const handleGenerateApiKey = async () => {
    try {
      const name = prompt("Enter a name for this API key:");
      if (!name) return;

      const response = await fetch("/api/users/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const newKey = await response.json();
      setApiKeys([...apiKeys, newKey]);
      toast.success("API key generated successfully");
    } catch {
      toast.error("Failed to generate API key");
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      await fetch(`/api/users/api-keys/${keyId}`, { method: "DELETE" });
      setApiKeys(apiKeys.filter((k) => k.id !== keyId));
      toast.success("API key deleted");
    } catch {
      toast.error("Failed to delete API key");
    }
  };

  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-mono flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>Manage API keys for programmatic access</CardDescription>
          </div>
          <Button onClick={handleGenerateApiKey} className="rounded-none gap-2">
            <Plus className="h-4 w-4" />
            Generate New Key
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium font-mono">{apiKey.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Created {formatDate(apiKey.createdAt)}
                      {apiKey.lastUsed && (
                        <> • Last used {formatDate(apiKey.lastUsed)}</>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteApiKey(apiKey.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={apiKey.key}
                    type={showApiKey[apiKey.id] ? "text" : "password"}
                    readOnly
                    className="font-mono text-sm rounded-none"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setShowApiKey({ ...showApiKey, [apiKey.id]: !showApiKey[apiKey.id] })
                    }
                    className="rounded-none"
                  >
                    {showApiKey[apiKey.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyApiKey(apiKey.key)}
                    className="rounded-none"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {apiKeys.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed">
                No API keys yet. Generate one to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-mono flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhooks
            </CardTitle>
            <CardDescription>Configure webhooks for real-time event notifications</CardDescription>
          </div>
          <Button variant="outline" className="rounded-none gap-2">
            <Plus className="h-4 w-4" />
            Add Webhook
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-mono text-sm">{webhook.url}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Events: {webhook.events.join(", ")}
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`rounded-none ${webhook.active ? "border-[var(--pass)] text-[var(--pass)]" : ""}`}
                  >
                    {webhook.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {webhook.lastTriggered && (
                  <div className="text-xs text-muted-foreground">
                    Last triggered: {formatDate(webhook.lastTriggered)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none shadow-sm">
        <CardHeader>
          <CardTitle className="font-mono flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            API Usage
          </CardTitle>
          <CardDescription>Your API usage this billing period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold font-mono">12,456</div>
              <div className="text-sm text-muted-foreground">Total Requests</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono">98.5%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono">142ms</div>
              <div className="text-sm text-muted-foreground">Avg. Latency</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
