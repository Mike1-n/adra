import React from 'react';
import {
  ClipboardList,
  FileCheck,
  QrCode,
  UserPlus,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Shield,
  Activity,
  Flame,
  Phone,
  Sparkles,
  ArrowRight,
  Users,
  DollarSign,
  Receipt,
  Wallet,
  Banknote
} from 'lucide-react';

export function FieldWorkerDashboardView({
  worker = {},
  tasks = [],
  assessments = [],
  activities = [],
  beneficiaries = [],
  fundingRequests = [],
  dutyStatus = 'Available',
  onUpdateDutyStatus,
  onNavigateTab,
  onStartAssessment,
  onOpenScanner,
  onOpenRegisterBeneficiary,
  onOpenFundingRequest,
  onRequestFacilitation,
  onSelectTask
}) {
  const pendingTasks = tasks.filter(t => 
    t.status === 'Assigned to Field Worker' || 
    t.status === 'Assessment In Progress' ||
    t.status === 'Correction Required'
  );

  const completedToday = assessments.filter(a => {
    if (!a.submission_date) return false;
    const today = new Date().toISOString().split('T')[0];
    return a.submission_date.startsWith(today);
  }).length;

  const urgentTasks = pendingTasks.filter(t => t.urgency === 'High' || t.priority === 'High');
  const activeFundingCount = fundingRequests.filter(r => r.status !== 'Disbursed' && !r.status?.includes('Rejected')).length;
  const totalDisbursedAmt = fundingRequests.filter(r => r.status === 'Disbursed').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* 1. COMPACT OPERATIONAL STATUS & DUTY SELECTOR */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#006B56] flex items-center justify-center shrink-0 border border-emerald-200/70">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none">Zone</span>
            <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">
              {worker.payam || worker.county || 'Field Territory'}
            </span>
          </div>
        </div>

        {/* Compact Duty State Toggle */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
          {['Available', 'On Assignment', 'In Field'].map(status => (
            <button
              key={status}
              type="button"
              onClick={() => onUpdateDutyStatus(status)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                dutyStatus === status
                  ? 'bg-[#006B56] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* 2. FOUR CORE KPI METRIC CARDS */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Pending Tasks */}
        <div
          onClick={() => onNavigateTab('tasks')}
          className="bg-amber-50/70 rounded-2xl p-3.5 border border-amber-300 shadow-2xs hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-950">Assigned Cases</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-amber-950 tracking-tight">{pendingTasks.length}</span>
            <span className="text-[10px] font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
              {urgentTasks.length} Urgent SLA
            </span>
          </div>
        </div>

        {/* Completed Audits */}
        <div
          onClick={() => onNavigateTab('tasks')}
          className="bg-emerald-100/70 rounded-2xl p-3.5 border border-emerald-400/80 shadow-2xs hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-950">Audits Done</span>
            <div className="w-8 h-8 rounded-xl bg-[#006B56] text-white flex items-center justify-center shadow-2xs shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-emerald-950 tracking-tight">{assessments.length}</span>
            <span className="text-[10px] font-black text-emerald-950 bg-emerald-200 px-2 py-0.5 rounded-md">
              {completedToday} today
            </span>
          </div>
        </div>

        {/* Facilitation Requisitions Widget */}
        <div
          onClick={() => onNavigateTab('funding')}
          className="bg-purple-50/70 rounded-2xl p-3.5 border border-purple-300 shadow-2xs hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-950">Facilitation</span>
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-purple-950 tracking-tight">{activeFundingCount}</span>
            <span className="text-[10px] font-black text-purple-900 bg-purple-200/80 px-2 py-0.5 rounded-md">
              {Number(totalDisbursedAmt).toLocaleString()} SSP Disbursed
            </span>
          </div>
        </div>

        {/* Beneficiaries in Boma */}
        <div
          onClick={() => onNavigateTab('beneficiaries')}
          className="bg-blue-50/70 rounded-2xl p-3.5 border border-blue-300 shadow-2xs hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-950">Community Households</span>
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-blue-950 tracking-tight">{beneficiaries.length}</span>
            <span className="text-[10px] font-black text-blue-900 bg-blue-200/80 px-2 py-0.5 rounded-md">
              In territory
            </span>
          </div>
        </div>
      </div>

      {/* 3. QUICK FIELD ACTIONS BAR (4 TOOLS) */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#006B56]" />
          Field Action Tools
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Conduct Audit (Dark Rich Green) */}
          <button
            type="button"
            onClick={onStartAssessment}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-[#006B56] to-[#004d3d] hover:from-[#005a48] hover:to-[#003d30] text-white transition border border-[#004d3d] text-center group shadow-md hover:shadow-lg cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center mb-1.5 shadow-inner group-hover:scale-105 transition">
              <FileCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-black text-white leading-tight">Conduct Audit</span>
            <span className="text-[10px] font-extrabold text-emerald-200 mt-0.5">Vulnerability</span>
          </button>

          {/* Request Facilitation (Amber/Emerald Cash Requisition) */}
          <button
            type="button"
            onClick={onRequestFacilitation || onOpenFundingRequest}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50/90 hover:bg-amber-100/90 transition border border-amber-300 text-center group shadow-2xs cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition">
              <Banknote className="w-4 h-4" />
            </div>
            <span className="text-xs font-black text-amber-950 leading-tight">Facilitation</span>
            <span className="text-[10px] font-extrabold text-amber-800 mt-0.5">Requisition</span>
          </button>

          {/* Scan QR Token */}
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50/90 hover:bg-blue-100/90 transition border border-blue-300/90 text-center group shadow-2xs cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition">
              <QrCode className="w-4 h-4" />
            </div>
            <span className="text-xs font-black text-blue-950 leading-tight">Scan QR Token</span>
            <span className="text-[10px] font-extrabold text-blue-800 mt-0.5">Disbursement</span>
          </button>

          {/* Register Household */}
          <button
            type="button"
            onClick={onOpenRegisterBeneficiary}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-purple-50/90 hover:bg-purple-100/90 transition border border-purple-300/90 text-center group shadow-2xs cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-xs font-black text-purple-950 leading-tight">Register Household</span>
            <span className="text-[10px] font-extrabold text-purple-800 mt-0.5">On-Site Boma</span>
          </button>
        </div>
      </div>

      {/* 4. URGENT 48h SLA FIELD CASES QUEUE */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900">Urgent Field Audit Queue</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('tasks')}
            className="text-xs font-bold text-[#006B56] hover:underline flex items-center gap-0.5"
          >
            View All ({pendingTasks.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-800">All Field Audits Completed!</p>
            <p className="text-[11px] text-slate-500 mt-0.5">No overdue or pending household assessments in your queue.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingTasks.slice(0, 3).map((task) => (
              <div
                key={task.id || task.request_code}
                onClick={() => onSelectTask(task)}
                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/20 transition cursor-pointer group bg-slate-50/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-900">{task.beneficiary_name}</span>
                      <span className="text-[10px] font-mono text-slate-500">#{task.request_code}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        task.urgency === 'High' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {task.urgency || 'Normal'} Urgency
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{task.payam || task.location || 'Eastern Equatoria'} • {task.household_members || 6} Members</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onRequestFacilitation && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestFacilitation(task);
                        }}
                        className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1 transition cursor-pointer active:scale-95"
                        title="Request facilitation cash for this assignment"
                      >
                        <DollarSign className="w-3 h-3 text-amber-700" />
                        <span>Facilitation</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartAssessment(task);
                      }}
                      className="px-2.5 py-1.5 bg-[#006B56] hover:bg-[#005a48] text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      Audit
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Due: {task.due_date || 'Within 48h'}
                  </span>
                  <span className="text-[10px] text-slate-600">Assigned by: {task.assigned_supervisor_name || task.supervisor_name || worker.supervisor_name || 'Assigned Supervisor'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. RECENT FIELD ACTIVITY TIMELINE */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#006B56]" />
            Recent Field Outreach & Logs
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab('activities')}
            className="text-xs font-bold text-[#006B56] hover:underline"
          >
            Full Log
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-5 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Activity className="w-6 h-6 text-slate-400 mx-auto mb-1 opacity-60" />
            <p className="text-xs font-medium text-slate-600">No field activity logs recorded yet today.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Logs will automatically record when you submit audits, disbursements, or requisitions.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activities.slice(0, 3).map((act, i) => (
              <div key={act.id || i} className="flex items-start gap-2.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="font-bold text-slate-800">{act.title}</span>
                    <span className="text-[10px] text-slate-600">
                      {act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{act.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
