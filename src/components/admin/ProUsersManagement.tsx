'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ProAvatar } from '@/components/ui/ProAvatar';
import {
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Calendar,
  X,
  ChevronRight,
  Shield,
  User,
  ArrowLeft,
} from 'lucide-react';

interface ProUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
  department?: string | null;
  studentId?: string | null;
  subscriptionPlan: string;
  subscriptionStatus: 'active' | 'expiring_soon' | 'expired' | 'none';
  proStartDate?: string | null;
  daysSinceActivation: number;
  proExpiryDate?: string | null;
  remainingDays: number;
  isPro: boolean;
  historyCount: number;
  latestHistory?: any;
}

interface Stats {
  totalProUsers: number;
  activeProUsers: number;
  expiredProUsers: number;
  expiringSoonUsers: number;
  newlyUpgradedUsers: number;
}

export function ProUsersManagement() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';

  const [stats, setStats] = useState<Stats>({
    totalProUsers: 0,
    activeProUsers: 0,
    expiredProUsers: 0,
    expiringSoonUsers: 0,
    newlyUpgradedUsers: 0,
  });

  const [users, setUsers] = useState<ProUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const [sort, setSort] = useState('expiry_desc');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Modal States
  const [historyModalUser, setHistoryModalUser] = useState<ProUser | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [actionModal, setActionModal] = useState<{
    user: ProUser;
    type: 'renew' | 'extend' | 'expire_early' | 'set_dates';
  } | null>(null);
  const [actionDuration, setActionDuration] = useState('30');
  const [actionStartDate, setActionStartDate] = useState('');
  const [actionExpiryDate, setActionExpiryDate] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  const [manualUpgradeModal, setManualUpgradeModal] = useState(false);
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradeDuration, setUpgradeDuration] = useState('30');
  const [upgradeNotes, setUpgradeNotes] = useState('');
  const [upgradeError, setUpgradeError] = useState('');

  // Fetch PRO users & stats
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (filter !== 'all') params.set('filter', filter);
      if (sort) params.set('sort', sort);

      const res = await fetch(`/api/admin/pro-users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load PRO users:', err);
    } finally {
      setLoading(false);
    }
  }, [search, filter, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Subscription History Modal
  const openHistory = async (u: ProUser) => {
    setHistoryModalUser(u);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/pro-users/${u.id}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.histories || []);
      }
    } catch {
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Perform Subscription Action (Renew, Extend, Expire early, Set custom dates)
  const executeAction = async () => {
    if (!actionModal) return;
    setBusyId(actionModal.user.id);
    try {
      const res = await fetch(`/api/admin/pro-users/${actionModal.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionModal.type,
          durationDays: Number(actionDuration || 30),
          startDate: actionStartDate || undefined,
          expiryDate: actionExpiryDate || undefined,
          adminNotes: actionNotes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Action failed');
        return;
      }

      setActionModal(null);
      setActionNotes('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setBusyId(null);
    }
  };

  // Execute Manual Upgrade
  const handleManualUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpgradeError('');
    if (!upgradeEmail) {
      setUpgradeError('User email or ID is required.');
      return;
    }

    try {
      const res = await fetch('/api/admin/pro-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: upgradeEmail.includes('@') ? upgradeEmail : undefined,
          userId: !upgradeEmail.includes('@') ? upgradeEmail : undefined,
          durationDays: Number(upgradeDuration || 30),
          adminNotes: upgradeNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upgrade failed');
      }

      setManualUpgradeModal(false);
      setUpgradeEmail('');
      setUpgradeNotes('');
      fetchData();
    } catch (err: any) {
      setUpgradeError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              Campus PRO User Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Track subscriptions, manage renewals & extensions, monitor analytics, and enforce automatic expirations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setManualUpgradeModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Manual PRO Upgrade
        </button>
      </div>

      {/* 2. Interactive PRO Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total PRO Users */}
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'all'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
              : 'bg-white border-gray-200 hover:border-purple-200 hover:bg-purple-50/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-purple-700 mb-1">
            <span>Total PRO Users</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-gray-900">{stats.totalProUsers}</div>
          <div className="text-[11px] text-gray-400 mt-1">All members with PRO records</div>
        </button>

        {/* Active PRO Users */}
        <button
          type="button"
          onClick={() => setFilter('active')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'active'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 mb-1">
            <span>Active PRO</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-900">{stats.activeProUsers}</div>
          <div className="text-[11px] text-gray-400 mt-1">Currently valid PRO perks</div>
        </button>

        {/* Expiring Soon */}
        <button
          type="button"
          onClick={() => setFilter('expiring_soon')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'expiring_soon'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-gray-200 hover:border-amber-200 hover:bg-amber-50/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700 mb-1">
            <span>Expiring Soon</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-900">{stats.expiringSoonUsers}</div>
          <div className="text-[11px] text-gray-400 mt-1">Expires within 3 days</div>
        </button>

        {/* Expired PRO Users */}
        <button
          type="button"
          onClick={() => setFilter('expired')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'expired'
              ? 'bg-red-50/80 border-red-300 ring-2 ring-red-500/20 shadow-xs'
              : 'bg-white border-gray-200 hover:border-red-200 hover:bg-red-50/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-red-700 mb-1">
            <span>Expired PRO</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-900">{stats.expiredProUsers}</div>
          <div className="text-[11px] text-gray-400 mt-1">Revoked permissions</div>
        </button>

        {/* Newly Upgraded Users */}
        <button
          type="button"
          onClick={() => setFilter('all')}
          className="p-4 rounded-xl border text-left transition-all bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/30 col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-blue-700 mb-1">
            <span>New Upgrades</span>
            <Plus className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-900">{stats.newlyUpgradedUsers}</div>
          <div className="text-[11px] text-gray-400 mt-1">Activated in last 7 days</div>
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-3.5 border border-gray-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, student ID, department..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg p-1">
            <span className="text-gray-500 font-medium px-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {(['all', 'active', 'expiring_soon', 'expired'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md capitalize font-semibold transition-all ${
                  filter === f
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-gray-800 font-medium focus:outline-none text-xs"
            >
              <option value="expiry_desc">Expiry (Furthest first)</option>
              <option value="expiry_asc">Expiry (Soonest first)</option>
              <option value="start_desc">Start Date (Newest first)</option>
              <option value="name_asc">User Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. PRO Users Management Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">PRO Start Date</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading PRO users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No PRO users found matching your criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* User Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProAvatar
                            src={u.image}
                            name={u.name}
                            isPro={u.isPro}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                              <span>{u.name || 'User'}</span>
                              <span className="text-[10px] text-gray-400 font-mono capitalize">
                                ({u.role})
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 truncate">{u.email}</div>
                            {u.department && (
                              <div className="text-[11px] text-gray-400 truncate">
                                {u.department} {u.studentId ? `• ID: ${u.studentId}` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* PRO Start Date */}
                      <td className="px-4 py-3">
                        {u.proStartDate ? (
                          <div>
                            <div className="font-medium text-gray-800">
                              {new Date(u.proStartDate).toLocaleDateString()}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {u.daysSinceActivation === 0
                                ? 'Activated today'
                                : `${u.daysSinceActivation} days ago`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No start date</span>
                        )}
                      </td>

                      {/* Expiry Date & Remaining */}
                      <td className="px-4 py-3">
                        {u.proExpiryDate ? (
                          <div>
                            <div className="font-medium text-gray-800">
                              {new Date(u.proExpiryDate).toLocaleDateString()}
                            </div>
                            <div
                              className={`text-[11px] font-semibold ${
                                u.isPro
                                  ? u.remainingDays <= 3
                                    ? 'text-amber-600'
                                    : 'text-emerald-600'
                                  : 'text-red-500'
                              }`}
                            >
                              {u.isPro
                                ? `${u.remainingDays} days remaining`
                                : 'Expired'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No expiry date</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3">
                        {u.isPro ? (
                          u.remainingDays <= 3 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" /> Expiring Soon
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Active PRO
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3" /> Expired
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* History */}
                          <button
                            type="button"
                            onClick={() => openHistory(u)}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="View Subscription History"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Extend / Renew */}
                          <button
                            type="button"
                            onClick={() => {
                              setActionModal({ user: u, type: u.isPro ? 'extend' : 'renew' });
                              setActionDuration(u.isPro ? '7' : '30');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                          >
                            {u.isPro ? '+ Extend' : 'Renew'}
                          </button>

                          {/* Set Custom Dates */}
                          <button
                            type="button"
                            onClick={() => {
                              setActionModal({ user: u, type: 'set_dates' });
                              setActionStartDate(
                                u.proStartDate
                                  ? new Date(u.proStartDate).toISOString().split('T')[0]
                                  : ''
                              );
                              setActionExpiryDate(
                                u.proExpiryDate
                                  ? new Date(u.proExpiryDate).toISOString().split('T')[0]
                                  : ''
                              );
                            }}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Set Exact Start/Expiry Dates"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>

                          {/* Expire Early */}
                          {u.isPro && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionModal({ user: u, type: 'expire_early' });
                              }}
                              className="px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Expire Immediately"
                            >
                              Expire
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription History Modal */}
      {historyModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-gray-900">Subscription History</h3>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalUser(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-gray-600 bg-purple-50 p-3 rounded-xl border border-purple-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900">{historyModalUser.name}</div>
                <div>{historyModalUser.email}</div>
              </div>
              <div className="text-right">
                <span className="font-semibold text-purple-700">
                  {historyModalUser.isPro ? 'Active PRO' : 'Expired'}
                </span>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {historyLoading ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-purple-500" />
                  Loading history...
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs italic">
                  No subscription history recorded yet.
                </div>
              ) : (
                historyList.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 border border-gray-200 rounded-xl bg-gray-50/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="capitalize text-gray-900">{h.action.replace('_', ' ')}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-bold ${
                          h.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {h.status}
                      </span>
                    </div>
                    <div className="text-gray-500">
                      Duration: {h.packageDuration ? `${h.packageDuration} days` : 'Custom'} •{' '}
                      {new Date(h.startDate).toLocaleDateString()} &rarr;{' '}
                      {new Date(h.endDate).toLocaleDateString()}
                    </div>
                    {h.adminNotes && (
                      <div className="text-[11px] text-gray-600 italic">Notes: {h.adminNotes}</div>
                    )}
                    <div className="text-[10px] text-gray-400 pt-0.5">
                      Recorded on {new Date(h.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setHistoryModalUser(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal (Renew, Extend, Expire early, Set dates) */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 capitalize flex items-center gap-2">
                {actionModal.type === 'expire_early' ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-500" />
                )}
                {actionModal.type.replace('_', ' ')}: {actionModal.user.name}
              </h3>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionModal.type === 'expire_early' ? (
              <p className="text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-200">
                Are you sure you want to expire this PRO subscription immediately? The user will immediately lose the PRO badge and all exclusive calling permissions.
              </p>
            ) : actionModal.type === 'set_dates' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">PRO Start Date</label>
                  <input
                    type="date"
                    value={actionStartDate}
                    onChange={(e) => setActionStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">PRO Expiry Date</label>
                  <input
                    type="date"
                    value={actionExpiryDate}
                    onChange={(e) => setActionExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <label className="block font-medium text-gray-700 mb-1">Duration (Days)</label>
                <select
                  value={actionDuration}
                  onChange={(e) => setActionDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                >
                  <option value="7">7 Days (+1 Week)</option>
                  <option value="15">15 Days</option>
                  <option value="30">30 Days (1 Month)</option>
                  <option value="90">90 Days (1 Term)</option>
                  <option value="180">180 Days (Half Year)</option>
                  <option value="365">365 Days (1 Full Year)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Admin Notes / Reason
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Optional explanation for audit logging..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs h-16 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeAction}
                disabled={busyId === actionModal.user.id}
                className={`px-4 py-2 text-white text-xs font-semibold rounded-lg transition-all ${
                  actionModal.type === 'expire_early'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                {busyId === actionModal.user.id ? 'Saving...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual PRO Upgrade Modal */}
      {manualUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleManualUpgrade}
            className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Manual Campus PRO Upgrade
              </h3>
              <button
                type="button"
                onClick={() => setManualUpgradeModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {upgradeError && (
              <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
                {upgradeError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  User Email or User ID *
                </label>
                <input
                  type="text"
                  required
                  value={upgradeEmail}
                  onChange={(e) => setUpgradeEmail(e.target.value)}
                  placeholder="e.g. student@baust.edu.bd or cuid"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  PRO Package Duration
                </label>
                <select
                  value={upgradeDuration}
                  onChange={(e) => setUpgradeDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                >
                  <option value="7">7 Days (Weekly Test / Promotion)</option>
                  <option value="30">30 Days (Standard Monthly)</option>
                  <option value="90">90 Days (Term Package)</option>
                  <option value="180">180 Days (Half Year)</option>
                  <option value="365">365 Days (Annual Membership)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Admin Reason</label>
                <textarea
                  value={upgradeNotes}
                  onChange={(e) => setUpgradeNotes(e.target.value)}
                  placeholder="e.g. Campus ambassador promotion or verified seller bonus..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs h-16 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setManualUpgradeModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Activate PRO
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
