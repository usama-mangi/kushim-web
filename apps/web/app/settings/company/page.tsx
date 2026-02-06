"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Shield, Save } from "lucide-react";
import { toast } from "sonner";

export default function CompanySettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  // Company settings
  const [companyName, setCompanyName] = useState("Acme Corp");
  const [companyDomain, setCompanyDomain] = useState("acme.com");
  const [targetAuditDate, setTargetAuditDate] = useState("2024-06-01");

  // Framework preferences
  const [primaryFramework, setPrimaryFramework] = useState("SOC2");
  const [enabledFrameworks, setEnabledFrameworks] = useState<string[]>(["SOC2"]);

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

  const handleSaveFrameworks = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/users/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryFramework,
          enabledFrameworks,
        }),
      });
      toast.success("Framework settings saved");
    } catch {
      toast.error("Failed to save framework settings");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFramework = (framework: string) => {
    if (enabledFrameworks.includes(framework)) {
      setEnabledFrameworks(enabledFrameworks.filter((f) => f !== framework));
    } else {
      setEnabledFrameworks([...enabledFrameworks, framework]);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-none shadow-sm">
        <CardHeader>
          <CardTitle className="font-mono flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
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

          <Button onClick={handleSaveFrameworks} disabled={isSaving} className="rounded-none gap-2">
            <Save className="h-4 w-4" />
            Save Framework Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
