'use client';

import { useAIStore } from '@/store/ai';
import { CopilotSidebar, CopilotToggleButton } from './CopilotSidebar';
import { EvidenceMappingDialog } from './EvidenceMappingDialog';
import { PolicyDraftingDialog } from './PolicyDraftingDialog';
import { useAuthStore } from '@/store/auth';

/**
 * AI Provider component that renders all AI modals and the Copilot sidebar
 * 
 * Add this to the root layout to enable AI features throughout the app:
 * - Copilot sidebar (toggle with button or `/` key)
 * - Evidence Mapping dialog
 * - Policy Drafting dialog
 */
export function AIProvider() {
  const { isAuthenticated } = useAuthStore();
  const {
    copilotOpen,
    setCopilotOpen,
    toggleCopilot,
    evidenceMappingOpen,
    evidenceMappingEvidenceId,
    setEvidenceMappingOpen,
    policyDraftingOpen,
    setPolicyDraftingOpen,
  } = useAIStore();

  // Only render for authenticated users
  if (!isAuthenticated) return null;

  return (
    <>
      {/* Copilot Sidebar */}
      <CopilotSidebar 
        open={copilotOpen} 
        onOpenChange={setCopilotOpen} 
      />
      
      {/* Fixed Copilot toggle button */}
      <CopilotToggleButton onClick={toggleCopilot} />
      
      {/* Evidence Mapping Dialog */}
      <EvidenceMappingDialog
        open={evidenceMappingOpen}
        onOpenChange={(open) => setEvidenceMappingOpen(open)}
        initialEvidenceId={evidenceMappingEvidenceId}
      />
      
      {/* Policy Drafting Dialog */}
      <PolicyDraftingDialog
        open={policyDraftingOpen}
        onOpenChange={setPolicyDraftingOpen}
      />
    </>
  );
}
