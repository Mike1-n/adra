import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  HeartHandshake,
  Package,
  FolderKanban,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Database,
  Plus,
  Radio,
  FileCheck2,
  Lock,
  Search
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/common/Card';
import { StatCard } from '../../../components/common/StatCard';
import { Button } from '../../../components/common/Button';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db, isSupabaseConfigured } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

export function AdminDashboardView({ onNavigateTab, onOpenSearch }) {
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
      setPendingApprovals(approvals.filter(a => a.status === 'Pending').slice(0, 4));
    } catch (err) {
      toast.error('Failed to load live metrics.');
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
      toast.success(`Request approved`);
      loadDashboardData();
    } catch (err) {
      toast.error('Approval failed.');
    }
  };

  const handleQuickReject = async (id, title) => {
    try {
      await db.updateApprovalStatus(id, 'Rejected', 'Rejected via Administrator Quick Action');
      toast.info(`Request rejected`);
      loadDashboardData();
    } catch (err) {
      toast.error('Rejection failed.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Aggregating live telemetry..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Clean Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">System Overview</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time metrics, active personnel, programmes, and pending approvals</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigateTab('users')}
            icon={Plus}
          >
            New User
          </Button>
        </div>
      </div>

      {/* 4 Clean Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Beneficiaries"
          value={stats?.totalBeneficiaries.toLocaleString() || '0'}
          subtitle="Enrolled & mapped in field"
          icon={Users}
          color="emerald"
          onClick={() => onNavigateTab('beneficiaries')}
        />

        <StatCard
          title="Active Users"
          value={stats?.activeUsers.toString() || '0'}
          subtitle="Staff & partners across 8 roles"
          icon={UserCheck}
          color="blue"
          onClick={() => onNavigateTab('users')}
        />

        <StatCard
          title="Programmes"
          value={stats?.totalProgrammes.toString() || '0'}
          subtitle="Active humanitarian grants"
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

      {/* Secondary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-850 border border-slate-800 text-xs">
        <div className="flex items-center gap-3 px-3 py-1">
          <Package className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="min-w-0">
            <span className="font-bold text-slate-100">{stats?.totalInventoryUnits.toLocaleString() || 0} Relief Units</span>
            <p className="text-[10px] text-slate-400 truncate">{stats?.totalInventoryItems || 0} relief stock items</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-1 border-t sm:border-t-0 sm:border-l border-slate-800">
          <Truck className="w-4 h-4 text-sky-600 shrink-0" />
          <div className="min-w-0">
            <span className="font-bold text-slate-100">{stats?.totalSuppliers || 0} Registered Vendors</span>
            <p className="text-[10px] text-slate-400 truncate">Prequalified aid suppliers</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-1 border-t sm:border-t-0 sm:border-l border-slate-800">
          <HeartHandshake className="w-4 h-4 text-purple-600 shrink-0" />
          <div className="min-w-0">
            <span className="font-bold text-slate-100">{stats?.totalDistributions || 0} Aid Distributions</span>
            <p className="text-[10px] text-slate-400 truncate">Direct community relief operations</p>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Pending Approvals & System Governance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Actionable Pending Approvals Queue */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="Urgent Administrative Requests"
              subtitle="Pending staff registrations, vendor onboarding, and budget releases"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigateTab('approvals')}
                >
                  View Queue <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              }
            />

            {pendingApprovals.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-100">No Pending Approvals</p>
                <p className="mt-0.5 text-[11px] text-slate-400">All registration and expenditure queues are up to date.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingApprovals.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                          {app.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-100 truncate">
                          {app.category}
                        </span>
                        {app.priority === 'Urgent' && (
                          <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-full">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 mt-1 font-medium truncate">
                        {app.requester_name}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {app.details}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleQuickReject(app.id, app.category)}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleQuickApprove(app.id, app.category)}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Operational Status & System Health */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Governance & Security"
              subtitle="Real-time operational safeguards"
            />

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-850 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-slate-100">Database Engine</p>
                    <p className="text-[10px] text-slate-400">
                      {isSupabaseConfigured ? 'PostgreSQL Live' : 'Persistent Storage'}
                    </p>
                  </div>
                </div>
                <span className="badge-emerald text-[10px]">Active</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-850 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-slate-100">RBAC Security</p>
                    <p className="text-[10px] text-slate-400">8 Roles Enforced</p>
                  </div>
                </div>
                <span className="badge-emerald text-[10px]">Enforced</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-850 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-sky-600" />
                  <div>
                    <p className="font-semibold text-slate-100">Audit Trail</p>
                    <p className="text-[10px] text-slate-400">Event Stream Logging</p>
                  </div>
                </div>
                <span className="badge-blue text-[10px]">Recording</span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => onNavigateTab('data')}
              >
                Backups & Data Management
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
