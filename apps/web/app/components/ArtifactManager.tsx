"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, X, Trash2, Search, AlertCircle, Check } from "lucide-react";

interface Artifact {
  id: string;
  title: string;
  sourcePlatform: string;
  artifactType: string;
  url?: string;
  timestamp: string;
}

interface ArtifactManagerProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ArtifactManager({
  groupId,
  groupName,
  onClose,
  onUpdate,
}: ArtifactManagerProps) {
  const [allArtifacts, setAllArtifacts] = useState<Artifact[]>([]);
  const [groupArtifacts, setGroupArtifacts] = useState<Artifact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchArtifacts();
  }, [groupId]);

  const fetchArtifacts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Fetch all user artifacts
      const allResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/records`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Fetch group graph to get current members
      const groupResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/graph/context-groups/${groupId}/graph`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const groupNodeIds = new Set(
        groupResponse.data.nodes.map((n: any) => n.id),
      );

      setAllArtifacts(allResponse.data);
      setGroupArtifacts(
        allResponse.data.filter((a: Artifact) => groupNodeIds.has(a.id)),
      );
    } catch (err) {
      console.error("Failed to fetch artifacts", err);
      setError("Failed to load artifacts");
    } finally {
      setLoading(false);
    }
  };

  const handleAddArtifact = async (artifactId: string) => {
    setActionLoading(artifactId);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      console.log(
        "[ArtifactManager] Adding artifact:",
        artifactId,
        "to group:",
        groupId,
      );

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/graph/context-groups/${groupId}/artifacts`,
        { artifactId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      console.log("[ArtifactManager] Add response:", response.data);

      await fetchArtifacts();
      onUpdate(); // Refresh parent component

      const artifact = allArtifacts.find((a) => a.id === artifactId);
      setSuccess(`Added "${artifact?.title}" to group`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add artifact");
      console.error("[ArtifactManager] Add error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveArtifact = async (artifactId: string) => {
    setActionLoading(artifactId);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      console.log(
        "[ArtifactManager] Removing artifact:",
        artifactId,
        "from group:",
        groupId,
      );

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/graph/context-groups/${groupId}/artifacts/${artifactId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      console.log("[ArtifactManager] Remove successful");

      const artifact = groupArtifacts.find((a) => a.id === artifactId);

      await fetchArtifacts();
      onUpdate(); // Refresh parent component

      setSuccess(`Removed "${artifact?.title}" from group`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove artifact");
      console.error("[ArtifactManager] Remove error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const groupArtifactIds = new Set(groupArtifacts.map((a) => a.id));
  const availableArtifacts = allArtifacts.filter(
    (a) => !groupArtifactIds.has(a.id),
  );

  const filteredAvailable = availableArtifacts.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.sourcePlatform.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredGroupArtifacts = groupArtifacts.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.sourcePlatform.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "github":
        return "bg-purple-500/20 text-purple-400";
      case "jira":
        return "bg-blue-500/20 text-blue-400";
      case "slack":
        return "bg-green-500/20 text-green-400";
      case "google":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white">Manage Artifacts</h3>
            <p className="text-sm text-slate-400 mt-1">{groupName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artifacts..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex min-h-0">
          {/* Current Members */}
          <div className="flex-1 border-r border-slate-800 flex flex-col min-w-0 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex-shrink-0">
              <h4 className="font-semibold text-white text-sm">
                In Group ({groupArtifacts.length})
              </h4>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              ) : filteredGroupArtifacts.length > 0 ? (
                filteredGroupArtifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-3 group hover:border-slate-700 transition-colors w-full"
                  >
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h5
                        className="font-medium text-white text-sm truncate w-full"
                        title={artifact.title}
                      >
                        {artifact.title}
                      </h5>
                      <div className="flex items-center gap-2 mt-1 overflow-hidden">
                        <span
                          className={`px-2 py-0.5 rounded text-xs flex-shrink-0 ${getPlatformColor(artifact.sourcePlatform)}`}
                        >
                          {artifact.sourcePlatform}
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                          {artifact.artifactType}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveArtifact(artifact.id)}
                      disabled={actionLoading === artifact.id}
                      className="flex-shrink-0 p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors disabled:opacity-50"
                      title="Remove from group"
                    >
                      {actionLoading === artifact.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-500">
                    No artifacts in this group
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Available Artifacts */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex-shrink-0">
              <h4 className="font-semibold text-white text-sm">
                Available ({availableArtifacts.length})
              </h4>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              ) : filteredAvailable.length > 0 ? (
                filteredAvailable.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-3 group hover:border-slate-700 transition-colors w-full"
                  >
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h5
                        className="font-medium text-white text-sm truncate w-full"
                        title={artifact.title}
                      >
                        {artifact.title}
                      </h5>
                      <div className="flex items-center gap-2 mt-1 overflow-hidden">
                        <span
                          className={`px-2 py-0.5 rounded text-xs flex-shrink-0 ${getPlatformColor(artifact.sourcePlatform)}`}
                        >
                          {artifact.sourcePlatform}
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                          {artifact.artifactType}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddArtifact(artifact.id)}
                      disabled={actionLoading === artifact.id}
                      className="flex-shrink-0 p-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded transition-colors disabled:opacity-50"
                      title="Add to group"
                    >
                      {actionLoading === artifact.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-500">
                    {searchQuery
                      ? "No matching artifacts"
                      : "All artifacts already in group"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-slate-400">
            {groupArtifacts.length} artifact
            {groupArtifacts.length !== 1 ? "s" : ""} in group
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
