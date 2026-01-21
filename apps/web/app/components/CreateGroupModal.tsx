'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useFocusTrap, useA11yIds } from '@/hooks/useA11y';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateGroupModal({ onClose, onCreated }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const trapRef = useFocusTrap(true);
  const { id, labelId, errorId } = useA11yIds('create-group');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when modal opens
    inputRef.current?.focus();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      console.log('[CreateGroupModal] Creating group:', name.trim());
      console.log('[CreateGroupModal] Token present:', !!token);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/graph/context-groups`,
        { name: name.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('[CreateGroupModal] Response:', response.data);

      if (response.data.success) {
        toast.success(`Created group "${name.trim()}"`);
        onCreated();
        onClose();
      } else {
        setError(response.data.message || 'Failed to create group');
      }
    } catch (err: any) {
      console.error('[CreateGroupModal] Error creating group:', err);
      setError(err.response?.data?.message || 'Failed to create group');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby={labelId}>
      <div 
        ref={trapRef as any}
        className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full mx-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id={labelId} className="text-lg font-bold text-white">Create Context Group</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-slate-400" aria-hidden="true" />
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-2">
            Group Name
          </label>
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Q4 Planning, Frontend Team..."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            aria-describedby={error ? errorId : undefined}
            aria-invalid={!!error}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') onClose();
            }}
          />
        </div>

        {error && (
          <div id={errorId} role="alert" className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            aria-busy={loading}
            className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              'Creating...'
            ) : (
              <>
                <Plus className="w-4 h-4" aria-hidden="true" />
                Create Group
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
