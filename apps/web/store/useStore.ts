import { create } from 'zustand';

interface Record {
  id: string;
  payload: any;
  checksum: string;
}

interface DashboardState {
  records: Record[];
  setRecords: (records: Record[]) => void;
  addRecord: (record: Record) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  records: [],
  setRecords: (records) => set({ records }),
  addRecord: (record) => set((state) => ({ 
    records: [record, ...state.records.filter(r => r.id !== record.id)] 
  })),
}));
