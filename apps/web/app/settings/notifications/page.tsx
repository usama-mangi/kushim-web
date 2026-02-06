"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, Save, Slack } from "lucide-react";
import { toast } from "sonner";

export default function NotificationsSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  // Email preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [alertEmails, setAlertEmails] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [complianceUpdates, setComplianceUpdates] = useState(false);
  
  // Slack preferences
  const [slackEnabled, setSlackEnabled] = useState(true);
  const [slackChannel, setSlackChannel] = useState("#compliance-alerts");

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
          slackEnabled,
          slackChannel,
        }),
      });
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
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
          <Button onClick={handleSavePreferences} disabled={isSaving} className="rounded-none gap-2">
            <Save className="h-4 w-4" />
            Save Slack Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
