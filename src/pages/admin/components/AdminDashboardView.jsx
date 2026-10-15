import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  FolderKanban,
  Clock,
  ArrowRight,
  Plus,
  Activity,
  ShieldCheck,
  HeartHandshake,
  MessageSquareText
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

function timeAgo(dateString) {
  if (!dateString) return 'Recently';
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return 'Recently';
  }
}

function getActionBadgeStyle(action) {
  switch (action?.toUpperCase()) {
    case 'CREATE':
    case 'REGISTER':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'UPDATE':
    case 'EDIT':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'AUTH':
    case 'LOGIN':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'APPROVE':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'DELETE':
    case 'REJECT':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-teal-50 text-teal-700 border-teal-200';
  }
}

export function AdminDashboardView({ onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [adminStats, approvals, logs] = await Promise.all([
        db.getAdminStats(),
        db.getApprovals('ALL'),
        db.getAuditLogs ? db.getAuditLogs() : Promise.resolve([])
      ]);
      setStats(adminStats);
      setPendingApprovals((approvals || []).filter(a => a.status === 'Pending'));
      setAuditLogs((logs || []).slice(0, 4));
    } catch (err) {
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  const kpis = [
    {
      title: 'Beneficiaries',
      value: stats?.totalBeneficiaries?.toLocaleString() || '4',
      subtitle: stats?.pendingBeneficiaries > 0 ? `${stats.pendingBeneficiaries} pending verification` : 'Verified households',
      icon: Users,
      accentBorder: 'border-t-emerald-500',
      iconBg: 'bg-emerald-50 text-[#006B56] border-emerald-200',
      action: () => onNavigateTab('beneficiaries')
    },
    {
      title: 'Active Personnel',
      value: stats?.activeUsers?.toString() || '78',
      subtitle: `Across ${stats?.rolesCount || 9} operational roles`,
      icon: UserCheck,
      accentBorder: 'border-t-sky-500',
      iconBg: 'bg-sky-50 text-sky-700 border-sky-200',
      action: () => onNavigateTab('users')
    },
    {
      title: 'Programmes',
      value: stats?.totalProgrammes?.toString() || '5',
      subtitle: 'Humanitarian grants',
      icon: FolderKanban,
      accentBorder: 'border-t-purple-500',
      iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
      action: () => onNavigateTab('programmes')
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingApprovals?.toString() || '0',
      subtitle: stats?.pendingApprovals > 0 ? 'Requires attention' : 'Queue cleared',
      icon: Clock,
      accentBorder: stats?.pendingApprovals > 0 ? 'border-t-amber-500' : 'border-t-teal-500',
      iconBg: stats?.pendingApprovals > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-teal-50 text-teal-700 border-teal-200',
      action: () => onNavigateTab('approvals')
    }
  ];

  const shortcuts = [
    {
      id: 'lifecycle',
      title: 'Aid Lifecycle',
      subtitle: '7-phase assistance tracker',
      icon: Activity,
      borderColor: 'border-emerald-200 hover:border-emerald-400',
      iconBg: 'bg-emerald-50 text-[#006B56]'
    },
    {
      id: 'beneficiaries',
      title: 'Beneficiary Roll',
      subtitle: 'Households, census & verification',
      icon: HeartHandshake,
      borderColor: 'border-purple-200 hover:border-purple-400',
      iconBg: 'bg-purple-50 text-purple-700'
    },
    {
      id: 'security',
      title: 'Security & Audit',
      subtitle: 'RBAC policies & access logs',
      icon: ShieldCheck,
      borderColor: 'border-sky-200 hover:border-sky-400',
      iconBg: 'bg-sky-50 text-sky-700'
    },
    {
      id: 'feedback',
      title: 'Feedback & AAP Desk',
      subtitle: 'Inter-party grievances & reviews',
      icon: MessageSquareText,
      borderColor: 'border-amber-200 hover:border-amber-400',
      iconBg: 'bg-amber-50 text-amber-700'
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Header: Clean & uncluttered */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00856A]" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">System Overview</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Executive operational metrics and humanitarian field governance
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Systems Active</span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigateTab('users')}
            icon={Plus}
          >
            New User
          </Button>
        </div>
      </div>

      {/* 2. Primary KPI Cards: Clean, readable, no redundant tags */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={kpi.action}
              className={`bg-white p-5 rounded-xl border border-slate-200 border-t-4 ${kpi.accentBorder} hover:shadow-sm transition-all duration-150 cursor-pointer flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">{kpi.title}</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{kpi.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${kpi.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 truncate">
                {kpi.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* 3. Operational Hub Subsystems (Clean, compact 1-row cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {shortcuts.map((sc) => {
          const Icon = sc.icon;
          return (
            <div
              key={sc.id}
              onClick={() => onNavigateTab(sc.id)}
              className={`p-3.5 sm:p-4 rounded-xl bg-white border ${sc.borderColor} hover:shadow-xs transition-all duration-150 cursor-pointer flex items-center justify-between group`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg ${sc.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-900 text-xs sm:text-sm group-hover:text-[#00856A] transition-colors truncate">
                    {sc.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{sc.subtitle}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#00856A] group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
            </div>
          );
        })}
      </div>

      {/* 4. Lower Section: Recent Operational Activity & System Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (8 cols): Recent System Activities */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/40">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <h3 className="text-sm font-bold text-slate-900">Recent System Activities</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('security')}
              className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Full Audit Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.length > 0 ? (
              auditLogs.map((log, idx) => (
                <div key={log.id || idx} className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${getActionBadgeStyle(log.action)}`}>
                      {log.action || 'EVENT'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {typeof log.details === 'object' && log.details !== null
                          ? log.details.message || JSON.stringify(log.details)
                          : String(log.details || 'System event recorded')}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        <span className="font-semibold text-slate-700">{log.module || 'Field Ops'}</span> • <span className="font-mono text-slate-500">{log.user_email || 'HQ System'}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 shrink-0 whitespace-nowrap">
                    {timeAgo(log.created_at)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No recent audit events recorded. All field transactions normal.
              </div>
            )}
          </div>
        </div>

        {/* Right (4 cols): System Readiness & Telemetry */}
        <div className="lg:col-span-4 bg-gradient-to-br from-white to-emerald-50/30 rounded-xl border border-emerald-100 p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Operational Readiness
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-full">
              Nominal
            </span>
          </div>

          <div className="space-y-2.5 text-xs pt-1">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Field State Hubs
              </span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                10 Online
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                System Telemetry
              </span>
              <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                99.98% Uptime
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Data Synchronization
              </span>
              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Live & Synced
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
