'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Database, Activity as ActivityIcon, LogOut, Shield } from 'lucide-react';

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
        console.error('Failed to fetch audit logs', error);
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

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600">Kushim</h1>
        </div>
        <nav className="flex-1 mt-6">
          <a href="/" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50">
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </a>
          <a href="/sources" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50">
            <Database className="w-5 h-5 mr-3" />
            Sources
          </a>
          <a href="/activity" className="flex items-center px-6 py-3 text-gray-700 bg-gray-100 border-r-4 border-indigo-600">
            <ActivityIcon className="w-5 h-5 mr-3" />
            Activity
          </a>
          <a href="/mfa/setup" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50">
            <Shield className="w-5 h-5 mr-3" />
            Security
          </a>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-indigo-600" />
            Audit Logs
          </h2>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm font-medium uppercase tracking-wider">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Resource</th>
                  <th className="px-6 py-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {log.user?.email || 'Anonymous'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        log.action === 'GET' ? 'bg-blue-100 text-blue-700' :
                        log.action === 'POST' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {log.resource}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
