/**
 * Undo/Redo Utilities
 * Functions for reversing and reapplying actions
 */

import { Action, ActionType } from '@/store/useActionHistoryStore';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get the reverse command for an action
 */
export function getReverseCommand(action: Action): string | null {
  switch (action.type) {
    case 'comment':
      // Cannot undo comments directly, would need delete comment API
      return null;
    
    case 'assign':
      return `unassign ${action.target}`;
    
    case 'close':
      return `reopen ${action.target}`;
    
    case 'link':
      if (action.secondTarget) {
        return `unlink ${action.target} ${action.secondTarget}`;
      }
      return null;
    
    case 'react':
      // Cannot undo reactions directly, would need remove reaction API
      return null;
    
    case 'reply':
      // Cannot undo replies directly
      return null;
    
    default:
      return null;
  }
}

/**
 * Execute undo operation
 */
export async function executeUndo(action: Action): Promise<{ success: boolean; error?: string }> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  const reverseCommand = getReverseCommand(action);
  
  if (!reverseCommand) {
    return { success: false, error: 'Action cannot be undone' };
  }

  try {
    await axios.post(
      `${API_URL}/actions/execute`,
      { command: reverseCommand },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to undo action' 
    };
  }
}

/**
 * Execute redo operation (re-execute original command)
 */
export async function executeRedo(action: Action): Promise<{ success: boolean; error?: string }> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await axios.post(
      `${API_URL}/actions/execute`,
      { command: action.command },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to redo action' 
    };
  }
}

/**
 * Check if an action can be undone
 */
export function canUndoAction(action: Action): boolean {
  return getReverseCommand(action) !== null;
}

/**
 * Get human-readable description of action
 */
export function getActionDescription(action: Action): string {
  switch (action.type) {
    case 'comment':
      return `Comment on ${action.target}`;
    case 'assign':
      return `Assign ${action.target} to ${action.payload}`;
    case 'close':
      return `Close ${action.target}`;
    case 'link':
      return `Link ${action.target} ↔ ${action.secondTarget}`;
    case 'react':
      return `React to ${action.target}`;
    case 'reply':
      return `Reply to ${action.target}`;
    default:
      return `Action on ${action.target}`;
  }
}

/**
 * Get time ago string
 */
export function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
