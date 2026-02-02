"use client";

import { ReportGenerator } from "@/components/reports/ReportGenerator";

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Reporting & Audits</h1>
        <p className="text-muted-foreground">
          Prepare for your SOC 2 audit by generating comprehensive compliance reports and evidence packages.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <ReportGenerator />
      </div>
    </div>
  );
}
