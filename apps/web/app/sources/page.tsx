'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Database, Activity, LogOut, Shield, Key } from 'lucide-react';

export default function SourcesPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchSources = async () => {
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

    fetchSources();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const startEditing = (source: any) => {
    setEditingId(source.id);
    setFormData({}); // Reset form
  };

  const handleSave = async (sourceId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/ingestion/sources/${sourceId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Credentials updated successfully');
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update credentials', error);
      alert('Failed to update credentials');
    }
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
          <a href="/sources" className="flex items-center px-6 py-3 text-gray-700 bg-gray-100 border-r-4 border-indigo-600">
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
          <h2 className="text-xl font-semibold text-gray-800">Data Sources</h2>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sources.map((source) => (
              <div key={source.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold capitalize">{source.providerName}</h3>
                    <p className="text-sm text-gray-500">ID: {source.id.slice(0, 8)}...</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${source.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {source.status}
                  </span>
                </div>

                {editingId === source.id ? (
                  <div className="space-y-3 mt-4">
                    {source.providerName === 'github' && (
                      <input
                        type="password"
                        placeholder="Personal Access Token"
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                      />
                    )}
                    {source.providerName === 'slack' && (
                      <input
                        type="password"
                        placeholder="User Token (xoxp-...)"
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                      />
                    )}
                    {source.providerName === 'jira' && (
                      <>
                        <input
                          type="text"
                          placeholder="Host (https://domain.atlassian.net)"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <input
                          type="password"
                          placeholder="API Token"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                        />
                      </>
                    )}
                    <div className="flex space-x-2">
                      <button onClick={() => handleSave(source.id)} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700">Save</button>
                      <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-200">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => startEditing(source)} className="w-full mt-4 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                    <Key className="w-4 h-4 mr-2" />
                    Edit Credentials
                  </button>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
