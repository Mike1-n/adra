import React from 'react';
import {
  ClipboardList,
  Users,
  FileCheck,
  AlertTriangle,
  ChevronRight,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export function SupervisorDashboardView({
  supervisorName = 'Emmanuel Adeyemi',
  operationalArea = 'Eastern Equatoria',
  assignments = [],
  fieldWorkers = [],
  assessments = [],
  activities = [],
  facilitations = [],
  onNavigateTab,
  onSelectAssignment,
  onSelectWorker,
  onSelectAssessment
}) {
  // Compute key metric counts
  const pendingAssignments = assignments.filter(
    a => !a.assigned_field_worker_name || 
         a.assigned_field_worker_name.includes('Pending') || 
         a.assigned_field_worker_name.includes('Unassigned') ||
         a.status === 'Assigned to Supervisor' ||
         a.status === 'Submitted'
  );

  const pendingReviews = assessments.filter(
    a => a.status === 'Under Supervisor Review' || a.status === 'Submitted'
  );

  const pendingFacilitations = facilitations.filter(
    f => f.status === 'Pending Supervisor Approval' || f.stage === 1 || f.status === 'Submitted' || f.status === 'Pending'
  );

  const overdueCount = assignments.filter(
    a => a.is_overdue || (a.due_date && new Date(a.due_date) < new Date() && a.status !== 'Completed' && a.status !== 'Distributed')
  ).length;

  const availableWorkersCount = fieldWorkers.filter(w => w.current_status === 'Available').length;

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* 1. FOUR VIBRANT KPI METRIC CARDS */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Pending Tasks (Amber Theme) */}
        <div
          onClick={() => onNavigateTab('assignments')}
          className="bg-amber-50/50 rounded-2xl p-3.5 border border-amber-300 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-950">Pending Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-amber-950 tracking-tight">{pendingAssignments.length}</span>
            <span className="text-[10px] font-black text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-md">
              Needs dispatch
            </span>
          </div>
        </div>

        {/* Facilitation Approvals (Amber/Orange Theme) */}
        <div
          onClick={() => onNavigateTab('facilitations')}
          className="bg-orange-50/50 rounded-2xl p-3.5 border border-orange-300 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-orange-950">Facilitations</span>
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-orange-950 tracking-tight">{pendingFacilitations.length}</span>
            <span className="text-[10px] font-black text-orange-900 bg-orange-200/70 px-2 py-0.5 rounded-md">
              Awaiting Endorsement
            </span>
          </div>
        </div>

        {/* Field Assessments Review (Purple Theme) */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-purple-50/50 rounded-2xl p-3.5 border border-purple-300 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-950">Field Assessments</span>
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-purple-950 tracking-tight">{pendingReviews.length}</span>
            <span className="text-[10px] font-black text-purple-900 bg-purple-200/70 px-2 py-0.5 rounded-md">
              Awaiting sign-off
            </span>
          </div>
        </div>

        {/* Field Team (Emerald Theme) */}
        <div
          onClick={() => onNavigateTab('team')}
          className="bg-emerald-50/50 rounded-2xl p-3.5 border border-emerald-300 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-950">Field Team</span>
            <div className="w-8 h-8 rounded-xl bg-[#006B56] text-white flex items-center justify-center shadow-2xs shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-emerald-950 tracking-tight">{fieldWorkers.length}</span>
            <span className="text-[10px] font-black text-emerald-900 bg-emerald-200/70 px-2 py-0.5 rounded-md">
              {availableWorkersCount} available
            </span>
          </div>
        </div>
      </div>

      {/* 2. HIGH-VISIBILITY VIBRANT QUICK ACTIONS */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider block mb-2.5 px-0.5">
          Quick Actions
        </span>
        <div className="grid grid-cols-3 gap-2.5">
          {/* Dispatch Action Button */}
          <button
            type="button"
            onClick={() => onNavigateTab('assignments')}
            className="p-3 rounded-2xl bg-[#006B56] hover:bg-[#005242] active:scale-95 text-white text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1.5 shadow-sm group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-2xs">
              <ClipboardList className="w-4 h-4 text-white stroke-[2.4]" />
            </div>
            <span className="text-xs font-black text-white leading-tight">Dispatch</span>
          </button>

          {/* Facilitations Action Button */}
          <button
            type="button"
            onClick={() => onNavigateTab('facilitations')}
            className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1.5 shadow-sm group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-2xs">
              <Sparkles className="w-4 h-4 text-white stroke-[2.4]" />
            </div>
            <span className="text-xs font-black text-white leading-tight">Facilitations</span>
          </button>

          {/* Field Assessments Action Button */}
          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="p-3 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1.5 shadow-sm group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-2xs">
              <FileCheck className="w-4 h-4 text-white stroke-[2.4]" />
            </div>
            <span className="text-xs font-black text-white leading-tight">Assessments</span>
          </button>
        </div>
      </div>

      {/* 3. ATTENTION REQUIRED OR OPERATIONS CURRENT */}
      {pendingFacilitations.length > 0 ? (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-900">
              ⚡ Facilitation Endorsement: {pendingFacilitations.length} Field Requisition{pendingFacilitations.length > 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('facilitations')}
              className="text-[11px] font-bold text-amber-900 hover:underline flex items-center space-x-0.5 bg-amber-200/80 px-2 py-0.5 rounded-lg"
            >
              <span>Review & Endorse</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[11px] text-amber-800">
            Field workers have submitted travel & operational funding requisitions awaiting your endorsement to Program Manager Grace Ochieng.
          </p>
        </div>
      ) : pendingAssignments.length > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-900">
              ⚠️ Action Needed: {pendingAssignments.length} Unassigned Task{pendingAssignments.length > 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('assignments')}
              className="text-[11px] font-bold text-[#006B56] hover:underline flex items-center space-x-0.5"
            >
              <span>Assign</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[11px] text-amber-800">
            Assistance requests assigned by Programme Manager are waiting for field officer dispatch.
          </p>
        </div>
      ) : pendingReviews.length > 0 ? (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-900">
              📝 {pendingReviews.length} Field Assessment{pendingReviews.length > 1 ? 's' : ''} Awaiting Review
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="text-[11px] font-bold text-purple-900 hover:underline flex items-center space-x-0.5 bg-purple-100 px-2 py-0.5 rounded-lg"
            >
              <span>Review</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[11px] text-purple-800">
            Field workers have submitted assessment forms ready for supervisor sign-off.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1.5 shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#006B56] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">Operations Current</h3>
          <p className="text-[11px] text-slate-500">
            No urgent actions pending. Use the sidebar menu to view your field team, registry, and reports.
          </p>
        </div>
      )}

    </div>
  );
}


