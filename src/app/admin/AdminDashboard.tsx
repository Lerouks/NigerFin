'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, BookOpen, BarChart3, Shield, Loader2, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface UserStats {
  total: number;
  readers: number;
  standard: number;
  pro: number;
}

interface UserEntry {
  id: string;
  email: string;
  full_name: string;
  role: string;
  subscription_status: string;
  created_at: string;
}

export function AdminDashboard() {
  const { isSignedIn, isLoading, userRole } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  const [stats, setStats] = useState<UserStats>({ total: 0, readers: 0, standard: 0, pro: 0 });
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isLoading && (!isSignedIn || userRole !== 'admin')) {
      router.push('/');
    }
  }, [isLoading, isSignedIn, userRole, router]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetch('/api/admin/stats')
        .then((r) => r.json())
        .then((data) => setStats(data))
        .catch(() => {});

      fetch('/api/admin/users')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setUsers(data);
          setLoadingData(false);
        })
        .catch(() => setLoadingData(false));
    }
  }, [userRole]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  if (isLoading || userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const conversionRate = stats.total > 0
    ? (((stats.standard + stats.pro) / stats.total) * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-red-400" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-8">
          {[
            { id: 'overview' as const, label: 'Aperçu', icon: BarChart3 },
            { id: 'users' as const, label: 'Utilisateurs', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] transition-all ${
                activeTab === tab.id ? 'bg-[#111] text-white' : 'bg-white border border-black/[0.06] text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Total utilisateurs" value={stats.total.toString()} color="bg-blue-50 text-blue-600" />
              <StatCard label="Lecteurs (gratuit)" value={stats.readers.toString()} color="bg-gray-50 text-gray-600" />
              <StatCard label="Standard" value={stats.standard.toString()} color="bg-amber-50 text-amber-600" />
              <StatCard label="Pro" value={stats.pro.toString()} color="bg-purple-50 text-purple-600" />
            </div>

            <div className="bg-white rounded-xl border border-black/[0.06] p-6">
              <h3 className="font-semibold mb-4">Taux de conversion</h3>
              <div className="flex items-end gap-4">
                <span className="text-4xl font-bold">{conversionRate}%</span>
                <span className="text-sm text-gray-500 mb-1">des utilisateurs sont abonnés payants</span>
              </div>
              <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#111] rounded-full transition-all"
                  style={{ width: `${conversionRate}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {loadingData ? (
              <div className="text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-black/[0.04]">
                      <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Utilisateur</th>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Rôle</th>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Statut</th>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Inscrit le</th>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-black/[0.03] last:border-0">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{u.full_name || '—'}</p>
                          <p className="text-[12px] text-gray-400">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] uppercase tracking-wider px-2 py-1 rounded ${
                            u.role === 'pro' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'standard' ? 'bg-amber-100 text-amber-700' :
                            u.role === 'admin' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[12px] ${u.subscription_status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                            {u.subscription_status === 'active' ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-gray-500">
                          {new Date(u.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="text-[12px] border border-gray-200 rounded px-2 py-1 bg-white"
                          >
                            <option value="reader">Reader</option>
                            <option value="standard">Standard</option>
                            <option value="pro">Pro</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <p className="text-center py-8 text-sm text-gray-400">Aucun utilisateur trouvé</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-black/[0.06] p-5">
      <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color.split(' ')[1]}`}>{value}</p>
    </div>
  );
}
