'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface ComplianceGuidanceProps {
  passingControls: number;
  failingControls: number;
  warningControls: number;
  totalControls: number;
}

export function ComplianceGuidance({ 
  passingControls, 
  failingControls, 
  warningControls,
  totalControls 
}: ComplianceGuidanceProps) {
  // Don't show if everything is passing
  if (passingControls === totalControls) {
    return null;
  }

  // Don't show if no checks have been run yet (all are pending)
  const totalChecked = passingControls + failingControls + warningControls;
  if (totalChecked === 0) {
    return null;
  }

  const hasCriticalIssues = failingControls > 0;
  const hasWarnings = warningControls > 0;

  return (
    <div className="space-y-3 mb-6">
      {hasCriticalIssues && (
        <Alert variant="destructive" className="rounded-none">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-mono">Critical: {failingControls} Control{failingControls > 1 ? 's' : ''} Failing</AlertTitle>
          <AlertDescription className="text-sm space-y-2">
            <p>
              Some compliance controls are not meeting SOC 2 requirements. These must be addressed to achieve certification.
            </p>
            <div className="flex gap-2 mt-2">
              <Link href="/controls" className="inline-block">
                <Button variant="outline" size="sm" className="h-8 rounded-none">
                  View Failed Controls
                </Button>
              </Link>
              <a 
                href="https://github.com/yourusername/kushim-web/blob/main/docs/GITHUB_SECURITY_SETUP.md" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button variant="outline" size="sm" className="h-8 rounded-none">
                  Setup Guide
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </a>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {hasWarnings && !hasCriticalIssues && (
        <Alert className="rounded-none border-warning bg-warning/10">
          <Info className="h-4 w-4 text-warning" />
          <AlertTitle className="font-mono text-warning">
            {warningControls} Control{warningControls > 1 ? 's' : ''} Need Attention
          </AlertTitle>
          <AlertDescription className="text-sm space-y-2">
            <p className="text-foreground/80">
              Some controls are partially configured. While not critical, improving these will strengthen your security posture.
            </p>
            <div className="flex gap-2 mt-2">
              <Link href="/controls" className="inline-block">
                <Button variant="outline" size="sm" className="h-8 rounded-none">
                  View Details
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {hasWarnings && hasCriticalIssues && (
        <Alert className="rounded-none border-warning bg-warning/10">
          <Info className="h-4 w-4 text-warning" />
          <AlertTitle className="font-mono text-warning">
            Additionally: {warningControls} Warning{warningControls > 1 ? 's' : ''}
          </AlertTitle>
          <AlertDescription className="text-sm">
            <p className="text-foreground/80">
              After addressing critical failures, review these warnings to further improve compliance.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
