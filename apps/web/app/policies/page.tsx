"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PolicyDraftingWizard } from "@/components/ai/PolicyDraftingWizard";
import { Policy } from "@/types/ai";
import { FileText, Download, Plus, Eye, Sparkles } from "lucide-react";

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/policies");
      const data = await response.json();
      setPolicies(data);
    } catch (error) {
      console.error("Failed to load policies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPolicy = async (policyId: string, format: "pdf" | "docx" | "md") => {
    try {
      const response = await fetch(`/api/policies/${policyId}/download?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `policy-${policyId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download policy:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "REVIEW":
        return <Badge className="bg-blue-500">In Review</Badge>;
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>;
      case "ARCHIVED":
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const policyTemplates = [
    { name: "Access Control Policy", type: "ACCESS_CONTROL" },
    { name: "Data Protection Policy", type: "DATA_PROTECTION" },
    { name: "Incident Response Policy", type: "INCIDENT_RESPONSE" },
    { name: "Change Management Policy", type: "CHANGE_MANAGEMENT" },
    { name: "Backup & Recovery Policy", type: "BACKUP_RECOVERY" },
    { name: "Business Continuity Policy", type: "BUSINESS_CONTINUITY" },
  ];

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Policies</h1>
            </div>
            <p className="text-muted-foreground">
              Manage and generate compliance policies
            </p>
          </div>
          <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate New Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Generate Policy with AI</DialogTitle>
              </DialogHeader>
              <PolicyDraftingWizard
                onPolicyCreated={(policy) => {
                  loadPolicies();
                  setIsWizardOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Policy Templates */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Policy Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {policyTemplates.map((template) => (
                  <button
                    key={template.type}
                    className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    onClick={() => setIsWizardOpen(true)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{template.name}</span>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Existing Policies */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Your Policies</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading policies...
                </div>
              ) : (
                <div className="space-y-3">
                  {policies.map((policy) => (
                    <div
                      key={policy.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{policy.title}</h3>
                            {policy.isAiGenerated && (
                              <Badge variant="outline" className="gap-1">
                                <Sparkles className="h-3 w-3" />
                                AI
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Version {policy.version}</span>
                            <span>•</span>
                            <span>{new Date(policy.updatedAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{policy.controlsCovered.length} controls</span>
                          </div>
                        </div>
                        {getStatusBadge(policy.status)}
                      </div>

                      {policy.soc2Alignment && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">SOC 2 Alignment</span>
                            <span className="font-medium">
                              {(policy.soc2Alignment * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${policy.soc2Alignment * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setSelectedPolicy(policy)}
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleDownloadPolicy(policy.id, "pdf")}
                        >
                          <Download className="h-3 w-3" />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleDownloadPolicy(policy.id, "docx")}
                        >
                          <Download className="h-3 w-3" />
                          DOCX
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleDownloadPolicy(policy.id, "md")}
                        >
                          <Download className="h-3 w-3" />
                          MD
                        </Button>
                      </div>
                    </div>
                  ))}
                  {policies.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                      <p className="text-muted-foreground">No policies yet</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setIsWizardOpen(true)}
                      >
                        Generate Your First Policy
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Policy Viewer Dialog */}
        {selectedPolicy && (
          <Dialog open={!!selectedPolicy} onOpenChange={() => setSelectedPolicy(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedPolicy.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Version {selectedPolicy.version}</span>
                  <span>•</span>
                  <span>{new Date(selectedPolicy.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="bg-muted p-6 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {selectedPolicy.content}
                  </pre>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
