'use client';

import { useDashboardStore, Artifact, ContextGroup } from '@/store/useStore';
import { useSocket } from '@/hooks/useSocket';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  LayoutDashboard, Database, RefreshCw, Activity, LogOut, Shield, 
  Search, Command, ExternalLink, Clock, User, Link as LinkIcon,
  X, ChevronRight, MessageSquare, UserPlus, CheckCircle2, AlertCircle,
  Hash, Github, Slack, FileText, Send, MoreHorizontal
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AmbientFeed() {
  const { 
    records, setRecords, 
    contextGroups, setContextGroups,
    selectedArtifact, setSelectedArtifact,
    isDetailPanelOpen, setDetailPanelOpen,
    isCommandBarOpen, setCommandBarOpen
  } = useDashboardStore();
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [commandInput, setActionInput] = useState('');

  useSocket();

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const [recordsRes, groupsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/records`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/records/context-groups`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      
      setRecords(recordsRes.data);
      setContextGroups(groupsRes.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router, setRecords, setContextGroups]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keyboard Shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandBarOpen(!isCommandBarOpen);
      }
      if (e.key === 'Escape') {
        setCommandBarOpen(false);
        setDetailPanelOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isCommandBarOpen, setCommandBarOpen, setDetailPanelOpen]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      const sourcesRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/ingestion/sources`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      await Promise.all(sourcesRes.data.map((source: any) => 
        axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/ingestion/trigger/${source.id}`, {}, { headers: { Authorization: `Bearer ${token}` } })
      ));
      
      setTimeout(fetchData, 3000);
    } catch (error) {
      console.error('Sync failed', error);
    } finally {
      setSyncing(false);
    }
  };

  const executeAction = async (cmd: string) => {
    const token = localStorage.getItem('token');
    setActionLoading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/actions/execute`, 
        { command: cmd }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
      setCommandBarOpen(false);
      setActionInput('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return [];
    return records.filter(r => 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.body.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10);
  }, [records, searchQuery]);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'github': return <Github className="w-4 h-4" />;
      case 'slack': return <Slack className="w-4 h-4" />;
      case 'jira': return <Hash className="w-4 h-4 text-blue-500" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="text-indigo-200/50 font-medium tracking-widest text-xs uppercase animate-pulse">Initializing Kushim</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sansSelection">
      {/* Navigation Rail */}
      <aside className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-8 space-y-8 z-20">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="text-white font-black text-xl">K</span>
        </div>
        
        <nav className="flex-1 flex flex-col space-y-4">
          <button className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl transition-all" title="Ambient Feed">
            <LayoutDashboard className="w-6 h-6" />
          </button>
          <a href="/sources" className="p-3 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all" title="Data Sources">
            <Database className="w-6 h-6" />
          </a>
          <a href="/activity" className="p-3 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all" title="Audit Logs">
            <Activity className="w-6 h-6" />
          </a>
          <a href="/mfa/setup" className="p-3 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all" title="Security">
            <Shield className="w-6 h-6" />
          </a>
        </nav>

        <button 
          onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
          className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </aside>

      {/* Main Feed Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-10 bg-slate-950/50 backdrop-blur-xl z-10 sticky top-0">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Ambient Feed</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">Real-time context synchronization</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 cursor-pointer hover:border-slate-700 transition group" onClick={() => setCommandBarOpen(true)}>
              <Search className="w-4 h-4 text-slate-500 group-hover:text-slate-300 mr-2" />
              <span className="text-sm text-slate-500 group-hover:text-slate-400 pr-8">Search or command...</span>
              <kbd className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">⌘K</kbd>
            </div>

            <button 
              onClick={handleSync}
              disabled={syncing}
              className={cn(
                "flex items-center px-4 py-2 rounded-lg font-semibold text-sm transition-all",
                syncing ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
              )}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", syncing && "animate-spin")} />
              {syncing ? "Syncing..." : "Sync"}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
          {contextGroups.length > 0 ? (
            <div className="max-w-4xl mx-auto space-y-12">
              {contextGroups.map((group) => (
                <div key={group.id} className="relative">
                  {/* Timeline logic line */}
                  <div className="absolute left-[-24px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-indigo-500/50 via-slate-800 to-transparent" />
                  
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] z-10" />
                      <h2 className="text-lg font-bold text-white group cursor-pointer flex items-center">
                        {group.name}
                        <ChevronRight className="w-4 h-4 ml-1 text-slate-600 group-hover:text-indigo-400 transition" />
                      </h2>
                    </div>
                    <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                      <Clock className="w-3 h-3 mr-1" />
                      Last updated {new Date(group.updatedAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {group.members.map((member) => (
                      <div 
                        key={member.record.id}
                        onClick={() => setSelectedArtifact(member.record)}
                        className={cn(
                          "bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 flex items-start space-x-4 hover:bg-slate-800/50 hover:border-slate-700 transition cursor-pointer group relative overflow-hidden",
                          selectedArtifact?.id === member.record.id && "border-indigo-500/50 bg-indigo-500/5"
                        )}
                      >
                        <div className="p-2.5 bg-slate-950 rounded-lg text-slate-400 group-hover:text-indigo-400 border border-slate-800 group-hover:border-indigo-500/20 transition shadow-inner">
                          {getPlatformIcon(member.record.sourcePlatform)}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition truncate pr-6">{member.record.title}</h3>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800">
                              {member.record.sourcePlatform}
                            </span>
                            <span className="flex items-center text-[11px] text-slate-500">
                              <User className="w-3 h-3 mr-1 opacity-50" />
                              {member.record.author}
                            </span>
                            <span className="flex items-center text-[11px] text-slate-500">
                              <Clock className="w-3 h-3 mr-1 opacity-50" />
                              {new Date(member.record.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition absolute right-4 top-4">
                          <MoreHorizontal className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800 shadow-2xl">
                <Command className="w-8 h-8 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Ambient Context Discovered</h3>
              <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed text-balance">
                Connect your workspace tools to enable deterministic linking and watch Kushim assemble your work graph.
              </p>
              <button onClick={handleSync} className="mt-8 px-6 py-2.5 bg-slate-900 border border-slate-800 rounded-full text-sm font-semibold hover:bg-slate-800 transition shadow-lg">
                Connect Data Sources
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Artifact Detail Panel */}
      <aside className={cn(
        "fixed inset-y-0 right-0 w-[500px] bg-slate-900 border-l border-slate-800 shadow-2xl z-30 transition-transform duration-300 ease-in-out transform flex flex-col",
        isDetailPanelOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {selectedArtifact && (
          <>
            <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  {getPlatformIcon(selectedArtifact.sourcePlatform)}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{selectedArtifact.artifactType}</span>
              </div>
              <button onClick={() => setDetailPanelOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-white leading-tight mb-4">{selectedArtifact.title}</h2>
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedArtifact.participants.map(p => (
                    <span key={p} className="px-2 py-1 bg-slate-800 rounded text-[11px] text-slate-300 flex items-center">
                      <User className="w-3 h-3 mr-1 opacity-50" /> {p}
                    </span>
                  ))}
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {selectedArtifact.body || <span className="italic text-slate-600">No description provided.</span>}
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                  <ExternalLink className="w-3 h-3 mr-1.5" /> Platform Metadata
                </h4>
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4 space-y-3">
                  {Object.entries(selectedArtifact.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[11px]">
                      <span className="text-slate-500 capitalize">{k.replace('_', ' ')}</span>
                      <span className="text-slate-300 font-mono truncate ml-4">
                        {Array.isArray(v) ? v.join(', ') : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <footer className="p-6 bg-slate-950/50 border-t border-slate-800">
              <div className="flex items-center space-x-2">
                <a 
                  href={selectedArtifact.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center transition shadow-lg shadow-indigo-500/10"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on {selectedArtifact.sourcePlatform}
                </a>
                <button className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition">
                  <MoreHorizontal className="w-5 h-5 text-slate-300" />
                </button>
              </div>
            </footer>
          </>
        )}
      </aside>

      {/* Command Bar Modal */}
      {isCommandBarOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setCommandBarOpen(false)} />
          <div className="bg-slate-900 w-full max-w-2xl rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 border border-slate-800 transform animate-in fade-in zoom-in duration-200">
            <div className="flex items-center px-6 py-5 border-b border-slate-800 bg-slate-900">
              <Command className="w-5 h-5 text-indigo-500 mr-4" />
              <input 
                autoFocus
                placeholder="Search or execute (e.g. 'comment PR-12 Looks good')..."
                className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-slate-600 font-medium"
                value={commandInput || searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActionInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const verbs = ['comment', 'assign', 'reply', 'close'];
                    if (verbs.some(v => commandInput.toLowerCase().startsWith(v))) {
                      executeAction(commandInput);
                    }
                  }
                }}
              />
              <div className="flex items-center space-x-2">
                <kbd className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700 uppercase">Esc</kbd>
              </div>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto scrollbar-hide py-2">
              {searchQuery.length > 0 ? (
                <div className="px-2">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <div 
                        key={record.id} 
                        onClick={() => { setSelectedArtifact(record); setCommandBarOpen(false); }}
                        className="p-3 hover:bg-slate-800 rounded-xl cursor-pointer transition group flex items-center space-x-4 mx-2"
                      >
                        <div className="p-2 rounded-lg bg-slate-950 text-slate-500 group-hover:text-indigo-400 border border-slate-800 group-hover:border-indigo-500/30 transition">
                           {getPlatformIcon(record.sourcePlatform)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition truncate">{record.title}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{record.sourcePlatform} • {record.author}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition" />
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <AlertCircle className="w-8 h-8 text-slate-800 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No artifacts matching "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 px-2">Common Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: <MessageSquare className="w-4 h-4"/>, label: 'Comment on artifact', cmd: 'comment [id] [text]' },
                        { icon: <UserPlus className="w-4 h-4"/>, label: 'Assign to team member', cmd: 'assign [id] @user' },
                        { icon: <CheckCircle2 className="w-4 h-4"/>, label: 'Close ticket or PR', cmd: 'close [id]' },
                        { icon: <RefreshCw className="w-4 h-4"/>, label: 'Trigger manual sync', cmd: 'sync' },
                      ].map(item => (
                        <div key={item.label} className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center space-x-3 hover:border-slate-700 transition cursor-pointer group">
                          <div className="p-2 bg-slate-900 rounded-lg text-slate-500 group-hover:text-indigo-400 transition">{item.icon}</div>
                          <div>
                            <p className="text-xs font-semibold text-slate-300">{item.label}</p>
                            <p className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter mt-0.5">{item.cmd}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                <span className="flex items-center"><kbd className="bg-slate-900 px-1.5 py-0.5 rounded mr-1.5 border border-slate-800">↵</kbd> Select</span>
                <span className="flex items-center"><kbd className="bg-slate-900 px-1.5 py-0.5 rounded mr-1.5 border border-slate-800">↑↓</kbd> Navigate</span>
              </div>
              <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">Powered by Kushim Protocol</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
