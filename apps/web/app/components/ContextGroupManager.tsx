'use client';

import { useState } from 'react';
import axios from 'axios';
import {
  Pencil, Trash2, Plus, X, Check, GitMerge, Split, AlertCircle, Users
} from 'lucide-react';
import ArtifactManager from './ArtifactManager';
import { toast } from 'sonner';

interface ContextGroup {
  id: string;
  name: string;
  artifactCount: number;
  coherenceScore?: number;
  topics?: string[];
  status: string;
  createdAt: string;
}

interface ContextGroupManagerProps {
  group: ContextGroup;
  onUpdate: () => void;
  onDelete: () => void;
  allGroups: ContextGroup[];
}

export default function ContextGroupManager({
  group,
  onUpdate,
  onDelete,
  allGroups
}: ContextGroupManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(group.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedMergeTarget, setSelectedMergeTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showArtifactManager, setShowArtifactManager] = useState(false);

  const handleRename = async () => {
    if (!newName.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/graph/context-groups/${group.id}`,
        { name: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEditing(false);
      toast.success(`Renamed to "${newName}"`);
      onUpdate();
    } catch (err) {
      setError('Failed to rename group');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/graph/context-groups/${group.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Context group deleted');
      onDelete();
    } catch (err) {
      setError('Failed to delete group');
      console.error(err);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleMerge = async () => {
    if (!selectedMergeTarget) return;
    
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/graph/context-groups/${selectedMergeTarget}/merge`,
        { sourceGroupId: group.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowMergeModal(false);
      toast.success('Groups merged successfully');
      onUpdate();
    } catch (err) {
      setError('Failed to merge groups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSplit = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/graph/context-groups/${group.id}/split`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!response.data.success) {
        toast.warning(response.data.message);
        setError(response.data.message);
      } else {
        toast.success(`Split into ${response.data.newGroupIds.length} groups`);
        onUpdate();
      }
    } catch (err) {
      setError('Failed to split group');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-white"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setNewName(group.name);
              }
            }}
          />
          <button
            onClick={handleRename}
            disabled={loading}
            className="p-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setNewName(group.name);
            }}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setShowArtifactManager(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 rounded transition-colors"
            title="Manage artifacts"
          >
            <Users className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 rounded transition-colors"
            title="Rename group"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => setShowMergeModal(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 rounded transition-colors"
            title="Merge with another group"
          >
            <GitMerge className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={handleSplit}
            disabled={loading || !!(group.coherenceScore && group.coherenceScore >= 0.4)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={group.coherenceScore && group.coherenceScore >= 0.4 ? "Group coherence is good" : "Split group"}
          >
            <Split className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
            title="Delete group"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Delete Context Group?</h3>
            <p className="text-sm text-slate-400 mb-4">
              This will remove the group &quot;{group.name}&quot; but artifacts will remain in the graph.
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setError('');
                }}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Merge Context Groups</h3>
            <p className="text-sm text-slate-400 mb-4">
              Select a target group to merge &quot;{group.name}&quot; into:
            </p>
            <select
              value={selectedMergeTarget}
              onChange={(e) => setSelectedMergeTarget(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white mb-4"
            >
              <option value="">Select a group...</option>
              {allGroups
                .filter(g => g.id !== group.id)
                .map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.artifactCount} artifacts)
                  </option>
                ))}
            </select>
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleMerge}
                disabled={loading || !selectedMergeTarget}
                className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Merging...' : 'Merge'}
              </button>
              <button
                onClick={() => {
                  setShowMergeModal(false);
                  setSelectedMergeTarget('');
                  setError('');
                }}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Artifact Manager Modal */}
      {showArtifactManager && (
        <ArtifactManager
          groupId={group.id}
          groupName={group.name}
          onClose={() => setShowArtifactManager(false)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}
