"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EvidenceViewer } from "@/components/evidence/EvidenceViewer";
import { Evidence } from "@/lib/api/types";

// Mock data fetcher
const getMockEvidence = (id: string): Evidence => {
    return {
        id: id,
        controlId: "CC6.1",
        timestamp: new Date().toISOString(),
        type: "Configuration Snapshot",
        source: "AWS",
        data: {
            bucketName: "kushim-secure-logs",
            encryption: "AES256",
            publicAccess: false,
            versioning: true,
            tags: {
                Owner: "SecOps",
                Environment: "Production"
            }
        },
        hash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    };
};

export default function EvidenceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [evidence, setEvidence] = useState<Evidence | null>(null);

  useEffect(() => {
    // Simulate API fetch
    if (id) {
        setEvidence(getMockEvidence(id));
    }
  }, [id]);

  if (!evidence) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
                <Link href="/evidence">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                     <h1 className="text-2xl font-bold">Evidence Details</h1>
                     <p className="text-muted-foreground text-sm font-mono mt-1">ID: {evidence.id}</p>
                </div>
            </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
            <EvidenceViewer evidence={evidence} />
        </div>
      </main>
    </div>
  );
}
