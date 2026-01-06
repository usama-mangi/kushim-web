'use client';

import { useDashboardStore } from '@/store/useStore';
import { useSocket } from '@/hooks/useSocket';
import { useEffect } from 'react';
import { LayoutDashboard, Database, RefreshCw, Activity } from 'lucide-react';

export default function Home() {
  const { records, setRecords } = useDashboardStore();
  useSocket();

  useEffect(() => {
    // Mock initial data fetch
    setRecords([
      { id: '1', payload: { name: 'Sample Repo', stars: 120 }, checksum: 'abc' },
      { id: '2', payload: { name: 'Another Project', stars: 45 }, checksum: 'def' },
    ]);
  }, [setRecords]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600">Kushim</h1>
        </div>
        <nav className="mt-6">
          <a href="#" className="flex items-center px-6 py-3 text-gray-700 bg-gray-100 border-r-4 border-indigo-600">
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </a>
          <a href="#" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50">
            <Database className="w-5 h-5 mr-3" />
            Sources
          </a>
          <a href="#" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50">
            <Activity className="w-5 h-5 mr-3" />
            Activity
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h2 className="text-xl font-semibold text-gray-800">Unified Dashboard</h2>
          <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Now
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Records</p>
              <p className="text-3xl font-bold text-gray-900">{records.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Active Sources</p>
              <p className="text-3xl font-bold text-gray-900">1</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">System Health</p>
              <p className="text-3xl font-bold text-green-500">100%</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Aggregated Records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">ID</th>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Stars</th>
                    <th className="px-6 py-4 font-medium">Checksum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-600">{record.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.payload.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.payload.stars}</td>
                      <td className="px-6 py-4 text-sm text-gray-400 font-mono truncate max-w-[100px]">{record.checksum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}