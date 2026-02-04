"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { getOAuthAuthorizeUrl } from "@/lib/api/endpoints";
import { toast } from "sonner";

interface IntegrationCardProps {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isConnected: boolean;
  healthScore?: number;
  lastSync?: Date;
  onDisconnect: () => void;
  connectionForm: React.ReactNode;
}

export function IntegrationCard({
  id,
  name,
  description,
  icon,
  isConnected,
  healthScore,
  lastSync,
  onDisconnect,
  connectionForm,
}: IntegrationCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const isOAuthPlatform = ["github", "slack", "jira", "okta"].includes(id.toLowerCase());

  const handleOAuthConnect = async () => {
    try {
      setIsConnecting(true);
      const { url } = await getOAuthAuthorizeUrl(id);
      window.location.href = url;
    } catch (error) {
      console.error(`Failed to start OAuth flow for ${id}:`, error);
      toast.error(`Failed to connect ${name}. Please try again.`);
      setIsConnecting(false);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-md">{icon}</div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          <Badge
            variant={isConnected ? "default" : "secondary"}
            className={isConnected ? "bg-success hover:bg-success/90" : ""}
          >
            {isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {isConnected && healthScore !== undefined ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Health Score</span>
              <span className={`font-bold ${healthScore >= 0.9 ? "text-success" : healthScore >= 0.7 ? "text-warning" : "text-error"}`}>
                {(healthScore * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${healthScore >= 0.9 ? "bg-success" : healthScore >= 0.7 ? "bg-warning" : "bg-error"}`}
                style={{ width: `${healthScore * 100}%` }}
              />
            </div>
            {lastSync && (
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <span>Last Sync</span>
                <span>{lastSync.toLocaleString()}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-24 text-center text-sm text-muted-foreground">
            Connect {name} to start monitoring data
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-4 border-t bg-muted/20">
        <div className="flex w-full items-center justify-between gap-2">
          {isConnected ? (
            <>
              {!isOAuthPlatform ? (
                <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              ) : (
                <div /> // Spacer
              )}
              <Button variant="destructive" size="sm" onClick={onDisconnect}>
                Disconnect
              </Button>
            </>
          ) : isOAuthPlatform ? (
            <Button className="w-full" onClick={handleOAuthConnect} disabled={isConnecting}>
              {isConnecting ? "Connecting..." : `Connect ${name} via OAuth`}
            </Button>
          ) : (
            <Button className="w-full" onClick={() => setIsDialogOpen(true)}>
              Connect {name}
            </Button>
          )}
        </div>

        {/* Form-based dialog (fallback/manual) */}
        {!isOAuthPlatform && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Connect {name}</DialogTitle>
                <DialogDescription>
                  Enter your credentials to connect with {name}. Your secrets are encrypted and stored securely.
                </DialogDescription>
              </DialogHeader>
              {connectionForm}
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
}
