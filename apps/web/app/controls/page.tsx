"use client";

import { ControlStatus } from "@/components/dashboard/ControlStatus";

export default function ControlsPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">SOC 2 Controls</h1>
        <p className="text-muted-foreground">
          Manage and monitor all 64 SOC 2 controls across your infrastructure.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <ControlStatus />
      </div>
    </div>
  );
}
