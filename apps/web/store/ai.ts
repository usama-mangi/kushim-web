import { create } from 'zustand';

interface AIState {
  // Copilot sidebar state
  copilotOpen: boolean;
  setCopilotOpen: (open: boolean) => void;
  toggleCopilot: () => void;

  // Evidence mapping dialog state
  evidenceMappingOpen: boolean;
  evidenceMappingEvidenceId: string;
  setEvidenceMappingOpen: (open: boolean, evidenceId?: string) => void;

  // Policy drafting dialog state
  policyDraftingOpen: boolean;
  setPolicyDraftingOpen: (open: boolean) => void;
}

// Initialize from localStorage if available
const getInitialCopilotState = () => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem('copilot-sidebar-open');
    return stored ? JSON.parse(stored) : false;
  } catch {
    return false;
  }
};

export const useAIStore = create<AIState>((set) => ({
  // Copilot sidebar
  copilotOpen: false, // Will be initialized on client
  setCopilotOpen: (open) => set({ copilotOpen: open }),
  toggleCopilot: () => set((state) => ({ copilotOpen: !state.copilotOpen })),

  // Evidence mapping dialog
  evidenceMappingOpen: false,
  evidenceMappingEvidenceId: '',
  setEvidenceMappingOpen: (open, evidenceId = '') => 
    set({ evidenceMappingOpen: open, evidenceMappingEvidenceId: evidenceId }),

  // Policy drafting dialog
  policyDraftingOpen: false,
  setPolicyDraftingOpen: (open) => set({ policyDraftingOpen: open }),
}));
