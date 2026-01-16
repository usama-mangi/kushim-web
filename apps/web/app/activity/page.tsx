'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Database, Activity as ActivityIcon, 
  LogOut, Shield, Search, Filter, ArrowUpRight, Clock, User
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/audit`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLogs(response.data);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          alert('Access Denied: Admin role required');
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.resource.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.email.toLowerCase().includes(search.toLowerCase())
  );

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
          <button className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl transition-all" title="Audit Logs">
            <ActivityIcon className="w-6 h-6" />
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
            <h1 className="text-xl font-bold text-white tracking-tight">Security Audit</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">Full action traceability</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition" />
              <input 
                type="text" 
                placeholder="Filter logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none w-64 transition-all"
              />
            </div>
            <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 scrollbar-hide">
          <div className="max-w-6xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Event Timeline</th>
                    <th className="px-6 py-4">Principal</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Resource Identifier</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-200">{new Date(log.createdAt).toLocaleDateString()}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                            <User className="w-3 h-3 text-slate-400" />
                          </div>
                          <span className="text-sm font-semibold text-slate-300">{log.user?.email || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                          log.action.includes('FAIL') ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          log.action.includes('SYNC') ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                          "bg-slate-800 text-slate-400 border border-slate-700"
                        )}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-xs text-slate-400 font-mono bg-slate-950/50 px-2 py-1 rounded border border-slate-800 w-fit">
                          {log.resource}
                          <ArrowUpRight className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 font-medium">IP: {log.ipAddress || 'Internal'}</span>
                          {log.payload?.error && <span className="text-[10px] text-red-400 truncate max-w-[150px]">{log.payload.error}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLogs.length === 0 && (
                <div className="py-20 text-center text-slate-500 italic text-sm">
                  No matching audit entries found.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}