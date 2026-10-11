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
  ChevronRight,
  MapPin
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/common/Card';
import { StatCard } from '../../../components/common/StatCard';
import { Button } from '../../../components/common/Button';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time metrics, active personnel, programmes, and pending approvals</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Systems Live</span>
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

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Beneficiaries"
          value={stats?.totalBeneficiaries.toLocaleString() || '0'}
          subtitle={stats?.pendingBeneficiaries > 0 ? `${stats.pendingBeneficiaries} pending verification` : 'Verified households'}
          icon={Users}
          color={stats?.pendingBeneficiaries > 0 ? 'amber' : 'emerald'}
          onClick={() => onNavigateTab('beneficiaries')}
        />

        <StatCard
          title="Active Users"
          value={stats?.activeUsers.toString() || '0'}
          subtitle={`Staff across ${stats?.rolesCount || 8} roles`}
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
          subtitle={stats?.pendingApprovals > 0 ? 'Action required' : 'Queue cleared'}
          icon={Clock}
          color={stats?.pendingApprovals > 0 ? 'amber' : 'emerald'}
          onClick={() => onNavigateTab('approvals')}
        />
      </div>

      {/* Clean Progress Tracker (Streamlined, no repeated 7-label clutter) */}
      <Card className="border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006B56] flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Beneficiary Assistance & Project Progress Tracker
              </h3>
              <p className="text-xs text-slate-500">
                Live multi-phase telemetry from household submission to verified delivery
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateTab('lifecycle')}
            className="text-xs text-[#006B56] hover:bg-emerald-50 self-start sm:self-auto"
          >
            Open Full Lifecycle Pipeline <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {recentRequests.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <Activity className="w-6 h-6 text-slate-300 mx-auto mb-1" />
            <p className="font-semibold text-slate-700">No active assistance cases in queue</p>
            <p className="text-[11px] text-slate-400 mt-0.5">All beneficiary assistance requests will be tracked in real-time here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 pt-1">
            {recentRequests.map((req) => {
              const currentStageNum = determineStage(req);
              const currentStageObj = LIFECYCLE_STAGES.find(s => s.stage === currentStageNum) || LIFECYCLE_STAGES[0];

              return (
                <div
                  key={req.id}
                  onClick={() => onNavigateTab('lifecycle')}
                  className="py-3 px-2 sm:px-3 hover:bg-slate-50/80 rounded-xl transition cursor-pointer space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        #{req.request_code}
                      </span>
                      <strong className="text-slate-900 font-bold">{req.beneficiary_name}</strong>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600">{req.category || 'Food & Water Aid'}</span>
                      <span className="text-slate-300 hidden sm:inline">•</span>
                      <span className="text-slate-500 hidden sm:flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#006B56]" />
                        {req.location || 'Central Equatoria'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className="font-bold text-[#006B56] text-[11px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {currentStageObj.shortName} ({currentStageObj.percentage}%)
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Clean continuous progress line */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#006B56] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(currentStageObj.percentage, 10)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Actionable Urgent Administrative Requests */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader
          title="Urgent Administrative Requests"
          subtitle="Pending staff registrations, vendor onboarding, and budget releases"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab('approvals')}
              className="text-xs text-[#006B56] hover:bg-emerald-50"
            >
              View Full Queue <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingApprovals.map((app) => (
              <div
                key={app.id}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between gap-3 hover:bg-slate-50 transition"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded font-bold">
                        {app.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {app.category}
                      </span>
                    </div>
                    {app.priority === 'Urgent' && (
                      <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-full">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-900 font-semibold truncate">
                    {app.requester_name}
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {app.details}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/70">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleQuickReject(app.id, app.category)}
                    className="text-xs py-1 px-3"
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleQuickApprove(app.id, app.category)}
                    className="text-xs py-1 px-3"
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
  );
}
