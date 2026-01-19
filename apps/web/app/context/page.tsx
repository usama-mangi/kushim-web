'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Database, Activity, LogOut, Shield,
  Network, Layers, TrendingUp, Info
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Dynamically import graph component to avoid SSR issues
const GraphVisualization = dynamic(
  () => import('../components/GraphVisualization'),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div> }
);

interface ContextGroup {
  id: string;
  name: string;
  artifactCount: number;
  coherenceScore?: number;
  topics?: string[];
  status: string;
  createdAt: string;
}

interface GraphNode {
  id: string;
  label: string;
  type: 'artifact' | 'group';
  group?: number;
  metadata?: any;
}

interface GraphLink {
  source: string;
  target: string;
  confidence: number;
  signal: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

function ContextContent() {
  const [contextGroups, setContextGroups] = useState<ContextGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [graphLoading, setGraphLoading] = useState(false);
  const router = useRouter();

  const fetchContextGroups = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/graph/context-groups`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContextGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch context groups', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGraphData = async (groupId?: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setGraphLoading(true);
    try {
      const url = groupId
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/graph/context-groups/${groupId}/graph`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/graph/full`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Transform backend data to graph format
      const nodes: GraphNode[] = response.data.nodes || [];
      const links: GraphLink[] = response.data.links || [];

      setGraphData({ nodes, links });
    } catch (error) {
      console.error('Failed to fetch graph data', error);
      setGraphData({ nodes: [], links: [] });
    } finally {
      setGraphLoading(false);
    }
  };

  useEffect(() => {
    fetchContextGroups();
    fetchGraphData();
  }, []);

  useEffect(() => {
    if (selectedGroup !== null) {
      fetchGraphData(selectedGroup);
    } else {
      fetchGraphData();
    }
  }, [selectedGroup]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {/* Navigation Rail */}
      <aside className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-8 space-y-8 z-20">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 cursor-pointer" onClick={() => router.push('/')}>
          <span className="text-white font-black text-xl">K</span>
        </div>
        
        <nav className="flex-1 flex flex-col space-y-4">
          <button onClick={() => router.push('/')} className="p-3 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all" title="Ambient Feed">
            <LayoutDashboard className="w-6 h-6" />
          </button>
          <button onClick={() => router.push('/sources')} className="p-3 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all" title="Data Sources">
            <Database className="w-6 h-6" />
          </button>
          <button className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl transition-all" title="Context Graph">
            <Network className="w-6 h-6" />
          </button>
          <button onClick={() => router.push('/activity')} className="p-3 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all" title="Audit Logs">
            <Activity className="w-6 h-6" />
          </button>
          <button onClick={() => router.push('/mfa/setup')} className="p-3 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all" title="Security">
            <Shield className="w-6 h-6" />
          </button>
        </nav>

        <button onClick={handleLogout} className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
          <LogOut className="w-6 h-6" />
        </button>
      </aside>

      {/* Context Groups Sidebar */}
      <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
        <header className="h-20 border-b border-slate-800 flex items-center px-6">
          <div>
            <h2 className="text-lg font-bold text-white">Context Groups</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">
              {contextGroups.length} Active
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <button
            onClick={() => setSelectedGroup(null)}
            className={cn(
              "w-full p-4 rounded-xl border transition-all text-left",
              selectedGroup === null
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">All Artifacts</h3>
              <Layers className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-500">View complete graph</p>
          </button>

          {contextGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={cn(
                "w-full p-4 rounded-xl border transition-all text-left",
                selectedGroup === group.id
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                  : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm">{group.name}</h3>
                <div className="flex items-center text-xs text-slate-500">
                  <Network className="w-3 h-3 mr-1" />
                  {group.artifactCount}
                </div>
              </div>

              {group.topics && group.topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {group.topics.slice(0, 3).map((topic, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400">
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {group.coherenceScore !== undefined && (
                <div className="flex items-center text-xs">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  <span className="text-slate-500">Coherence:</span>
                  <span className="ml-1 font-semibold text-green-400">
                    {(group.coherenceScore * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </button>
          ))}

          {contextGroups.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                <Network className="w-6 h-6 text-slate-700" />
              </div>
              <p className="text-sm text-slate-500">No context groups yet</p>
              <p className="text-xs text-slate-600 mt-1">Groups will form as relationships are discovered</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Graph View */}
      <div className="flex-1 flex flex-col relative min-w-0">
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-10 bg-slate-950/50 backdrop-blur-xl z-10">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {selectedGroup
                ? contextGroups.find(g => g.id === selectedGroup)?.name || 'Context Graph'
                : 'Context Graph'}
            </h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">
              {graphData.nodes.length} Artifacts · {graphData.links.length} Relationships
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center text-xs text-slate-400">
              <Info className="w-3 h-3 mr-2" />
              Read-only view
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative bg-slate-950">
          {graphLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500 text-sm">Loading graph...</p>
              </div>
            </div>
          ) : graphData.nodes.length > 0 ? (
            <GraphVisualization data={graphData} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6 mx-auto border border-slate-800">
                  <Network className="w-8 h-8 text-slate-700" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No graph data</h3>
                <p className="text-slate-500 max-w-xs text-sm">
                  Connect data sources and allow time for relationship discovery.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ContextPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContextContent />
    </Suspense>
  );
}
