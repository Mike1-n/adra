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
  Search,
  Activity,
  ChevronRight,
  MapPin,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/common/Card';
import { StatCard } from '../../../components/common/StatCard';
import { Button } from '../../../components/common/Button';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db, isSupabaseConfigured } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import { LIFECYCLE_STAGES, determineStage } from './ProjectLifecycleTrackerView';

export function AdminDashboardView({ onNavigateTab, onOpenSearch }) {
  const [stats, setStats] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [adminStats, approvals, reqs] = await Promise.all([
        db.getAdminStats(),
        db.getApprovals('ALL'),
        db.getAssistanceRequests()
      ]);
      setStats(adminStats);
      setPendingApprovals(approvals.filter(a => a.status === 'Pending').slice(0, 4));
      setRecentRequests((reqs || []).slice(0, 3));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time metrics, active personnel, programmes, and pending approvals</p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* 4 Clean Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Beneficiaries"
          value={stats?.totalBeneficiaries.toLocaleString() || '0'}
          subtitle={stats?.pendingBeneficiaries > 0 ? `${stats.pendingBeneficiaries} pending verification` : 'All enrolled households verified'}
          icon={Users}
          color={stats?.pendingBeneficiaries > 0 ? 'amber' : 'emerald'}
          onClick={() => onNavigateTab('beneficiaries')}
        />

        <StatCard
          title="Active Users"
          value={stats?.activeUsers.toString() || '0'}
          subtitle={`Staff & partners across ${stats?.rolesCount || 8} roles`}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
        <div className="flex items-center gap-3 px-3 py-1">
          <Package className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="min-w-0">
            <span className="font-bold text-slate-900">{stats?.totalInventoryUnits.toLocaleString() || 0} Relief Units</span>
            <p className="text-[10px] text-slate-500 truncate">{stats?.totalInventoryItems || 0} relief stock items</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-1 border-t sm:border-t-0 sm:border-l border-slate-200">
          <Truck className="w-4 h-4 text-sky-600 shrink-0" />
          <div className="min-w-0">
            <span className="font-bold text-slate-900">{stats?.totalSuppliers || 0} Registered Vendors</span>
            <p className="text-[10px] text-slate-500 truncate">Prequalified aid suppliers</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-1 border-t sm:border-t-0 sm:border-l border-slate-200">
          <HeartHandshake className="w-4 h-4 text-purple-600 shrink-0" />
          <div className="min-w-0">
            <span className="font-bold text-slate-900">{stats?.totalDistributions || 0} Aid Distributions</span>
            <p className="text-[10px] text-slate-500 truncate">Direct community relief operations</p>
          </div>
        </div>
      </div>

      {/* FEATURED: Live Beneficiary Assistance & Aid Delivery Progress Pipeline */}
      <Card className="bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/20 border-emerald-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#006B56] flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                Beneficiary Assistance & Project Progress Tracker
                <span className="text-[10px] font-extrabold bg-[#006B56] text-white px-2 py-0.5 rounded-full">
                  Live Telemetry
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full 7-phase tracking from household request submission to verified aid receipt
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigateTab('lifecycle')}
            icon={ArrowRight}
          >
            Open Full Lifecycle Pipeline
          </Button>
        </div>

        {recentRequests.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            <Activity className="w-6 h-6 text-slate-300 mx-auto mb-1" />
            <p className="font-semibold text-slate-700">No active assistance cases in queue</p>
            <p className="text-[11px] text-slate-400 mt-0.5">All beneficiary assistance requests will be tracked in real-time here.</p>
          </div>
        ) : (
          <div className="space-y-3 pt-3">
            {recentRequests.map((req) => {
              const currentStageNum = determineStage(req);
              const currentStageObj = LIFECYCLE_STAGES.find(s => s.stage === currentStageNum) || LIFECYCLE_STAGES[0];

              return (
                <div
                  key={req.id}
                  onClick={() => onNavigateTab('lifecycle')}
                  className="p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-400 shadow-2xs hover:shadow-sm transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        #{req.request_code}
                      </span>
                      <strong className="text-slate-900 font-extrabold">{req.beneficiary_name}</strong>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600 font-medium">{req.category || 'Food & Water Aid'}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {req.location || 'Central Equatoria'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className="font-extrabold text-[#006B56] text-[11px] bg-emerald-50 border border-emerald-300/60 px-2 py-0.5 rounded-md">
                        {currentStageObj.shortName} ({currentStageObj.percentage}%)
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* 7-Segment Progress Bar */}
                  <div className="grid grid-cols-7 gap-1">
                    {LIFECYCLE_STAGES.map((st) => {
                      const isCompleted = currentStageNum > st.stage;
                      const isCurrent = currentStageNum === st.stage;
                      return (
                        <div key={st.stage} className="space-y-0.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              isCompleted
                                ? 'bg-[#006B56]'
                                : isCurrent
                                ? 'bg-emerald-500 animate-pulse ring-1 ring-emerald-400'
                                : 'bg-slate-200'
                            }`}
                          />
                          <span
                            className={`block text-[8px] text-center truncate ${
                              isCurrent
                                ? 'font-black text-[#006B56]'
                                : isCompleted
                                ? 'font-semibold text-slate-600'
                                : 'text-slate-300'
                            }`}
                          >
                            {st.shortName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

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
              <div className="py-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-900">No Pending Approvals</p>
                <p className="mt-0.5 text-[11px] text-slate-500">All registration and expenditure queues are up to date.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingApprovals.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                          {app.id}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {app.category}
                        </span>
                        {app.priority === 'Urgent' && (
                          <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-full">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-800 mt-1 font-semibold truncate">
                        {app.requester_name}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {app.details}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
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
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Database Engine</p>
                    <p className="text-[10px] text-slate-500">
                      {isSupabaseConfigured ? 'PostgreSQL Live' : 'Persistent Storage'}
                    </p>
                  </div>
                </div>
                <span className="badge-emerald text-[10px]">Active</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-slate-900">RBAC Security</p>
                    <p className="text-[10px] text-slate-500">{stats?.rolesCount || 8} Roles Enforced</p>
                  </div>
                </div>
                <span className="badge-emerald text-[10px]">Enforced</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-sky-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Audit Trail</p>
                    <p className="text-[10px] text-slate-500">Event Stream Logging</p>
                  </div>
                </div>
                <span className="badge-blue text-[10px]">Recording</span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-200">
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
