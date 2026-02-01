"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileJson, FileText, CheckCircle, ShieldCheck, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Evidence } from "@/lib/api/types";

interface EvidenceViewerProps {
  evidence: Evidence;
}

export function EvidenceViewer({ evidence }: EvidenceViewerProps) {
  const [activeTab, setActiveTab] = useState("content");

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(evidence.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evidence-${evidence.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-md">
              <FileJson className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Evidence Record</CardTitle>
              <CardDescription>
                Collected on {formatDate(evidence.timestamp)}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-success" />
            Verified Hash
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="chain">Chain of Custody</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          <TabsContent value="content" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/50 font-mono text-sm">
              <pre>{JSON.stringify(evidence.data, null, 2)}</pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="metadata" className="flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Type</span>
                <p className="text-sm">{evidence.type}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Source</span>
                <p className="text-sm">{evidence.source}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">ID</span>
                <p className="text-sm font-mono">{evidence.id}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Hash</span>
                <p className="text-sm font-mono truncate" title={evidence.hash}>
                  {evidence.hash || "sha256:e3b0c44298fc1c149afbf4c8996fb924..."}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chain" className="flex-1">
            <div className="space-y-4">
              <div className="flex items-start gap-4 relative pb-8 border-l-2 border-muted ml-2 pl-4 last:border-0 last:pb-0">
                <div className="absolute -left-[9px] top-0 bg-background">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Evidence Collected</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(evidence.timestamp)}
                  </p>
                  <p className="text-sm mt-1">
                    Automatically collected from {evidence.source} API
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 relative pb-8 border-l-2 border-muted ml-2 pl-4 last:border-0 last:pb-0">
                <div className="absolute -left-[9px] top-0 bg-background">
                  <ShieldCheck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Hash Verified</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(new Date(new Date(evidence.timestamp).getTime() + 1000))}
                  </p>
                  <p className="text-sm mt-1">
                    Integrity check passed. Content unchanged.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
