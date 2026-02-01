"use client";

import { Evidence } from "@/lib/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileJson, Calendar, Hash, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface EvidenceViewerProps {
  evidence: Evidence;
}

export function EvidenceViewer({ evidence }: EvidenceViewerProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Evidence Detail
        </CardTitle>
        <Badge variant="outline">{evidence.type}</Badge>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Collected
            </span>
            <p className="font-medium">{formatDate(evidence.timestamp)}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Hash className="h-3 w-3" /> Hash
            </span>
            <p className="font-mono text-xs truncate" title={evidence.hash}>
              {evidence.hash}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Evidence Data</span>
            <Button variant="ghost" size="sm" className="h-6">
              <FileJson className="h-3 w-3 mr-1" />
              Download JSON
            </Button>
          </div>
          <div className="bg-muted rounded-md p-4 overflow-auto max-h-[400px]">
            <pre className="text-xs font-mono">
              {JSON.stringify(evidence.data, null, 2)}
            </pre>
          </div>
        </div>

        {evidence.source && (
            <div className="pt-4 border-t">
                <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    View in {evidence.source}
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
