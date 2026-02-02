"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getControlDetails } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  ShieldCheck,
  History,
  FileSearch
} from "lucide-react";
import { formatDate, getStatusBgColor } from "@/lib/utils";
import { EvidenceViewer } from "@/components/evidence/EvidenceViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ControlDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [control, setControl] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchDetails = async () => {
      try {
        const data = await getControlDetails(id as string);
        setControl(data);
      } catch (err: any) {
        setError(err.message || "Failed to load control details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !control) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold text-error">Control Not Found</h1>
        <p className="text-muted-foreground mt-2">{error || "The control you are looking for does not exist."}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const latestCheck = control.complianceChecks[0];
  const status = latestCheck?.status || "PENDING";

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{control.controlId}</Badge>
            <h1 className="text-2xl font-bold">{control.title}</h1>
          </div>
          <p className="text-muted-foreground">{control.category} • SOC 2 Framework</p>
        </div>
        <Badge className={`text-lg py-1 px-4 ${getStatusBgColor(status)}`}>
          {status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Control Description
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert">
              <p>{control.description}</p>
              <h4 className="mt-4 text-sm font-semibold">Test Procedure</h4>
              <p>{control.testProcedure}</p>
            </CardContent>
          </Card>

          <Tabs defaultValue="evidence" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="evidence">
                <FileSearch className="h-4 w-4 mr-2" />
                Latest Evidence
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                Audit History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="evidence" className="pt-4">
              {control.evidence && control.evidence.length > 0 ? (
                <div className="space-y-4">
                  {control.evidence.map((ev: any) => (
                    <EvidenceViewer key={ev.id} evidence={{
                        id: ev.id,
                        controlId: control.id,
                        timestamp: ev.collectedAt,
                        type: control.integrationType || 'AUTOMATED',
                        source: control.integrationType || 'SYSTEM',
                        data: ev.data,
                        hash: ev.hash
                    }} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <p className="text-muted-foreground">No evidence has been collected yet.</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="history" className="pt-4">
              {control.complianceChecks && control.complianceChecks.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {control.complianceChecks.map((check: any) => (
                        <div key={check.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {check.status === 'PASS' ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <XCircle className="h-5 w-5 text-error" />
                            )}
                            <div>
                              <p className="font-medium">Self-Assessment Check</p>
                              <p className="text-xs text-muted-foreground">{formatDate(check.checkedAt)}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{check.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <p className="text-muted-foreground">No audit history available for this control.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Provider</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {control.integrationType || 'Manual Verification'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Frequency</span>
                <span className="text-sm font-medium capitalize">{control.frequency ? control.frequency.toLowerCase() : 'N/A'}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => router.push('/integrations')}
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                View Integration Settings
              </Button>
            </CardContent>
          </Card>

          {status === 'FAIL' && (
            <Card className="border-error/50 bg-error/5">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold text-error flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Remediation Required
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="text-xs">A Jira ticket has been automatically created to track the remediation of this control failure.</p>
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full"
                        onClick={() => router.push('/integrations')}
                    >
                        View Jira Status
                    </Button>
                </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
