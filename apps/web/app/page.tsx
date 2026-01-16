'use client';

import { useDashboardStore } from '@/store/useStore';
import { useSocket } from '@/hooks/useSocket';
import { useEffect, useState, useCallback } from 'react';
import { LayoutDashboard, Database, RefreshCw, Activity, LogOut, Shield, Search, Command, ExternalLink, Clock, User, Link as LinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface ContextGroup {
  id: string;
  name: string;
  updatedAt: string;
  members: {
    weight: number;
    record: {
      id: string;
      title: string;
      sourcePlatform: string;
      artifactType: string;
      url: string;
      timestamp: string;
      author: string;
    }
  }[];
}

export default function Home() {
  const { records, setRecords } = useDashboardStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeSourcesCount, setActiveSourcesCount] = useState(0);
  const [contextGroups, setContextGroups] = useState<ContextGroup[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useSocket();

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const [recordsRes, sourcesRes, groupsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/records`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/ingestion/sources`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/records/context-groups`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      
      setRecords(recordsRes.data);
      setActiveSourcesCount(sourcesRes.data.length);
      setContextGroups(groupsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router, setRecords]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Command Bar (Cmd+K) logic
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleSync = async () => {
    try {
      const token = localStorage.getItem('token');
      const sourcesRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/ingestion/sources`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const sources = sourcesRes.data;
      if (sources.length === 0) return;

      await Promise.all(sources.map((source: any) => 
        axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/ingestion/trigger/${source.id}`, {}, { headers: { Authorization: `Bearer ${token}` } })
      ));

      alert(`Sync triggered for ${sources.length} sources!`);
      setTimeout(fetchData, 2000); // Refresh after a bit
    } catch (error) {
      console.error('Sync failed', error);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50">Loading...</div>;
  }

  const handleAction = async (command: string) => {
    const token = localStorage.getItem('token');
    try {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/actions/execute`, { command }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert(res.data.message);
        setSearchOpen(false);
        setSearchQuery('');
    } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to execute command');
    }
  };

  const isCommand = (text: string) => {
    const verbs = ['comment', 'assign', 'reply', 'close'];
    return verbs.some(v => text.toLowerCase().startsWith(v));
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600">Kushim</h1>
        </div>
        <nav className="flex-1 mt-6">
          <a href="#" className="flex items-center px-6 py-3 text-gray-700 bg-gray-100 border-r-4 border-indigo-600">
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Ambient Feed
          </a>
          <a href="/sources" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50">
            <Database className="w-5 h-5 mr-3" />
            Sources
          </a>
          <a href="/activity" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50">
            <Activity className="w-5 h-5 mr-3" />
            Activity
          </a>
          <a href="/mfa/setup" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50">
            <Shield className="w-5 h-5 mr-3" />
            Security
          </a>
        </nav>
        <div className="p-4 border-t border-gray-200 text-xs text-gray-400 text-center">
          Press <kbd className="px-1.5 py-0.5 border rounded bg-gray-50 font-sans">⌘K</kbd> to search
        </div>
        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h2 className="text-xl font-semibold text-gray-800">Ambient Feed</h2>
          <div className="flex items-center space-x-4">
            <button 
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
            >
                <Search className="w-5 h-5" />
            </button>
            <button 
                onClick={handleSync}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
            >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          {contextGroups.length > 0 ? (
            <div className="space-y-8 max-w-5xl mx-auto">
              {contextGroups.map((group) => (
                <div key={group.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        Updated {new Date(group.updatedAt).toLocaleString()}
                        <span className="mx-2">•</span>
                        <LinkIcon className="w-3 h-3 mr-1" />
                        {group.members.length} artifacts
                      </div>
                    </div>
                  </div>
                  <div className="p-0">
                    {group.members.map((member, idx) => (
                      <div key={member.record.id} className={`p-4 flex items-start space-x-4 ${idx !== group.members.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50 transition group`}>
                        <div className={`p-2 rounded-lg ${
                          member.record.sourcePlatform === 'github' ? 'bg-gray-100 text-gray-700' :
                          member.record.sourcePlatform === 'jira' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          <Database className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-900 truncate pr-4">{member.record.title}</h4>
                            <a href={member.record.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 transition">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                          <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
                            <span className="flex items-center uppercase tracking-tighter font-bold text-[10px] text-gray-400">
                              {member.record.sourcePlatform}
                            </span>
                            <span className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {member.record.author}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(member.record.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="bg-white p-6 rounded-full shadow-sm border border-gray-100 mb-6">
                <Command className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your Ambient Feed is empty</h3>
              <p className="text-gray-500 max-w-sm">
                Connect data sources and sync records to see automatically discovered context groups here.
              </p>
            </div>
          )}
        </main>

        {/* Global Command Bar Overlay */}
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative z-10 border border-gray-200">
              <div className="flex items-center px-4 py-4 border-b border-gray-100">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <input 
                  autoFocus
                  placeholder="Search or type command (e.g., 'comment PROJ-123 Looks good')..."
                  className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isCommand(searchQuery)) {
                        handleAction(searchQuery);
                    }
                  }}
                />
                <div className="flex items-center space-x-1 text-[10px] text-gray-400 font-medium">
                  <kbd className="px-1.5 py-0.5 border rounded bg-gray-50">ESC</kbd>
                </div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {searchQuery.length > 0 ? (
                  <div className="p-2">
                    {records.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10).map((record) => (
                      <div key={record.id} className="p-3 hover:bg-indigo-50 rounded-xl cursor-pointer transition group flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-indigo-600">
                           <Database className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{record.title}</p>
                          <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">{record.sourcePlatform}</p>
                        </div>
                      </div>
                    ))}
                    {records.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <div className="p-8 text-center text-gray-500 italic text-sm">
                        No results found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <p className="text-sm">Start typing to search across all platforms...</p>
                  </div>
                )}
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400">
                <div className="flex items-center space-x-4">
                  <span><kbd className="px-1.5 py-0.5 border rounded bg-white mr-1">↵</kbd> Select</span>
                  <span><kbd className="px-1.5 py-0.5 border rounded bg-white mr-1">↑↓</kbd> Navigate</span>
                </div>
                <div>Kushim Search</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}