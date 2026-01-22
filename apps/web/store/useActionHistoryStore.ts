/**
 * Action History Store
 * Manages undo/redo functionality for user actions
 */

import { create } from 'zustand';

export type ActionType = 'comment' | 'assign' | 'close' | 'link' | 'react' | 'reply';

export interface Action {
  id: string;
  type: ActionType;
  timestamp: number;
  command: string; // Original command string
  target: string; // Artifact ID
  payload?: string; // Additional data (comment text, assignee, etc.)
  secondTarget?: string; // For link actions
  result?: any; // API response
}

interface ActionHistoryState {
  history: Action[];
  currentIndex: number; // -1 means no actions, points to last executed action
  maxSize: number;

  // Actions
  recordAction: (action: Omit<Action, 'id' | 'timestamp'>) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => Action | null;
  redo: () => Action | null;
  clear: () => void;
  getHistory: () => Action[];
}

export const useActionHistoryStore = create<ActionHistoryState>((set, get) => ({
  history: [],
  currentIndex: -1,
  maxSize: 10,

  recordAction: (action) => {
    set((state) => {
      const newAction: Action = {
        ...action,
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      // Remove any actions after current index (when undoing then doing new action)
      const newHistory = state.history.slice(0, state.currentIndex + 1);
      
      // Add new action
      newHistory.push(newAction);

      // Keep only last maxSize actions
      const trimmedHistory = newHistory.slice(-state.maxSize);

      return {
        history: trimmedHistory,
        currentIndex: trimmedHistory.length - 1,
      };
    });
  },

  canUndo: () => {
    const { currentIndex } = get();
    return currentIndex >= 0;
  },

  canRedo: () => {
    const { history, currentIndex } = get();
    return currentIndex < history.length - 1;
  },

  undo: () => {
    const { history, currentIndex, canUndo } = get();
    
    if (!canUndo()) return null;

    const actionToUndo = history[currentIndex];
    
    set({ currentIndex: currentIndex - 1 });
    
    return actionToUndo;
  },

  redo: () => {
    const { history, currentIndex, canRedo } = get();
    
    if (!canRedo()) return null;

    const actionToRedo = history[currentIndex + 1];
    
    set({ currentIndex: currentIndex + 1 });
    
    return actionToRedo;
  },

  clear: () => {
    set({ history: [], currentIndex: -1 });
  },

  getHistory: () => {
    const { history } = get();
    return [...history];
  },
}));
