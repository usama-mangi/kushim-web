"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useDashboardStore } from "@/store/dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EvidenceViewer } from "@/components/evidence/EvidenceViewer";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  History,
  Calendar
} from "lucide-react";
import { formatDate, getStatusBgColor } from "@/lib/utils";
import type { Evidence, Control } from "@/lib/api/types";

export default function ControlDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { controls, fetchDashboardData } = useDashboardStore();
  const [control, setControl] = useState<Control | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);

  useEffect(() => {
    if (controls.length === 0) {
      fetchDashboardData();
    } else {
      const foundControl = controls.find((c) => c.id === id);
      setControl(foundControl || null);
      // Select first evidence by default if available
      // Mocking evidence for now since it's not in the main store yet
      if (foundControl) {
        // This would come from an API call in a real app
        const mockEvidence: Evidence = {
          id: `ev-${id}-001`,
          controlId: id,
          timestamp: new Date().toISOString(),
          type: "Configuration Snapshot",
          source: foundControl.integration,
          data: {
            configuration: {
              mfaEnabled: true,
              passwordPolicy: "strong",
              users: 42
            },
            complianceCheck: {
              passed: true,
              rule: "MFA-001"
            }
          },
          hash: "sha256:mock-hash-123456789"
        };
        setSelectedEvidence(mockEvidence);
      }
    }
  }, [id, controls, fetchDashboardData]);

  if (!control) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PASS":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "FAIL":
        return <XCircle className="h-5 w-5 text-error" />;
      case "WARNING":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
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
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{control.name}</h1>
                <Badge className={getStatusBgColor(control.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(control.status)}
                    {control.status}
                  </span>
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                {control.description}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center justify-end gap-2">
                <History className="h-4 w-4" />
                Last checked: {formatDate(control.lastCheck)}
              </div>
              <div className="flex items-center justify-end gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                Next check: {formatDate(new Date(new Date(control.lastCheck).getTime() + 24 * 60 * 60 * 1000))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Evidence Viewer */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Latest Evidence</h2>
            {selectedEvidence ? (
              <EvidenceViewer evidence={selectedEvidence} />
            ) : (
              <div className="border rounded-lg p-12 text-center text-muted-foreground bg-muted/20">
                No evidence collected yet.
              </div>
            )}
          </div>

          {/* Sidebar - Context & History */}
          <div className="space-y-6">
            <div className="border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-4">Control Details</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Integration</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{control.integration}</Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Check Frequency</span>
                  <p className="text-sm mt-1">Daily (Every 24 hours)</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Control Owner</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      JD
                    </div>
                    <span className="text-sm">John Doe</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-4">History</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${i === 1 ? "bg-success" : "bg-success"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Passed Check</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(new Date(new Date().getTime() - i * 24 * 60 * 60 * 1000))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
