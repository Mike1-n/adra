import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  FolderKanban,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Activity,
  ShieldCheck,
  HeartHandshake,
  MessageSquareText
} from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { StatCard } from '../../../components/common/StatCard';
import { Button } from '../../../components/common/Button';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

export function AdminDashboardView({ onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [adminStats, approvals] = await Promise.all([
        db.getAdminStats(),
        db.getApprovals('ALL')
      ]);
      setStats(adminStats);
      setPendingApprovals(approvals.filter(a => a.status === 'Pending').slice(0, 6));
    } catch (err) {
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleQuickApprove = async (id, title) => {
    try {
      await db.updateApprovalStatus(id, 'Approved', 'Approved via Administrator Quick Action');
      toast.success(`Request ${id} approved`);
      loadDashboardData();
    } catch (err) {
      toast.error('Approval failed.');
    }
  };

  const handleQuickReject = async (id, title) => {
    try {
      await db.updateApprovalStatus(id, 'Rejected', 'Rejected via Administrator Quick Action');
      toast.info(`Request ${id} rejected`);
      loadDashboardData();
    } catch (err) {
      toast.error('Rejection failed.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Header: Ultra-minimalist and spacious */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">System Overview</h2>
          <p className="text-xs text-slate-500 mt-1">
            Executive operational metrics and pending administrative authorizations
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
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

      {/* 2. Primary KPI Metrics Grid: Clean & spacious */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatCard
          title="Beneficiaries"
          value={stats?.totalBeneficiaries.toLocaleString() || '0'}
          subtitle={stats?.pendingBeneficiaries > 0 ? `${stats.pendingBeneficiaries} pending verification` : 'Verified households'}
          icon={Users}
          color={stats?.pendingBeneficiaries > 0 ? 'amber' : 'emerald'}
          onClick={() => onNavigateTab('beneficiaries')}
        />

        <StatCard
          title="Active Personnel"
          value={stats?.activeUsers.toString() || '0'}
          subtitle={`Across ${stats?.rolesCount || 8} operational roles`}
          icon={UserCheck}
          color="blue"
          onClick={() => onNavigateTab('users')}
        />

        <StatCard
          title="Programmes"
          value={stats?.totalProgrammes.toString() || '0'}
          subtitle="Humanitarian grants"
          icon={FolderKanban}
          color="cyan"
          onClick={() => onNavigateTab('programmes')}
        />

        <StatCard
          title="Pending Approvals"
          value={stats?.pendingApprovals.toString() || '0'}
          subtitle={stats?.pendingApprovals > 0 ? 'Requires attention' : 'Queue cleared'}
          icon={Clock}
          color={stats?.pendingApprovals > 0 ? 'amber' : 'emerald'}
          onClick={() => onNavigateTab('approvals')}
        />
      </div>

      {/* 3. Urgent Administrative Requests: Clean, Compact Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Header Strip */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Urgent Administrative Requests
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pending staff recruitment, vendor qualifications, and budget disbursements
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('approvals')}
            className="text-xs font-bold text-[#006B56] hover:text-[#005443] flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>View All Approvals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="py-12 text-center text-slate-500 p-6 space-y-1.5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1 opacity-80" />
            <p className="font-bold text-slate-800 text-sm">All Clear — No Pending Approvals</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Every staff registration, supplier onboarding, and budget release has been reviewed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
                  <th className="py-2.5 px-3 sm:py-3 sm:px-4">Request ID</th>
                  <th className="py-2.5 px-3 sm:py-3 sm:px-4">Type & Requester</th>
                  <th className="hidden md:table-cell py-3 px-4">Justification / Details</th>
                  <th className="hidden sm:table-cell py-3 px-4">Priority</th>
                  <th className="py-2.5 px-3 sm:py-3 sm:px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingApprovals.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    {/* Request ID */}
                    <td className="py-3 px-3 sm:px-4 align-middle whitespace-nowrap">
                      <span className="font-mono font-bold text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        {app.id}
                      </span>
                    </td>

                    {/* Type & Requester */}
                    <td className="py-3 px-3 sm:px-4 align-middle max-w-[200px]">
                      <span className="font-bold text-slate-900 block truncate">
                        {app.category}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {app.requester_name}
                      </span>
                      {/* Details visible on mobile if hidden column */}
                      <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 md:hidden">
                        {app.details}
                      </span>
                    </td>

                    {/* Description / Details (md+ screens) */}
                    <td className="hidden md:table-cell py-3 px-4 align-middle text-slate-600 max-w-[320px]">
                      <p className="line-clamp-2 leading-relaxed text-[11px]">
                        {app.details}
                      </p>
                    </td>

                    {/* Priority (sm+ screens) */}
                    <td className="hidden sm:table-cell py-3 px-4 align-middle whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                          app.priority === 'Urgent'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {app.priority || 'Normal'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 sm:px-4 align-middle text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickReject(app.id, app.category)}
                          className="px-2.5 py-1 text-xs font-bold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickApprove(app.id, app.category)}
                          className="px-3 py-1 text-xs font-bold text-white bg-[#006B56] hover:bg-[#005443] rounded-lg transition shadow-2xs cursor-pointer active:scale-95"
                        >
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Minimalist Operations Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
        <div
          onClick={() => onNavigateTab('lifecycle')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006B56] flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs group-hover:text-[#006B56] transition">Aid Lifecycle</p>
              <p className="text-[11px] text-slate-500">7-phase tracker</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#006B56] group-hover:translate-x-0.5 transition" />
        </div>

        <div
          onClick={() => onNavigateTab('beneficiaries')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs group-hover:text-purple-700 transition">Beneficiary Roll</p>
              <p className="text-[11px] text-slate-500">Households & census</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition" />
        </div>

        <div
          onClick={() => onNavigateTab('security')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs group-hover:text-sky-700 transition">Security & Audit</p>
              <p className="text-[11px] text-slate-500">RBAC policies & logs</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-700 group-hover:translate-x-0.5 transition" />
        </div>

        <div
          onClick={() => onNavigateTab('feedback')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <MessageSquareText className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs group-hover:text-amber-700 transition">User Feedback</p>
              <p className="text-[11px] text-slate-500">Module reviews & AAP</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition" />
        </div>
      </div>
    </div>
  );
}
