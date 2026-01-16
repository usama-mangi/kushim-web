'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Database, Activity, LogOut, Shield, 
  Key, HelpCircle, ChevronDown, ChevronUp, Plus, 
  Github, Slack, Hash, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SourcesPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [showHelp, setShowHelp] = useState<string | null>(null);
  const router = useRouter();

  const fetchSources = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/ingestion/sources`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSources(response.data);
    } catch (error) {
      console.error('Failed to fetch sources', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const startEditing = (source: any) => {
    setEditingId(source.id);
    setFormData({}); 
    setShowHelp(null);
  };

  const handleSave = async (sourceId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/ingestion/sources/${sourceId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingId(null);
      fetchSources();
    } catch (error) {
      alert('Failed to update credentials');
    }
  };

  const handleAddSource = async (provider: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/ingestion/sources`,
        { providerName: provider, credentials: formData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsAddingSource(false);
      setFormData({});
      fetchSources();
    } catch (error) {
      alert('Failed to add source');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'github': return <Github className="w-6 h-6" />;
      case 'slack': return <Slack className="w-6 h-6" />;
      case 'jira': return <Hash className="w-6 h-6 text-blue-500" />;
      default: return <Database className="w-6 h-6" />;
    }
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
          <button className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl transition-all" title="Data Sources">
            <Database className="w-6 h-6" />
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

      <div className="flex-1 flex flex-col relative min-w-0">
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-10 bg-slate-950/50 backdrop-blur-xl z-10">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Data Sources</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">Manage platform connections</p>
          </div>

          <button 
            onClick={() => { setIsAddingSource(true); setFormData({}); }}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect New Source
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-10 scrollbar-hide">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sources.map((source) => (
                <div key={source.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col space-y-6 hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-indigo-400">
                        {getPlatformIcon(source.providerName)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white capitalize">{source.providerName}</h3>
                        <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">ID: {source.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center px-2 py-1 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20 text-[10px] font-bold uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3 mr-1.5" /> {source.status}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                    <div className="text-slate-500">
                      Last sync: <span className="text-slate-300 font-medium">{source.lastSync ? new Date(source.lastSync).toLocaleString() : 'Never'}</span>
                    </div>
                    <button 
                      onClick={() => startEditing(source)}
                      className="text-indigo-400 hover:text-indigo-300 font-bold transition flex items-center"
                    >
                      <Key className="w-3 h-3 mr-1.5" /> Update Key
                    </button>
                  </div>
                </div>
              ))}

              {sources.length === 0 && !isAddingSource && (
                <div className="col-span-full py-20 flex flex-col items-center text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                  <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800">
                    <Database className="w-8 h-8 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No active connections</h3>
                  <p className="text-slate-500 max-w-xs text-sm">Integrate with GitHub, Jira, or Slack to start mapping your ambient workspace.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add/Edit Source Slide-over */}
      {(isAddingSource || editingId) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => { setIsAddingSource(false); setEditingId(null); }} />
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl relative z-10 flex flex-col transform animate-in slide-in-from-right duration-300">
            <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/20">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Update Credentials' : 'Connect New Source'}
              </h2>
              <button onClick={() => { setIsAddingSource(false); setEditingId(null); }} className="p-2 hover:bg-slate-800 rounded-full transition text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {!editingId && (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Select Provider</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['github', 'jira', 'slack'].map(p => (
                      <button 
                        key={p}
                        onClick={() => setFormData({ ...formData, provider: p })}
                        className={cn(
                          "p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all capitalize font-bold text-xs",
                          formData.provider === p ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                        )}
                      >
                        {getPlatformIcon(p)}
                        <span>{p}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(formData.provider || editingId) && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 flex items-start space-x-3 text-xs text-slate-400">
                    <HelpCircle className="w-4 h-4 text-indigo-400 mt-0.5" />
                    <div>
                      <p className="text-indigo-300 font-bold mb-1">Configuration Guide</p>
                      {(formData.provider === 'github' || (editingId && sources.find(s => s.id === editingId)?.providerName === 'github')) && (
                        <p>Generate a Classic PAT with <code>repo</code> and <code>read:user</code> scopes.</p>
                      )}
                      {(formData.provider === 'jira' || (editingId && sources.find(s => s.id === editingId)?.providerName === 'jira')) && (
                        <p>Requires Atlassian API Token and host URL (e.g. <code>https://your-domain.atlassian.net</code>).</p>
                      )}
                      {(formData.provider === 'slack' || (editingId && sources.find(s => s.id === editingId)?.providerName === 'slack')) && (
                        <p>Enter your User OAuth Token (xoxp-...) from your Slack App dashboard.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(formData.provider === 'github' || formData.provider === 'slack' || editingId) && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Access Token</label>
                        <input 
                          type="password"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="••••••••••••••••"
                          onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                        />
                      </div>
                    )}
                    {formData.provider === 'jira' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Host URL</label>
                          <input 
                            type="text"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="https://acme.atlassian.net"
                            onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Account Email</label>
                          <input 
                            type="email"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="admin@acme.com"
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">API Token</label>
                          <input 
                            type="password"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="••••••••••••••••"
                            onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <footer className="p-8 bg-slate-950/50 border-t border-slate-800">
              <button 
                onClick={() => editingId ? handleSave(editingId) : handleAddSource(formData.provider)}
                disabled={!formData.provider && !editingId}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-indigo-500/10"
              >
                {editingId ? 'Confirm Changes' : 'Initialize Connection'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
