"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComplianceCopilot } from "@/components/ai/ComplianceCopilot";
import { EvidenceMappingPanel } from "@/components/ai/EvidenceMappingPanel";
import { PolicyDraftingWizard } from "@/components/ai/PolicyDraftingWizard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Link as LinkIcon, BarChart3, Download } from "lucide-react";
import { AIUsageStats } from "@/types/ai";

export default function AIPage() {
  const [usageStats, setUsageStats] = useState<AIUsageStats | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string>("");
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const loadUsageStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch("/api/ai/usage");
      const data = await response.json();
      setUsageStats(data);
    } catch (error) {
      console.error("Failed to load usage stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">AI Features</h1>
            </div>
            <p className="text-muted-foreground">
              AI-powered compliance automation tools
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Powered by GPT-4
          </Badge>
        </div>

        <Tabs defaultValue="copilot" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="copilot" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Copilot</span>
            </TabsTrigger>
            <TabsTrigger value="evidence" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Evidence Mapping</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Policy Drafting</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Compliance Copilot */}
          <TabsContent value="copilot" className="space-y-4">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ask anything about your compliance program</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get instant answers backed by your evidence and documentation
                  </p>
                </CardContent>
              </Card>
              <ComplianceCopilot />
            </div>
          </TabsContent>

          {/* Tab 2: Evidence Mapping */}
          <TabsContent value="evidence" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Evidence Mapping</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Automatically map evidence to compliance controls using AI
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Evidence to Map
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter Evidence ID"
                      value={selectedEvidence}
                      onChange={(e) => setSelectedEvidence(e.target.value)}
                    />
                  </div>
                  {selectedEvidence && (
                    <EvidenceMappingPanel evidenceId={selectedEvidence} />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Policy Drafting */}
          <TabsContent value="policies" className="space-y-4">
            <div className="flex justify-center">
              <PolicyDraftingWizard />
            </div>
          </TabsContent>

          {/* Tab 4: AI Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>AI Usage & Cost Analytics</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadUsageStats}
                  disabled={isLoadingStats}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Load Stats
                </Button>
              </CardHeader>
              <CardContent>
                {!usageStats && !isLoadingStats && (
                  <div className="text-center py-12 text-muted-foreground">
                    Click "Load Stats" to view AI usage analytics
                  </div>
                )}
                
                {isLoadingStats && (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading usage statistics...
                  </div>
                )}

                {usageStats && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">
                            ${usageStats.totalCost.toFixed(2)}
                          </div>
                          <p className="text-xs text-muted-foreground">Total Cost</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">
                            {usageStats.totalTokens.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground">Total Tokens</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">
                            {usageStats.requestCount}
                          </div>
                          <p className="text-xs text-muted-foreground">API Requests</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Usage by Feature</h3>
                      <div className="space-y-2">
                        {Object.entries(usageStats.byFeature).map(([feature, stats]) => (
                          <div
                            key={feature}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <div className="font-medium capitalize">
                                {feature.replace(/_/g, " ")}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {stats.requests} requests • {stats.tokens.toLocaleString()} tokens
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">${stats.cost.toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
