'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link as LinkIcon } from 'lucide-react';
import { EvidenceMappingPanel } from './EvidenceMappingPanel';

interface EvidenceMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEvidenceId?: string;
}

/**
 * Dialog for AI-powered evidence mapping
 * 
 * Features:
 * - Modal overlay
 * - Evidence ID input
 * - AI mapping results display
 * - Keyboard accessible (Esc to close)
 */
export function EvidenceMappingDialog({ 
  open, 
  onOpenChange, 
  initialEvidenceId = '' 
}: EvidenceMappingDialogProps) {
  const [evidenceId, setEvidenceId] = useState(initialEvidenceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono">
            <LinkIcon className="h-5 w-5 text-primary" />
            AI Evidence Mapping
          </DialogTitle>
          <DialogDescription>
            Automatically map evidence to compliance controls using AI analysis
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="evidenceId">Evidence ID</Label>
            <Input
              id="evidenceId"
              placeholder="Enter Evidence ID (e.g., EV-2024-001)"
              value={evidenceId}
              onChange={(e) => setEvidenceId(e.target.value)}
              className="rounded-none"
            />
          </div>
          
          {evidenceId && (
            <EvidenceMappingPanel evidenceId={evidenceId} />
          )}
          
          {!evidenceId && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed">
              <LinkIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Enter an Evidence ID to start AI mapping</p>
              <p className="text-sm mt-1">
                The AI will analyze the evidence and suggest relevant controls
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
