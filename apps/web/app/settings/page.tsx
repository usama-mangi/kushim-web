"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Settings as SettingsIcon, 
  User, 
  Key, 
  Bell, 
  Shield, 
  Save, 
  Copy, 
  Eye, 
  EyeOff,
  Building2,
  Users,
  Plus,
  Trash2,
  Mail,
  Webhook,
  BarChart3,
  Lock,
  Slack
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string | null;
  createdAt: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  status: "active" | "pending";
  lastActive: string | null;
}

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggered: string | null;
}

// Mock data
const mockTeamMembers: TeamMember[] = [
  { id: "1", name: "Jane Smith", email: "jane@company.com", role: "admin", status: "active", lastActive: "2024-01-15T10:30:00Z" },
  { id: "2", name: "John Doe", email: "john@company.com", role: "editor", status: "active", lastActive: "2024-01-14T15:45:00Z" },
  { id: "3", name: "Alice Johnson", email: "alice@company.com", role: "viewer", status: "pending", lastActive: null },
];

const mockWebhooks: WebhookConfig[] = [
  { id: "1", url: "https://api.company.com/webhooks/kushim", events: ["compliance.check.failed", "evidence.collected"], active: true, lastTriggered: "2024-01-15T09:00:00Z" },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [webhooks] = useState<WebhookConfig[]>(mockWebhooks);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("viewer");

  // Profile settings
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Company settings
  const [companyName, setCompanyName] = useState("Acme Corp");
  const [companyDomain, setCompanyDomain] = useState("acme.com");
  const [targetAuditDate, setTargetAuditDate] = useState("2024-06-01");

  // Email preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [alertEmails, setAlertEmails] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [complianceUpdates, setComplianceUpdates] = useState(false);
  const [slackEnabled, setSlackEnabled] = useState(true);
  const [slackChannel, setSlackChannel] = useState("#compliance-alerts");

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
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success("Company settings saved");
    } catch {
      toast.error("Failed to save company settings");
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
    } catch {
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

  const handleInviteTeamMember = () => {
    if (!inviteEmail) return;
    
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      status: "pending",
      lastActive: null,
    };
    
    setTeamMembers([...teamMembers, newMember]);
    setInviteEmail("");
    setInviteRole("viewer");
    setInviteModalOpen(false);
    toast.success(`Invitation sent to ${inviteEmail}`);
  };

  const handleRemoveTeamMember = (memberId: string) => {
    if (!confirm("Remove this team member?")) return;
    setTeamMembers(teamMembers.filter(m => m.id !== memberId));
    toast.success("Team member removed");
  };

  const toggleFramework = (framework: string) => {
    if (enabledFrameworks.includes(framework)) {
      setEnabledFrameworks(enabledFrameworks.filter((f) => f !== framework));
    } else {
      setEnabledFrameworks([...enabledFrameworks, framework]);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-mono">Settings</h1>
            <p className="text-muted-foreground">Manage your account, team, and preferences</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 rounded-none h-auto p-1 bg-muted">
            <TabsTrigger value="profile" className="rounded-none gap-2 py-3 data-[state=active]:bg-background">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="rounded-none gap-2 py-3 data-[state=active]:bg-background">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Company</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="rounded-none gap-2 py-3 data-[state=active]:bg-background">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-none gap-2 py-3 data-[state=active]:bg-background">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="rounded-none gap-2 py-3 data-[state=active]:bg-background">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="rounded-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-mono">Profile Information</CardTitle>
                <CardDescription>Update your personal details and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="rounded-none"
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
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-none">{user?.role || "User"}</Badge>
                  </div>
                </div>
                <Button onClick={handleSaveProfile} disabled={isSaving} className="rounded-none gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-mono flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>Manage your password and two-factor authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="rounded-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border">
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </div>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                  />
                </div>
                <Button variant="outline" className="rounded-none">
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-6">
            <Card className="rounded-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-mono">Company Information</CardTitle>
                <CardDescription>Manage your organization details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyDomain">Domain</Label>
                    <Input
                      id="companyDomain"
                      value={companyDomain}
                      onChange={(e) => setCompanyDomain(e.target.value)}
                      className="rounded-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAuditDate">Target Audit Date</Label>
                  <Input
                    id="targetAuditDate"
                    type="date"
                    value={targetAuditDate}
                    onChange={(e) => setTargetAuditDate(e.target.value)}
                    className="rounded-none font-mono"
                  />
                </div>
                <Button onClick={handleSaveCompany} disabled={isSaving} className="rounded-none gap-2">
                  <Save className="h-4 w-4" />
                  Save Company Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-mono flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Active Frameworks
                </CardTitle>
                <CardDescription>Select the compliance frameworks you want to track</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Primary Framework</Label>
                  <Select value={primaryFramework} onValueChange={setPrimaryFramework}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOC2">SOC 2 Type II</SelectItem>
                      <SelectItem value="ISO27001">ISO 27001</SelectItem>
                      <SelectItem value="HIPAA">HIPAA</SelectItem>
                      <SelectItem value="PCIDSS">PCI DSS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Enabled Frameworks</Label>
                  <div className="space-y-2">
                    {[
                      { id: "SOC2", name: "SOC 2 Type II", desc: "Trust Services Criteria" },
                      { id: "ISO27001", name: "ISO 27001", desc: "Information Security Management" },
                      { id: "HIPAA", name: "HIPAA", desc: "Healthcare Data Protection" },
                      { id: "PCIDSS", name: "PCI DSS", desc: "Payment Card Industry" },
                    ].map((framework) => (
                      <div
                        key={framework.id}
                        className="flex items-center justify-between p-4 border hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <div className="font-medium font-mono">{framework.name}</div>
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

                <Button onClick={handleSavePreferences} disabled={isSaving} className="rounded-none gap-2">
                  <Save className="h-4 w-4" />
                  Save Framework Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card className="rounded-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-mono">Team Members</CardTitle>
                  <CardDescription>Manage who has access to your compliance dashboard</CardDescription>
                </div>
                <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-none gap-2">
                      <Plus className="h-4 w-4" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-none">
                    <DialogHeader>
                      <DialogTitle className="font-mono">Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join your compliance team
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="inviteEmail">Email Address</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          placeholder="colleague@company.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="rounded-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inviteRole">Role</Label>
                        <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as typeof inviteRole)}>
                          <SelectTrigger className="rounded-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin - Full access</SelectItem>
                            <SelectItem value="editor">Editor - Can edit controls</SelectItem>
                            <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteModalOpen(false)} className="rounded-none">
                        Cancel
                      </Button>
                      <Button onClick={handleInviteTeamMember} className="rounded-none gap-2">
                        <Mail className="h-4 w-4" />
                        Send Invitation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono">Name</TableHead>
                      <TableHead className="font-mono">Email</TableHead>
                      <TableHead className="font-mono">Role</TableHead>
                      <TableHead className="font-mono">Status</TableHead>
                      <TableHead className="font-mono">Last Active</TableHead>
                      <TableHead className="font-mono text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="text-muted-foreground">{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-none capitalize">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`rounded-none ${member.status === "active" ? "border-[var(--pass)] text-[var(--pass)]" : "border-[var(--warn)] text-[var(--warn)]"}`}
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {formatDate(member.lastActive)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTeamMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="rounded-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-mono flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>Configure which emails you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "emailNotifications", label: "Enable Email Notifications", desc: "Receive email notifications for important events", value: emailNotifications, setter: setEmailNotifications },
                  { key: "alertEmails", label: "Compliance Alerts", desc: "Get notified when compliance checks fail", value: alertEmails, setter: setAlertEmails },
                  { key: "weeklyReport", label: "Weekly Report", desc: "Receive a weekly summary of compliance status", value: weeklyReport, setter: setWeeklyReport },
                  { key: "complianceUpdates", label: "Framework Updates", desc: "Get notified about changes to compliance frameworks", value: complianceUpdates, setter: setComplianceUpdates },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 border hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                    <Switch checked={item.value} onCheckedChange={item.setter} />
                  </div>
                ))}
                <Button onClick={handleSavePreferences} disabled={isSaving} className="rounded-none gap-2">
                  <Save className="h-4 w-4" />
                  Save Email Preferences
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-mono flex items-center gap-2">
                  <Slack className="h-5 w-5" />
                  Slack Integration
                </CardTitle>
                <CardDescription>Receive notifications in Slack</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border">
                  <div>
                    <div className="font-medium">Enable Slack Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Send compliance alerts to a Slack channel
                    </div>
                  </div>
                  <Switch checked={slackEnabled} onCheckedChange={setSlackEnabled} />
                </div>
                {slackEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="slackChannel">Default Channel</Label>
                    <Input
                      id="slackChannel"
                      value={slackChannel}
                      onChange={(e) => setSlackChannel(e.target.value)}
                      placeholder="#compliance-alerts"
                      className="rounded-none font-mono"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api" className="space-y-6">
            <Card className="rounded-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-mono">API Keys</CardTitle>
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
