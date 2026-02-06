'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText } from 'lucide-react';
import { PolicyDraftingWizard } from './PolicyDraftingWizard';

interface PolicyDraftingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPolicyCreated?: (policy: unknown) => void;
}

/**
 * Dialog for AI-powered policy drafting
 * 
 * Features:
 * - Modal overlay
 * - Multi-step wizard
 * - Policy generation and review
 * - Keyboard accessible (Esc to close)
 */
export function PolicyDraftingDialog({ 
  open, 
  onOpenChange,
  onPolicyCreated
}: PolicyDraftingDialogProps) {
  const handlePolicyCreated = (policy: unknown) => {
    onPolicyCreated?.(policy);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono">
            <FileText className="h-5 w-5 text-primary" />
            AI Policy Drafting
          </DialogTitle>
          <DialogDescription>
            Generate compliance policies using AI based on your selected controls
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <PolicyDraftingWizard onPolicyCreated={handlePolicyCreated} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
