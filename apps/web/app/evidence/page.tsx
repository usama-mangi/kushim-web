"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDashboardStore } from "@/store/dashboard"; // Assuming we might fetch global evidence here or mock it
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Evidence } from "@/lib/api/types";
import { FileJson, Calendar, ArrowRight, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

// Mock evidence data for the list view since we don't have a dedicated "recent evidence" endpoint globally yet
// In a real app, this would come from an API endpoint like /api/evidence
const MOCK_EVIDENCE_LIST: Evidence[] = [
  {
    id: "ev-1",
    controlId: "CC6.1",
    timestamp: new Date().toISOString(),
    type: "Configuration Snapshot",
    source: "AWS",
    data: {},
    hash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  {
    id: "ev-2",
    controlId: "AC1.2",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    type: "User Access Log",
    source: "Okta",
    data: {},
    hash: "sha256:d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
  },
  {
    id: "ev-3",
    controlId: "CM-3",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    type: "Pull Request Review",
    source: "GitHub",
    data: {},
    hash: "sha256:ef537f25c895bfa782526529a9b63d97aa631564d5d789c2b765448c8635fb6c",
  },
];

export default function EvidencePage() {
  const [evidenceList, setEvidenceList] = useState<Evidence[]>(MOCK_EVIDENCE_LIST);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Evidence Library</h1>
              <p className="text-muted-foreground mt-1">
                 Audit trail and collected evidence artifacts
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {evidenceList.map((evidence) => (
            <Card key={evidence.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileJson className="h-5 w-5 text-primary" />
                    {evidence.type}
                  </CardTitle>
                  <CardDescription>
                    Source: <span className="font-medium text-foreground">{evidence.source}</span> • Control: <span className="font-medium text-foreground">{evidence.controlId}</span>
                  </CardDescription>
                </div>
                <Badge variant="outline">{formatDate(evidence.timestamp)}</Badge>
              </CardHeader>
              <CardContent className="pt-4">
                 <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded w-fit">
                        Hash: {evidence.hash.substring(0, 16)}...
                    </div>
                    <Link href={`/evidence/${evidence.id}`}>
                        <Button variant="ghost" size="sm">
                            View Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
