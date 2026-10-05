import React, { useMemo } from 'react';
import {
  Briefcase,
  Clock,
  Users,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Banknote,
  ShieldCheck,
  UserCheck,
  AlertCircle
} from 'lucide-react';

export function PMOverviewView({
  requests = [],
  beneficiaries = [],
  facilitations = [],
  supervisors = [],
  onNavigateTab
}) {
  // 1. Pending Facilitations needing PM sign-off (Stage 2)
  const pendingPMFacilitations = useMemo(() => {
    return facilitations.filter(
      f => f.status !== 'Rejected by Program Manager' &&
           f.status !== 'Rejected' &&
           f.stage !== -1 &&
           !f.returned_to_worker &&
           !f.status?.toLowerCase()?.includes('reject') &&
           (f.status === 'Pending Program Manager Approval' || f.stage === 2 || f.status === 'Endorsed by Supervisor')
    );
  }, [facilitations]);

  // 2. Pending Assistance Requests needing PM decision
  const pendingPMAssistance = useMemo(() => {
    return requests.filter(
      r => r.status !== 'Rejected' &&
           r.status_label !== 'Rejected by PM' &&
           !r.returned_to_worker &&
           !r.status?.toLowerCase()?.includes('reject') &&
           (r.status === 'Pending' || 
            r.status === 'Pending Review' || 
            r.status === 'My Decision' || 
            r.status === 'Submitted' ||
            r.status === 'Awaiting Program Manager Decision' ||
            r.status === 'Forwarded to Program Manager' ||
            r.status === 'Assessment Submitted')
    );
  }, [requests]);

  // Total pending decisions for PM
  const totalPendingPM = pendingPMFacilitations.length + pendingPMAssistance.length;

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* 1. FOUR VIBRANT FOCUSED KPI CARDS */}
      <div className="grid grid-cols-2 gap-2.5">
        
        {/* KPI 1: Pending Authorizations (Amber) */}
        <div
          onClick={() => onNavigateTab && onNavigateTab(pendingPMFacilitations.length > 0 ? 'facilitations' : 'requests')}
          className="bg-amber-50/70 rounded-2xl p-3.5 border border-amber-300 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-950">Pending Sign-offs</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-amber-950 tracking-tight">{totalPendingPM}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
              totalPendingPM > 0 
                ? 'text-amber-900 bg-amber-200/80 border border-amber-300 animate-pulse' 
                : 'text-slate-600 bg-slate-200/70'
            }`}>
              {totalPendingPM > 0 ? 'Needs Action' : 'All Clear'}
            </span>
          </div>
        </div>

        {/* KPI 2: Field Facilitations (Emerald) */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('facilitations')}
          className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-300 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-950">Facilitations</span>
            <div className="w-8 h-8 rounded-xl bg-[#006B56] text-white flex items-center justify-center shadow-2xs shrink-0">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-emerald-950 tracking-tight">{facilitations.length}</span>
            <span className="text-[10px] font-black text-emerald-900 bg-emerald-200/70 px-2 py-0.5 rounded-md">
              {pendingPMFacilitations.length} Awaiting PM
            </span>
          </div>
        </div>

        {/* KPI 3: Field Supervisors (Teal) */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('supervisors')}
          className="bg-teal-50/70 rounded-2xl p-3.5 border border-teal-300 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-950">Supervisors</span>
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-teal-950 tracking-tight">{supervisors.length}</span>
            <span className="text-[10px] font-black text-teal-900 bg-teal-200/70 px-2 py-0.5 rounded-md">
              Field Operations
            </span>
          </div>
        </div>

        {/* KPI 4: Beneficiaries (Blue) */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('beneficiaries')}
          className="bg-blue-50/70 rounded-2xl p-3.5 border border-blue-300 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-950">Beneficiaries</span>
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-blue-950 tracking-tight">{beneficiaries.length}</span>
            <span className="text-[10px] font-black text-blue-900 bg-blue-200/70 px-2 py-0.5 rounded-md">
              Registered
            </span>
          </div>
        </div>

      </div>

      {/* 2. HIGH-VISIBILITY QUICK ACTIONS */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider block mb-2.5 px-0.5">
          Quick Actions
        </span>
        <div className="grid grid-cols-3 gap-2.5">
          {/* Facilitations Action Button */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('facilitations')}
            className="p-3 rounded-2xl bg-[#006B56] hover:bg-[#005242] active:scale-95 text-white text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1.5 shadow-sm group relative"
          >
            {pendingPMFacilitations.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-xs">
                {pendingPMFacilitations.length}
              </span>
            )}
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-2xs">
              <Banknote className="w-4 h-4 text-white stroke-[2.4]" />
            </div>
            <span className="text-xs font-black text-white leading-tight">Facilitations</span>
          </button>

          {/* Assistance Action Button */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('requests')}
            className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1.5 shadow-sm group relative"
          >
            {pendingPMAssistance.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-xs">
                {pendingPMAssistance.length}
              </span>
            )}
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-2xs">
              <Clock className="w-4 h-4 text-white stroke-[2.4]" />
            </div>
            <span className="text-xs font-black text-white leading-tight">Assistance</span>
          </button>

          {/* Supervisors Action Button */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('supervisors')}
            className="p-3 rounded-2xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1.5 shadow-sm group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-2xs">
              <UserCheck className="w-4 h-4 text-white stroke-[2.4]" />
            </div>
            <span className="text-xs font-black text-white leading-tight">Supervisors</span>
          </button>
        </div>
      </div>

      {/* 3. DYNAMIC ATTENTION REQUIRED BANNER / OPERATIONS CURRENT */}
      {pendingPMFacilitations.length > 0 ? (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Facilitation Authorization ({pendingPMFacilitations.length})</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('facilitations')}
              className="text-[11px] font-black text-amber-950 bg-amber-200/90 hover:bg-amber-300 px-2.5 py-1 rounded-xl transition flex items-center gap-1 shadow-2xs"
            >
              <span>Review All</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Top Facilitation Item Mini-Card */}
          {pendingPMFacilitations[0] && (
            <div
              onClick={() => onNavigateTab && onNavigateTab('facilitations')}
              className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs cursor-pointer hover:border-amber-400 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-slate-900">
                  {pendingPMFacilitations[0].request_code || pendingPMFacilitations[0].id}
                </span>
                <span className="font-black text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  SSP {Number(pendingPMFacilitations[0].amount || 0).toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-semibold mt-1">
                {pendingPMFacilitations[0].title || pendingPMFacilitations[0].reason || 'Field Operational Facilitation'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Worker: {pendingPMFacilitations[0].field_worker_name || 'John Deng'} • {pendingPMFacilitations[0].location || 'Field Location'}
              </p>
            </div>
          )}
        </div>
      ) : pendingPMAssistance.length > 0 ? (
        <div className="bg-blue-50 border border-blue-300 rounded-2xl p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-blue-900">
              📋 Assistance Approval ({pendingPMAssistance.length} Pending)
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('requests')}
              className="text-[11px] font-black text-blue-950 bg-blue-200/90 hover:bg-blue-300 px-2.5 py-1 rounded-xl transition flex items-center gap-1 shadow-2xs"
            >
              <span>Authorize</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[11px] text-blue-800">
            Beneficiary assistance assessments submitted by field teams require Programme Manager sign-off.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center space-y-1.5 shadow-2xs">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#006B56] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-black text-slate-900">Operations Current</h3>
          <p className="text-[11px] text-slate-500">
            No urgent actions pending. All field worker facilitations and beneficiary assistance requests are up to date.
          </p>
        </div>
      )}

    </div>
  );
}

export default PMOverviewView;
