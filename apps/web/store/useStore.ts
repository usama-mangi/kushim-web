import { create } from 'zustand';

export interface Artifact {
  id: string;
  externalId: string;
  sourcePlatform: string;
  artifactType: string;
  title: string;
  body: string;
  url: string;
  author: string;
  timestamp: string;
  participants: string[];
  metadata: any;
}

export interface ContextGroup {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  members: {
    weight: number;
    record: Artifact;
  }[];
}

interface DashboardState {
  records: Artifact[];
  contextGroups: ContextGroup[];
  selectedArtifact: Artifact | null;
  isDetailPanelOpen: boolean;
  isCommandBarOpen: boolean;
  
  setRecords: (records: Artifact[]) => void;
  setContextGroups: (groups: ContextGroup[]) => void;
  setSelectedArtifact: (artifact: Artifact | null) => void;
  setDetailPanelOpen: (isOpen: boolean) => void;
  setCommandBarOpen: (isOpen: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  records: [],
  contextGroups: [],
  selectedArtifact: null,
  isDetailPanelOpen: false,
  isCommandBarOpen: false,

  setRecords: (records) => set({ records }),
  setContextGroups: (contextGroups) => set({ contextGroups }),
  setSelectedArtifact: (selectedArtifact) => set({ selectedArtifact, isDetailPanelOpen: !!selectedArtifact }),
  setDetailPanelOpen: (isDetailPanelOpen) => set({ isDetailPanelOpen }),
  setCommandBarOpen: (isCommandBarOpen) => set({ isCommandBarOpen }),
}));