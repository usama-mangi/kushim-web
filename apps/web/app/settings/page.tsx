"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, User, Key, Bell, Shield, Save, Copy, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  // Profile settings
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");

  // Email preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [alertEmails, setAlertEmails] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [complianceUpdates, setComplianceUpdates] = useState(false);

  // Framework preferences
  const [primaryFramework, setPrimaryFramework] = useState("SOC2");
  const [enabledFrameworks, setEnabledFrameworks] = useState<string[]>(["SOC2"]);

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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email }),
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/users/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications,
          alertEmails,
          weeklyReport,
          complianceUpdates,
          primaryFramework,
          enabledFrameworks,
        }),
      });
      toast.success("Preferences saved successfully");
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
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
    } catch (error) {
      toast.error("Failed to generate API key");
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      await fetch(`/api/users/api-keys/${keyId}`, { method: "DELETE" });
      setApiKeys(apiKeys.filter((k) => k.id !== keyId));
      toast.success("API key deleted");
    } catch (error) {
      toast.error("Failed to delete API key");
    }
  };

  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard");
  };

  const toggleFramework = (framework: string) => {
    if (enabledFrameworks.includes(framework)) {
      setEnabledFrameworks(enabledFrameworks.filter((f) => f !== framework));
    } else {
      setEnabledFrameworks([...enabledFrameworks, framework]);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="frameworks" className="gap-2">
              <Shield className="h-4 w-4" />
              Frameworks
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="flex items-center gap-2">
                    <Badge>{user?.role}</Badge>
                  </div>
                </div>
                <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>API Keys</CardTitle>
                <Button onClick={handleGenerateApiKey} size="sm" className="gap-2">
                  <Key className="h-4 w-4" />
                  Generate New Key
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">{apiKey.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Created {new Date(apiKey.createdAt).toLocaleDateString()}
                            {apiKey.lastUsed && (
                              <> • Last used {new Date(apiKey.lastUsed).toLocaleDateString()}</>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteApiKey(apiKey.id)}
                        >
                          Delete
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={apiKey.key}
                          type={showApiKey[apiKey.id] ? "text" : "password"}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setShowApiKey({ ...showApiKey, [apiKey.id]: !showApiKey[apiKey.id] })
                          }
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
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {apiKeys.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No API keys yet. Generate one to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Enable Email Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive email notifications for important events
                    </div>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Compliance Alerts</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified when compliance checks fail
                    </div>
                  </div>
                  <Switch checked={alertEmails} onCheckedChange={setAlertEmails} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Weekly Report</div>
                    <div className="text-sm text-muted-foreground">
                      Receive a weekly summary of compliance status
                    </div>
                  </div>
                  <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Framework Updates</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified about changes to compliance frameworks
                    </div>
                  </div>
                  <Switch
                    checked={complianceUpdates}
                    onCheckedChange={setComplianceUpdates}
                  />
                </div>
                <Button onClick={handleSavePreferences} disabled={isSaving} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Frameworks Tab */}
          <TabsContent value="frameworks">
            <Card>
              <CardHeader>
                <CardTitle>Framework Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Primary Framework</Label>
                  <Select value={primaryFramework} onValueChange={setPrimaryFramework}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOC2">SOC 2</SelectItem>
                      <SelectItem value="ISO27001">ISO 27001</SelectItem>
                      <SelectItem value="HIPAA">HIPAA</SelectItem>
                      <SelectItem value="PCIDSS">PCI DSS</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    This framework will be used as the default for compliance monitoring
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Enabled Frameworks</Label>
                  <div className="space-y-2">
                    {[
                      { id: "SOC2", name: "SOC 2", desc: "Trust Services Criteria" },
                      { id: "ISO27001", name: "ISO 27001", desc: "Information Security Management" },
                      { id: "HIPAA", name: "HIPAA", desc: "Healthcare Data Protection" },
                      { id: "PCIDSS", name: "PCI DSS", desc: "Payment Card Industry" },
                    ].map((framework) => (
                      <div
                        key={framework.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{framework.name}</div>
                          <div className="text-sm text-muted-foreground">{framework.desc}</div>
                        </div>
                        <Switch
                          checked={enabledFrameworks.includes(framework.id)}
                          onCheckedChange={() => toggleFramework(framework.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSavePreferences} disabled={isSaving} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
