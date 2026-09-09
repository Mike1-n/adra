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
  AlertTriangle,
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
      toast.error('Failed to load live administrator metrics.');
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
      toast.success(`Request "${title}" approved!`);
      loadDashboardData();
    } catch (err) {
      toast.error('Approval failed.');
    }
  };

  const handleQuickReject = async (id, title) => {
    try {
      await db.updateApprovalStatus(id, 'Rejected', 'Rejected via Administrator Quick Action');
      toast.info(`Request "${title}" rejected.`);
      loadDashboardData();
    } catch (err) {
      toast.error('Rejection failed.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Aggregating live administrator telemetry..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner with Quick Search */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Executive Control
            </span>
            <span className="text-xs text-slate-400">Live Database Synced</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            System Administration Console
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5 max-w-xl">
            Real-time oversight of beneficiaries, staff security, humanitarian programmes, field offices, and operational approvals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenSearch}
            icon={Search}
          >
            Global Search
          </Button>
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

      {/* 7 Key Admin Statistics Grid (Function 1) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Beneficiaries"
          value={stats?.totalBeneficiaries.toLocaleString() || '0'}
          subtitle="Enrolled & mapped"
          icon={Users}
          color="emerald"
          onClick={() => onNavigateTab('beneficiaries')}
        />

        <StatCard
          title="Active Users"
          value={stats?.activeUsers.toString() || '0'}
          subtitle="Staff, partners & donors"
          icon={UserCheck}
          color="blue"
          onClick={() => onNavigateTab('users')}
        />

        <StatCard
          title="Distributions"
          value={stats?.totalDistributions.toLocaleString() || '0'}
          subtitle="Direct aid operations"
          icon={HeartHandshake}
          color="purple"
          onClick={() => onNavigateTab('programmes')}
        />

        <StatCard
          title="Warehouse Inventory"
          value={`${stats?.totalInventoryUnits.toLocaleString() || 0}`}
          subtitle={`${stats?.totalInventoryItems || 0} relief stock lines`}
          icon={Package}
          color="amber"
          onClick={() => onNavigateTab('programmes')}
        />

        <StatCard
          title="Programmes"
          value={stats?.totalProgrammes.toString() || '0'}
          subtitle="Multi-donor projects"
          icon={FolderKanban}
          color="cyan"
          onClick={() => onNavigateTab('programmes')}
        />

        <StatCard
          title="Suppliers & Vendors"
          value={stats?.totalSuppliers.toString() || '0'}
          subtitle="Prequalified partners"
          icon={Truck}
          color="blue"
          onClick={() => onNavigateTab('programmes')}
        />

        <StatCard
          title="Pending Approvals"
          value={stats?.pendingApprovals.toString() || '0'}
          subtitle={stats?.pendingApprovals > 0 ? 'Requires attention' : 'Queue cleared'}
          icon={Clock}
          color="amber"
          onClick={() => onNavigateTab('approvals')}
        />

        <StatCard
          title="System Security"
          value="Healthy"
          subtitle="Lockouts & sessions active"
          icon={Lock}
          color="emerald"
          onClick={() => onNavigateTab('security')}
        />
      </div>

      {/* Two Column Grid: Pending Approvals Queue & System Governance Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Actionable Pending Approvals Queue */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="Urgent Administrative Approval Requests"
              subtitle="Pending staff registrations, supplier onboarding, and budget releases"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigateTab('approvals')}
                >
                  View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              }
            />

            {pendingApprovals.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-200">No Pending Approvals</p>
                <p className="mt-1">All registration and expenditure requests are up to date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((app) => (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                          {app.id}
                        </span>
                        <span className="text-xs font-bold text-white truncate">
                          {app.category}
                        </span>
                        {app.priority === 'Urgent' && (
                          <span className="text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 font-medium truncate">
                        {app.requester_name} ({app.requester_email})
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
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
                        icon={CheckCircle2}
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
              title="System Governance Status"
              subtitle="Real-time operational safeguards"
            />

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-slate-200">Database Engine</p>
                    <p className="text-[10px] text-slate-400">
                      {isSupabaseConfigured ? 'Supabase Cloud PostgreSQL' : 'Local Mock Data Engine'}
                    </p>
                  </div>
                </div>
                <span className="badge-emerald text-[10px]">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-slate-200">Role-Based Access (RBAC)</p>
                    <p className="text-[10px] text-slate-400">8 Roles Configured</p>
                  </div>
                </div>
                <span className="badge-emerald text-[10px]">Enforced</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="font-semibold text-slate-200">System Audit Trail</p>
                    <p className="text-[10px] text-slate-400">Immutable Event Log</p>
                  </div>
                </div>
                <span className="badge-blue text-[10px]">Recording</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="font-semibold text-slate-200">System Broadcasts</p>
                    <p className="text-[10px] text-slate-400">Alert Notifications</p>
                  </div>
                </div>
                <span className="badge-purple text-[10px]">Enabled</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => onNavigateTab('data')}
              >
                Data Management & Backups
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
