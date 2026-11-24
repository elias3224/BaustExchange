'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, timeAgo } from '@/lib/utils';
import { ProAvatar } from '@/components/ui/ProAvatar';
import { isActualProSubscription } from '@/lib/pro';
import {
  CreditCard,
  IdCard,
  Package,
  Users,
  Flag,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  Lock,
  History,
  Shield,
  Filter,
  Sparkles,
  Clock,
  ArrowRight,
  UserPlus,
  Loader2,
} from 'lucide-react';

interface AdminDashboardClientProps {
  stats: {
    pendingPayments: number;
    pendingIdCount: number;
    pendingCount: number;
    activeCount: number;
    userCount: number;
    pendingReports: number;
  };
  payments: any[];
  idCards: any[];
  pendingListings: any[];
  activeListings: any[];
  users: any[];
  reports: any[];
  currentUser: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    isSuperAdmin?: boolean;
    adminPermissions?: string[];
  };
}

type CardType = 'payments' | 'idCards' | 'pendingListings' | 'activeListings' | 'users' | 'reports' | null;

export function AdminDashboardClient({
  stats,
  payments: initialPayments,
  idCards: initialIdCards,
  pendingListings: initialPendingListings,
  activeListings: initialActiveListings,
  users: initialUsers,
  reports: initialReports,
  currentUser,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState<CardType>('payments');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cards' | 'logs' | 'permissions'>('cards');

  // Preview Document Modal (Image or PDF)
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  // Edit Permissions Modal
  const [editingUserPerms, setEditingUserPerms] = useState<any | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedLogDetail, setSelectedLogDetail] = useState<any | null>(null);

  // Make Admin Modal state
  const [makeAdminModalOpen, setMakeAdminModalOpen] = useState(false);
  const [makeAdminSearch, setMakeAdminSearch] = useState('');
  const [makeAdminSearching, setMakeAdminSearching] = useState(false);
  const [makeAdminResults, setMakeAdminResults] = useState<any[]>([]);
  const [selectedUserToPromote, setSelectedUserToPromote] = useState<any | null>(null);
  const [promotePermissions, setPromotePermissions] = useState<string[]>([
    'manage_users',
    'manage_payments',
    'verify_students',
    'manage_listings',
    'manage_reports',
    'view_analytics',
  ]);

  const isSuperAdmin = currentUser.isSuperAdmin || currentUser.email === 'eliasahmad3224@gmail.com';

  const nowTime = Date.now();
  const threeDaysTime = nowTime + 3 * 24 * 60 * 60 * 1000;
  const sevenDaysTime = nowTime - 7 * 24 * 60 * 60 * 1000;

  const proStats = useMemo(() => {
    let totalPro = 0;
    let activePro = 0;
    let expiredPro = 0;
    let expiringSoon = 0;
    let newlyUpgraded = 0;

    initialUsers.forEach((u: any) => {
      const isProPlan = u.subscriptionPlan === 'pro' || u.subscriptionStatus === 'active' || u.subscriptionStatus === 'expired';
      const hasExpiry = Boolean(u.subscriptionExpires);
      const expTime = hasExpiry ? new Date(u.subscriptionExpires).getTime() : 0;
      const startTime = u.subscriptionStartedAt ? new Date(u.subscriptionStartedAt).getTime() : 0;

      if (isProPlan || hasExpiry) {
        totalPro++;
      }

      if (u.subscriptionPlan === 'pro' && expTime > nowTime) {
        activePro++;
        if (expTime <= threeDaysTime) {
          expiringSoon++;
        }
      } else if (u.subscriptionPlan === 'pro' && expTime <= nowTime) {
        expiredPro++;
      }

      if (startTime >= sevenDaysTime) {
        newlyUpgraded++;
      }
    });

    return { totalPro, activePro, expiredPro, expiringSoon, newlyUpgraded };
  }, [initialUsers, nowTime, threeDaysTime, sevenDaysTime]);

  async function handleAction(url: string, body: any = {}, method = 'PATCH') {
    setBusyId(url);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'DELETE' && method !== 'GET' ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Action failed');
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  const ALL_ADMIN_PERMISSIONS = [
    { id: 'manage_users', label: 'Manage Users (Block, Unblock, Roles)' },
    { id: 'manage_payments', label: 'Manage Payments (Approve/Reject)' },
    { id: 'verify_students', label: 'Verify Student IDs' },
    { id: 'manage_listings', label: 'Manage Listings (Approve/Remove)' },
    { id: 'manage_reports', label: 'Manage Reports' },
    { id: 'view_analytics', label: 'View Platform Analytics' },
  ];

  async function searchUsersForAdmin(query: string) {
    setMakeAdminSearch(query);
    if (!query.trim()) {
      setMakeAdminResults([]);
      return;
    }
    setMakeAdminSearching(true);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setMakeAdminResults(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMakeAdminSearching(false);
    }
  }

  function openPromoteModalForUser(u: any) {
    setSelectedUserToPromote(u);
    setPromotePermissions(
      u.adminPermissions && u.adminPermissions.length > 0
        ? u.adminPermissions
        : ALL_ADMIN_PERMISSIONS.map((p) => p.id)
    );
    setMakeAdminModalOpen(true);
  }

  async function handleMakeAdmin(targetUser?: any) {
    const userToPromote = targetUser || selectedUserToPromote;
    if (!userToPromote) return;
    setBusyId(`promote-${userToPromote.id}`);
    try {
      const res = await fetch(`/api/admin/users/${userToPromote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'admin',
          adminPermissions: promotePermissions,
          reason: `Promoted to Admin by ${currentUser.name || currentUser.email || 'Admin'}`,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to make admin');
      } else {
        setMakeAdminModalOpen(false);
        setSelectedUserToPromote(null);
        setMakeAdminSearch('');
        setMakeAdminResults([]);
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to make admin');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveAdmin(u: any) {
    if (!confirm(`Are you sure you want to revoke admin rights for ${u.name || u.email}?`)) return;
    setBusyId(`demote-${u.id}`);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'student',
          adminPermissions: [],
          reason: `Admin rights revoked by ${currentUser.name || currentUser.email || 'Admin'}`,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to revoke admin');
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to revoke admin');
    } finally {
      setBusyId(null);
    }
  }

  // Load audit logs
  async function loadAuditLogs() {
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?q=${encodeURIComponent(auditSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch {}
    finally {
      setAuditLoading(false);
    }
  }

  // Save permissions
  async function savePermissions() {
    if (!editingUserPerms) return;
    setBusyId('perms');
    try {
      const res = await fetch(`/api/admin/users/${editingUserPerms.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPermissions: selectedPerms,
          reason: 'Super Admin updated admin permissions',
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update permissions');
      } else {
        setEditingUserPerms(null);
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const statCards = [
    {
      id: 'payments' as CardType,
      label: 'Pending Payments',
      count: stats.pendingPayments,
      icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
      color: 'border-emerald-500 bg-emerald-50/20 ring-emerald-500/20',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'idCards' as CardType,
      label: 'Pending Student IDs',
      count: stats.pendingIdCount,
      icon: <IdCard className="w-5 h-5 text-amber-600" />,
      color: 'border-amber-500 bg-amber-50/20 ring-amber-500/20',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'pendingListings' as CardType,
      label: 'Pending Listings',
      count: stats.pendingCount,
      icon: <Package className="w-5 h-5 text-orange-600" />,
      color: 'border-orange-500 bg-orange-50/20 ring-orange-500/20',
      badgeColor: 'bg-orange-100 text-orange-800',
    },
    {
      id: 'activeListings' as CardType,
      label: 'Active Listings',
      count: stats.activeCount,
      icon: <Package className="w-5 h-5 text-blue-600" />,
      color: 'border-blue-500 bg-blue-50/20 ring-blue-500/20',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'users' as CardType,
      label: 'Total Users',
      count: stats.userCount,
      icon: <Users className="w-5 h-5 text-purple-600" />,
      color: 'border-purple-500 bg-purple-50/20 ring-purple-500/20',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'reports' as CardType,
      label: 'Pending Reports',
      count: stats.pendingReports,
      icon: <Flag className="w-5 h-5 text-red-600" />,
      color: 'border-red-500 bg-red-50/20 ring-red-500/20',
      badgeColor: 'bg-red-100 text-red-800',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Bar with Super Admin Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Control Center</h1>
            {isSuperAdmin && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                ★ Super Admin
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Live platform statistics, moderation, verification, and audit logs.</p>
        </div>

        {/* View Switcher / Navigation */}
        <div className="w-full sm:w-auto overflow-x-auto scrollbar-none py-0.5 -mx-1 px-1 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl w-max sm:w-auto">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'cards' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dashboard
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => {
                  setActiveTab('logs');
                  loadAuditLogs();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1 ${
                  activeTab === 'logs' ? 'bg-white text-purple-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <History className="w-3.5 h-3.5" /> Audit Logs
              </button>
            )}
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1 ${
                activeTab === 'permissions' ? 'bg-white text-purple-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Admin Team
            </button>
            <Link
              href="/admin/pro-users"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs hover:from-amber-600 hover:to-rose-600"
            >
              <Sparkles className="w-3.5 h-3.5" /> PRO Management
            </Link>
          </div>
        </div>
      </div>

      {activeTab === 'cards' && (
        <>
          {/* Clickable PRO Statistics Section */}
          <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-200/80 rounded-2xl p-3.5 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                <h2 className="font-bold text-gray-900 text-sm sm:text-base">Campus PRO Analytics & Membership</h2>
                <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                  Live Stats
                </span>
              </div>
              <Link
                href="/admin/pro-users"
                className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 hover:underline"
              >
                Open PRO User Management <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Total PRO Users */}
              <Link
                href="/admin/pro-users?filter=all"
                className="p-3 sm:p-3.5 bg-white border border-purple-200 hover:border-purple-400 rounded-xl transition-all shadow-2xs hover:shadow-xs group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-purple-700 mb-1">
                  <span>Total PRO</span>
                  <Sparkles className="w-3.5 h-3.5 text-purple-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">{proStats.totalPro}</div>
                <div className="text-[10px] text-gray-400 mt-1 truncate">All PRO members &rarr;</div>
              </Link>

              {/* Active PRO Users */}
              <Link
                href="/admin/pro-users?filter=active"
                className="p-3 sm:p-3.5 bg-white border border-emerald-200 hover:border-emerald-400 rounded-xl transition-all shadow-2xs hover:shadow-xs group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 mb-1">
                  <span>Active PRO</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-900">{proStats.activePro}</div>
                <div className="text-[10px] text-emerald-600 mt-1 font-medium truncate">Active perks &rarr;</div>
              </Link>

              {/* Expiring Soon */}
              <Link
                href="/admin/pro-users?filter=expiring_soon"
                className="p-3 sm:p-3.5 bg-white border border-amber-200 hover:border-amber-400 rounded-xl transition-all shadow-2xs hover:shadow-xs group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-amber-700 mb-1">
                  <span>Expiring Soon</span>
                  <Clock className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-900">{proStats.expiringSoon}</div>
                <div className="text-[10px] text-amber-600 mt-1 font-medium truncate">≤ 3 days left &rarr;</div>
              </Link>

              {/* Expired PRO Users */}
              <Link
                href="/admin/pro-users?filter=expired"
                className="p-3 sm:p-3.5 bg-white border border-red-200 hover:border-red-400 rounded-xl transition-all shadow-2xs hover:shadow-xs group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-red-700 mb-1">
                  <span>Expired PRO</span>
                  <XCircle className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-red-900">{proStats.expiredPro}</div>
                <div className="text-[10px] text-red-600 mt-1 font-medium truncate">Expired &rarr;</div>
              </Link>

              {/* Newly Upgraded PRO Users */}
              <Link
                href="/admin/pro-users?filter=all"
                className="p-3 sm:p-3.5 bg-white border border-blue-200 hover:border-blue-400 rounded-xl transition-all shadow-2xs hover:shadow-xs col-span-2 sm:col-span-1 group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-blue-700 mb-1">
                  <span>New Upgrades</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-blue-900">{proStats.newlyUpgraded}</div>
                <div className="text-[10px] text-blue-600 mt-1 font-medium truncate">Last 7 days &rarr;</div>
              </Link>
            </div>
          </div>
          {/* 6 Live Statistics Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
            {statCards.map((card) => {
              const isSelected = selectedCard === card.id;
              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedCard(isSelected ? null : card.id)}
                  className={`cursor-pointer p-3 sm:p-4 rounded-2xl border-2 transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? `${card.color} ring-2 shadow-sm`
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <div className="p-1.5 sm:p-2 rounded-xl bg-gray-50 border border-gray-100">{card.icon}</div>
                    {isSelected ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{card.count}</div>
                    <div className="text-[11px] sm:text-xs font-semibold text-gray-600 truncate mt-0.5">{card.label}</div>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-gray-400 mt-1.5 sm:mt-2 font-medium">Click to expand data</div>
                </div>
              );
            })}
          </div>

          {/* Interactive Click-to-Expand Data Table Section */}
          {selectedCard && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3.5 sm:p-6 space-y-4 animate-in fade-in duration-200">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 capitalize">
                    {selectedCard === 'payments' && 'Pending Subscription & Pin Payments'}
                    {selectedCard === 'idCards' && 'Pending Student ID Verifications'}
                    {selectedCard === 'pendingListings' && 'Listings Awaiting Approval'}
                    {selectedCard === 'activeListings' && 'Active Campus Marketplace Listings'}
                    {selectedCard === 'users' && 'BAUST Registered Users Directory'}
                    {selectedCard === 'reports' && 'Pending Item & User Reports'}
                  </h2>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Search input */}
                  <div className="relative flex-1 sm:flex-initial">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter records..."
                      className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 w-full sm:w-56"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <button
                    onClick={() => setSelectedCard(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
                    title="Collapse section"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Data Content */}
              <div>
                {/* 1. Payments Table */}
                {selectedCard === 'payments' && (
                  <div className="space-y-3">
                    {initialPayments.length === 0 ? (
                      <p className="text-sm text-gray-500 py-6 text-center">No pending payments.</p>
                    ) : (
                      initialPayments
                        .filter((p) =>
                          searchQuery
                            ? p.trxId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              p.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              p.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
                            : true
                        )
                        .map((p) => (
                          <div
                            key={p.id}
                            className="p-3 sm:p-4 border border-gray-200 rounded-xl bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                          >
                            <div className="w-full sm:w-auto min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-gray-900">{p.paymentMethod}</span>
                                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
                                  ৳{p.amount}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-amber-100 text-amber-800">
                                  {p.status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mt-1 break-words">
                                User: <strong>{p.user?.name}</strong> ({p.user?.email}) • Phone: <span className="font-mono">{p.senderPhone}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5 font-mono break-all">
                                TrxID: <span className="font-bold text-gray-800 uppercase">{p.trxId}</span> • Type: {p.type} • {timeAgo(p.createdAt)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                              <button
                                onClick={() => handleAction(`/api/admin/payments/${p.id}`, { status: 'approved' })}
                                disabled={busyId === `/api/admin/payments/${p.id}`}
                                className="flex-1 sm:flex-initial text-center justify-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-xs disabled:opacity-50"
                              >
                                Approve & Activate
                              </button>
                              <button
                                onClick={() => handleAction(`/api/admin/payments/${p.id}`, { status: 'rejected' })}
                                disabled={busyId === `/api/admin/payments/${p.id}`}
                                className="flex-1 sm:flex-initial text-center justify-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-bold text-xs disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {/* 2. Pending Student IDs */}
                {selectedCard === 'idCards' && (
                  <div className="space-y-3">
                    {initialIdCards.length === 0 ? (
                      <p className="text-sm text-gray-500 py-6 text-center">No pending student ID requests.</p>
                    ) : (
                      initialIdCards.map((u) => {
                        const isPdf = u.idCardUrl?.toLowerCase().endsWith('.pdf');
                        return (
                          <div
                            key={u.id}
                            className="p-3 sm:p-4 border border-amber-200 rounded-xl bg-amber-50/30 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between"
                          >
                            <div className="flex items-start sm:items-center gap-3 w-full sm:w-auto min-w-0">
                              {/* Thumbnail preview button */}
                              <button
                                type="button"
                                onClick={() => setPreviewDocUrl(u.idCardUrl)}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-brand-500 transition-all shrink-0"
                                title="Click to view full document"
                              >
                                {isPdf ? (
                                  <div className="text-center p-1 text-red-600">
                                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 mx-auto" />
                                    <span className="text-[9px] font-bold block uppercase">PDF</span>
                                  </div>
                                ) : u.idCardUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={u.idCardUrl} alt="ID preview" className="w-full h-full object-cover" />
                                ) : (
                                  <IdCard className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                                )}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-gray-900 truncate">{u.name}</div>
                                <div className="text-xs text-gray-600 break-words">
                                  {u.email}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: <strong className="font-mono">{u.studentId || 'N/A'}</strong>
                                  {u.department ? ` • Dept: ${u.department}` : ''}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-0.5">Submitted {timeAgo(u.updatedAt)}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/60">
                              <button
                                type="button"
                                onClick={() => setPreviewDocUrl(u.idCardUrl)}
                                className="flex-1 sm:flex-initial text-center justify-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" /> Inspect
                              </button>

                              <button
                                onClick={() => handleAction(`/api/admin/users/${u.id}`, { idCardAction: 'approve' })}
                                disabled={busyId === `/api/admin/users/${u.id}`}
                                className="flex-1 sm:flex-initial text-center justify-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                              >
                                Verify
                              </button>

                              <button
                                onClick={() =>
                                  handleAction(`/api/admin/users/${u.id}`, {
                                    idCardAction: 'reject',
                                    idCardRejectReason: 'Document image was unreadable or does not match student ID.',
                                  })
                                }
                                disabled={busyId === `/api/admin/users/${u.id}`}
                                className="flex-1 sm:flex-initial text-center justify-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 3. Pending Listings */}
                {selectedCard === 'pendingListings' && (
                  <div className="space-y-3">
                    {initialPendingListings.length === 0 ? (
                      <p className="text-sm text-gray-500 py-6 text-center">No listings waiting for review.</p>
                    ) : (
                      initialPendingListings.map((l) => (
                        <div
                          key={l.id}
                          className="p-3 sm:p-4 border border-gray-200 rounded-xl bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0 w-full sm:w-auto">
                            <div className="text-sm font-bold text-gray-900 truncate">{l.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5 break-words">
                              Category: {l.category?.name} • By: {l.user?.name} ({l.user?.email}) • ID: {l.customId || l.id}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                            <button
                              onClick={() => handleAction(`/api/admin/listings/${l.id}`, { action: 'approve' })}
                              className="flex-1 sm:flex-initial text-center justify-center px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(`/api/admin/listings/${l.id}`, { action: 'reject' })}
                              className="flex-1 sm:flex-initial text-center justify-center px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-xs font-bold"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 4. Active Listings */}
                {selectedCard === 'activeListings' && (
                  <div className="space-y-3">
                    {initialActiveListings.length === 0 ? (
                      <p className="text-sm text-gray-500 py-6 text-center">No active listings.</p>
                    ) : (
                      initialActiveListings.map((l) => (
                        <div
                          key={l.id}
                          className="p-3 border border-gray-200 rounded-xl bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0 w-full sm:w-auto">
                            <Link href={`/item/${l.id}`} className="text-sm font-bold text-gray-900 hover:underline truncate block">
                              {l.title}
                            </Link>
                            <div className="text-xs text-gray-500 mt-0.5 break-words">
                              ID: {l.customId || l.id} • {formatPrice(l.price || 0)} • Poster: {l.user?.name}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                            <Link
                              href={`/item/${l.id}`}
                              className="flex-1 sm:flex-initial text-center justify-center px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleAction(`/api/admin/listings/${l.id}`, { action: 'remove' })}
                              className="flex-1 sm:flex-initial text-center justify-center px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 5. Total Users Directory */}
                {selectedCard === 'users' && (
                  <div className="space-y-2 max-h-[30rem] overflow-y-auto">
                    {initialUsers
                      .filter((u) =>
                        searchQuery
                          ? u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                          : true
                      )
                      .map((u) => {
                        const isSelf = u.id === currentUser.id;
                        const isSuper = u.isSuperAdmin || u.email === 'eliasahmad3224@gmail.com';
                        return (
                          <div
                            key={u.id}
                            className="p-3 border border-gray-200 rounded-xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <ProAvatar
                                src={u.image}
                                name={u.name}
                                isPro={isActualProSubscription(u)}
                                size="sm"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate">{u.name || 'User'}</span>
                                  {isSuper && (
                                    <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-800 font-bold rounded shrink-0">
                                      ★ Super Admin
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500 capitalize shrink-0">({u.role})</span>
                                </div>
                                <div className="text-xs text-gray-500 truncate mt-0.5">
                                  {u.email} • {u.department || 'No Dept'} • Listings: {u._count?.listings || 0}
                                </div>
                              </div>
                            </div>

                            {/* User Actions */}
                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                              {u.role === 'admin' ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingUserPerms(u);
                                      setSelectedPerms(u.adminPermissions || []);
                                    }}
                                    className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg"
                                  >
                                    Permissions
                                  </button>
                                  {!isSuper && !isSelf && (
                                    <button
                                      onClick={() => handleRemoveAdmin(u)}
                                      disabled={busyId === `demote-${u.id}`}
                                      className="px-2.5 py-1 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 rounded-lg disabled:opacity-50"
                                    >
                                      Remove Admin
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button
                                  onClick={() => openPromoteModalForUser(u)}
                                  className="px-2.5 py-1 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-1 shadow-2xs"
                                >
                                  <UserPlus className="w-3.5 h-3.5" /> Make Admin
                                </button>
                              )}

                              {!isSelf && !isSuper && (
                                <>
                                  {u.status === 'active' ? (
                                    <button
                                      onClick={() => handleAction(`/api/admin/users/${u.id}`, { status: 'blocked' })}
                                      className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg"
                                    >
                                      Block
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleAction(`/api/admin/users/${u.id}`, { status: 'active' })}
                                      className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg"
                                    >
                                      Unblock
                                    </button>
                                  )}

                                  {u.role !== 'teacher' && u.role !== 'admin' && (
                                    <button
                                      onClick={() => handleAction(`/api/admin/users/${u.id}`, { role: 'teacher' })}
                                      className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                                    >
                                      Make Teacher
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* 6. Reports */}
                {selectedCard === 'reports' && (
                  <div className="space-y-3">
                    {initialReports.length === 0 ? (
                      <p className="text-sm text-gray-500 py-6 text-center">No reports filed.</p>
                    ) : (
                      initialReports.map((r) => (
                        <div
                          key={r.id}
                          className="p-3 sm:p-4 border border-gray-200 rounded-xl bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0 w-full sm:w-auto">
                            <div className="text-sm font-bold text-gray-900">{r.reason}</div>
                            <div className="text-xs text-gray-500 mt-0.5 break-words">
                              By: {r.reporter?.name} • Listing: {r.listing?.title} • Status: {r.status}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                            <button
                              onClick={() => handleAction(`/api/admin/reports/${r.id}`, { status: 'resolved' })}
                              className="flex-1 sm:flex-initial text-center justify-center px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => handleAction(`/api/admin/reports/${r.id}`, { status: 'dismissed' })}
                              className="flex-1 sm:flex-initial text-center justify-center px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'logs' && isSuperAdmin && (
        <div className="bg-white border border-gray-200 rounded-2xl p-3.5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600 shrink-0" /> Persistent Admin Activity Audit Logs
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Tamper-evident logs of all administrator actions on the platform.</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadAuditLogs()}
                placeholder="Search audit logs..."
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 flex-1 sm:w-48"
              />
              <button
                onClick={loadAuditLogs}
                disabled={auditLoading}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-xs shrink-0"
              >
                {auditLoading ? 'Loading...' : 'Search'}
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[36rem] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">No audit logs recorded yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLogDetail(log)}
                  className="cursor-pointer p-3 sm:p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 hover:bg-purple-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-purple-900 font-mono uppercase bg-purple-100 px-2 py-0.5 rounded shrink-0">
                        {log.actionType}
                      </span>
                      <span className="text-xs font-semibold text-gray-800 break-words">{log.adminName} ({log.adminEmail})</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1 break-words">
                      {log.reason || 'Admin operation performed'}
                      {log.targetEmail ? ` on target: ${log.targetEmail}` : ''}
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono shrink-0">
                    {timeAgo(log.createdAt)} • {log.ipAddress || 'IP logged'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Admin Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-3.5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600 shrink-0" /> Admin Team & Granular Permissions
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Assign or revoke administrator rights and promote members.</p>
            </div>
            <button
              onClick={() => {
                setSelectedUserToPromote(null);
                setMakeAdminSearch('');
                setMakeAdminResults([]);
                setPromotePermissions(ALL_ADMIN_PERMISSIONS.map((p) => p.id));
                setMakeAdminModalOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <UserPlus className="w-4 h-4" /> + Make Admin
            </button>
          </div>

          <div className="space-y-3">
            {initialUsers
              .filter((u) => u.role === 'admin')
              .map((u) => {
                const isSuper = u.isSuperAdmin || u.email === 'eliasahmad3224@gmail.com';
                const isSelf = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    className="p-3.5 sm:p-4 border border-gray-200 rounded-xl bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                        <span>{u.name}</span>
                        {isSuper && (
                          <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded-full shrink-0">
                            ★ Super Admin (Owner)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{u.email}</div>
                      <div className="text-xs text-purple-700 font-medium mt-1 break-words">
                        Active Rights: {u.adminPermissions?.length ? u.adminPermissions.join(', ') : 'All Standard Admin Rights'}
                      </div>
                    </div>

                    {!isSuper && (
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => {
                            setEditingUserPerms(u);
                            setSelectedPerms(u.adminPermissions || []);
                          }}
                          className="flex-1 sm:flex-initial px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-xs shrink-0 text-center"
                        >
                          Edit Rights
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => handleRemoveAdmin(u)}
                            disabled={busyId === `demote-${u.id}`}
                            className="flex-1 sm:flex-initial px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold shrink-0 text-center transition-all disabled:opacity-50"
                          >
                            Remove Admin
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Document Preview Modal (Supports Image & PDF) */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-3.5 sm:p-4 shadow-2xl space-y-3 sm:space-y-4 max-h-[90dvh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 gap-2">
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 truncate">
                <IdCard className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="truncate">Student Verification Preview</span>
              </h3>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <a
                  href={previewDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-xs text-brand-600 hover:underline flex items-center gap-1 font-semibold whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Open in New Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setPreviewDocUrl(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 rounded-xl p-2 min-h-[220px]">
              {previewDocUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewDocUrl} className="w-full h-[55dvh] sm:h-[600px] rounded-lg" title="PDF Document" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewDocUrl} alt="Student ID" className="max-w-full max-h-[55dvh] sm:max-h-[600px] object-contain rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Permissions Editor Modal */}
      {editingUserPerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[90dvh] overflow-y-auto">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Edit Admin Permissions</h3>
              <p className="text-xs text-gray-500">Configure granted capabilities for {editingUserPerms.name}.</p>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 'manage_users', label: 'Manage Users (Block, Unblock, Roles)' },
                { id: 'manage_payments', label: 'Manage Payments (Approve/Reject)' },
                { id: 'verify_students', label: 'Verify Student IDs' },
                { id: 'manage_listings', label: 'Manage Listings (Approve/Remove)' },
                { id: 'manage_reports', label: 'Manage Reports' },
                { id: 'view_analytics', label: 'View Platform Analytics' },
              ].map((perm) => {
                const checked = selectedPerms.includes(perm.id);
                return (
                  <label key={perm.id} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedPerms((prev) =>
                          checked ? prev.filter((p) => p !== perm.id) : [...prev, perm.id]
                        );
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>{perm.label}</span>
                  </label>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={savePermissions}
                disabled={busyId === 'perms'}
                className="py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                Save Rights
              </button>
              <button
                type="button"
                onClick={() => setEditingUserPerms(null)}
                className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Audit Log Details</h3>
              <button onClick={() => setSelectedLogDetail(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-gray-700 break-words">
              <div><strong className="text-gray-900">Action:</strong> {selectedLogDetail.actionType}</div>
              <div><strong className="text-gray-900">Admin:</strong> {selectedLogDetail.adminName} ({selectedLogDetail.adminEmail})</div>
              {selectedLogDetail.targetEmail && (
                <div><strong className="text-gray-900">Target User:</strong> {selectedLogDetail.targetEmail}</div>
              )}
              {selectedLogDetail.previousValue && (
                <div><strong className="text-gray-900">Previous Value:</strong> {selectedLogDetail.previousValue}</div>
              )}
              {selectedLogDetail.newValue && (
                <div><strong className="text-gray-900">New Value:</strong> {selectedLogDetail.newValue}</div>
              )}
              <div><strong className="text-gray-900">Reason / Notes:</strong> {selectedLogDetail.reason}</div>
              <div><strong className="text-gray-900">IP Address:</strong> {selectedLogDetail.ipAddress || 'Not recorded'}</div>
              <div><strong className="text-gray-900">Timestamp:</strong> {new Date(selectedLogDetail.createdAt).toLocaleString()}</div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Make Admin Modal */}
      {makeAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Make User Admin</h3>
                  <p className="text-xs text-gray-500">Promote a campus member to administrator</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMakeAdminModalOpen(false);
                  setSelectedUserToPromote(null);
                  setMakeAdminSearch('');
                  setMakeAdminResults([]);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Select User */}
            {!selectedUserToPromote ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Search User to Promote</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={makeAdminSearch}
                      onChange={(e) => searchUsersForAdmin(e.target.value)}
                      placeholder="Search name, email, or student ID..."
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      autoFocus
                    />
                    {makeAdminSearching && (
                      <Loader2 className="w-4 h-4 absolute right-3 top-3 text-purple-600 animate-spin" />
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(makeAdminResults.length > 0
                    ? makeAdminResults
                    : !makeAdminSearch
                    ? initialUsers.filter((u) => u.role !== 'admin').slice(0, 8)
                    : []
                  ).map((u) => (
                    <div
                      key={u.id}
                      className="p-2.5 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/30 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ProAvatar
                          src={u.image}
                          name={u.name}
                          isPro={isActualProSubscription(u)}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-900 truncate">{u.name || 'User'}</div>
                          <div className="text-[11px] text-gray-500 truncate">
                            {u.email} {u.studentId ? `• ID: ${u.studentId}` : ''}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openPromoteModalForUser(u)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shrink-0"
                      >
                        Select
                      </button>
                    </div>
                  ))}

                  {makeAdminSearch && !makeAdminSearching && makeAdminResults.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">No matching users found.</p>
                  )}
                </div>
              </div>
            ) : (
              /* Step 2: Configure Permissions & Confirm */
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ProAvatar
                      src={selectedUserToPromote.image}
                      name={selectedUserToPromote.name}
                      isPro={isActualProSubscription(selectedUserToPromote)}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-purple-950 truncate">
                        {selectedUserToPromote.name || 'User'}
                      </div>
                      <div className="text-xs text-purple-700 truncate">
                        {selectedUserToPromote.email} {selectedUserToPromote.studentId ? `• ID: ${selectedUserToPromote.studentId}` : ''}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUserToPromote(null)}
                    className="text-xs text-purple-700 hover:text-purple-900 font-semibold underline shrink-0"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-700">Granted Administrator Rights:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPromotePermissions(ALL_ADMIN_PERMISSIONS.map((p) => p.id))}
                        className="text-[11px] text-purple-600 hover:underline font-semibold"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => setPromotePermissions([])}
                        className="text-[11px] text-gray-500 hover:underline font-semibold"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    {ALL_ADMIN_PERMISSIONS.map((perm) => {
                      const checked = promotePermissions.includes(perm.id);
                      return (
                        <label key={perm.id} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setPromotePermissions((prev) =>
                                checked ? prev.filter((p) => p !== perm.id) : [...prev, perm.id]
                              );
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span>{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleMakeAdmin()}
                    disabled={busyId === `promote-${selectedUserToPromote.id}`}
                    className="py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {busyId === `promote-${selectedUserToPromote.id}` ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" /> Confirm & Make Admin
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMakeAdminModalOpen(false);
                      setSelectedUserToPromote(null);
                    }}
                    className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
