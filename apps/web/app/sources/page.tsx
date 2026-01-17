'use client';

import { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  LayoutDashboard, Database, Activity, LogOut, Shield, 
  Key, HelpCircle, ChevronDown, ChevronUp, Plus, 
  Github, Slack, Hash, CheckCircle2, AlertCircle, X, ExternalLink
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function SourcesContent() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

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

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const provider = searchParams.get('provider');

    if (success) {
      alert(`Successfully connected ${provider || 'source'}!`);
      router.replace('/sources'); // Clear URL
      fetchSources();
    } else if (error) {
      alert(`Connection failed: ${error}`);
      router.replace('/sources');
    }
  }, [searchParams, router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleOAuthConnect = async (provider: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/ingestion/oauth/${provider}/connect`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      alert('Failed to initiate connection');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'github': return <Github className="w-6 h-6" />;
      case 'slack': return <Slack className="w-6 h-6" />;
      case 'jira': return <Hash className="w-6 h-6 text-blue-500" />;
      case 'google': return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      );
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
            onClick={() => setIsAddingSource(true)}
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
                       disabled
                       className="text-slate-600 cursor-not-allowed flex items-center"
                       title="OAuth managed"
                    >
                      <Shield className="w-3 h-3 mr-1.5" /> Managed
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

      {/* Add Source Slide-over */}
      {isAddingSource && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsAddingSource(false)} />
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl relative z-10 flex flex-col transform animate-in slide-in-from-right duration-300">
            <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/20">
              <h2 className="text-lg font-bold text-white">Connect New Source</h2>
              <button onClick={() => setIsAddingSource(false)} className="p-2 hover:bg-slate-800 rounded-full transition text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-4">
               <p className="text-sm text-slate-400 mb-4">Select a platform to connect via OAuth 2.0.</p>
               
               <button 
                 onClick={() => handleOAuthConnect('google')}
                 className="w-full p-4 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-slate-700 transition flex items-center space-x-4 group"
               >
                  <div className="p-2 bg-white text-black rounded-lg">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-white group-hover:text-indigo-400 transition">Google Workspace</h3>
                    <p className="text-xs text-slate-500">Drive Docs, Gmail, Calendar</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
               </button>

               <button 
                 onClick={() => handleOAuthConnect('github')}
                 className="w-full p-4 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-slate-700 transition flex items-center space-x-4 group"
               >
                  <div className="p-2 bg-white text-black rounded-lg">
                    <Github className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-white group-hover:text-indigo-400 transition">GitHub</h3>
                    <p className="text-xs text-slate-500">Repositories, Issues, Pull Requests</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
               </button>

               <button 
                 onClick={() => handleOAuthConnect('jira')}
                 className="w-full p-4 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-slate-700 transition flex items-center space-x-4 group"
               >
                  <div className="p-2 bg-[#0052CC] text-white rounded-lg">
                    <Hash className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-white group-hover:text-indigo-400 transition">Jira</h3>
                    <p className="text-xs text-slate-500">Tickets, Projects, Comments</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
               </button>

               <button 
                 onClick={() => handleOAuthConnect('slack')}
                 className="w-full p-4 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-slate-700 transition flex items-center space-x-4 group"
               >
                  <div className="p-2 bg-[#4A154B] text-white rounded-lg">
                    <Slack className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-white group-hover:text-indigo-400 transition">Slack</h3>
                    <p className="text-xs text-slate-500">Channels, Messages, Files</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SourcesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SourcesContent />
    </Suspense>
  );
}