import React from 'react';
import {
  ChevronRight,
  ArrowRight,
  FileText,
  Gift,
  Calendar,
  Package,
  Truck,
  HandHeart,
  QrCode,
  ShieldCheck,
  PhoneCall,
  Info,
  Clock,
  CheckCircle2,
  MapPin,
  PackageCheck,
  AlertCircle
} from 'lucide-react';

export function BeneficiaryMobileDashboard({
  beneficiary,
  requests = [],
  distributions = [],
  notifications = [],
  unreadCount = 0,
  onRequestAssistance,
  onNavigateTab,
  onConfirmReceipt
}) {
  const currentReq = requests[0] || null;
  const currentDist = distributions[0] || null;

  const pendingConfirmReq = requests.find(r => 
    r.status === 'Handed Over' || 
    r.status === 'Awaiting Beneficiary Confirmation' || 
    r.dispatch_status === 'Handed Over' ||
    (r.distributed_at && !r.beneficiary_confirmed && !r.recipient_confirmed)
  );

  const pendingRequestsCount = requests.filter(r => 
    r.status !== 'Rejected' && 
    !r.beneficiary_confirmed && 
    r.status !== 'Fulfilled' && 
    r.status !== 'Distributed'
  ).length;

  const completedAidCount = requests.filter(r => 
    r.beneficiary_confirmed || 
    r.recipient_confirmed || 
    r.status === 'Fulfilled' || 
    r.status === 'Distributed'
  ).length;

  const firstName = beneficiary?.full_name ? beneficiary.full_name.trim().split(' ')[0] : 'Beneficiary';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-12 font-sans text-slate-900 antialiased">
      
      {/* 1. COMPACT TOP GREETING & PRIMARY ACTION */}
      <div className="flex items-start justify-between gap-2.5 sm:gap-3 pt-1 pb-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
            <span className="truncate">{beneficiary?.verification_status || 'Verified Active'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
            Hi, {firstName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span className="font-mono font-bold text-slate-700 bg-slate-100/90 border border-slate-200/70 px-1.5 py-0.5 rounded text-[11px] shrink-0">
              {beneficiary?.beneficiary_code || 'ADRA-SS-000104'}
            </span>
            {beneficiary?.location && (
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-slate-600 font-medium">
                <MapPin className="w-3 h-3 text-[#006B56] shrink-0" />
                <span className="break-words leading-tight">{beneficiary.location}</span>
              </span>
            )}
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onRequestAssistance}
          className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0 mt-0.5"
        >
          <HandHeart className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>Request Aid</span>
        </button>
      </div>

      {/* 1.5 URGENT ACTION: BENEFICIARY RECEIPT CONFIRMATION */}
      {pendingConfirmReq && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-lg shadow-amber-600/20 border border-amber-400 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <PackageCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full inline-block mb-0.5">
                  Action Required • Relief Handover
                </span>
                <h3 className="text-sm font-black leading-tight text-white">
                  Have You Received Your Relief Supplies?
                </h3>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-black/25 text-white px-2 py-0.5 rounded-md font-bold shrink-0">
              #{pendingConfirmReq.request_code}
            </span>
          </div>

          <div className="bg-black/15 backdrop-blur-xs p-2.5 rounded-xl text-xs text-amber-50 leading-relaxed">
            <p className="font-medium">
              Field Worker <strong>{pendingConfirmReq.distributed_by || pendingConfirmReq.assigned_field_worker_name || 'ADRA Relief Officer'}</strong> reported physical handover of your <strong>{pendingConfirmReq.category || 'Relief Package'}</strong> supplies. Please confirm that you have physically received them.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => onConfirmReceipt && onConfirmReceipt(pendingConfirmReq)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white text-amber-950 hover:bg-amber-50 font-black text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Yes, I Received My Supplies</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('my_requests')}
              className="py-2.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition cursor-pointer"
            >
              Details
            </button>
          </div>
        </div>
      )}

      {/* 2. FOUR VIBRANT FOCUSED KPI CARDS (MATCHING PROGRAM MANAGER OVERVIEW STYLE) */}
      <div className="grid grid-cols-2 gap-2.5">
        
        {/* Card 1: Aid Requests (Emerald) */}
        <div
          onClick={() => onNavigateTab('my_requests')}
          className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-300 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-950">Requests</span>
            <div className="w-8 h-8 rounded-xl bg-[#006B56] text-white flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-emerald-950 tracking-tight">{requests.length}</span>
            <span className="text-[10px] font-black text-emerald-900 bg-emerald-200/70 px-2 py-0.5 rounded-md">
              {pendingRequestsCount > 0 ? `${pendingRequestsCount} Active` : (requests.length > 0 ? 'Submitted' : 'None')}
            </span>
          </div>
        </div>

        {/* Card 2: Schedules & Dispatches (Teal) */}
        <div
          onClick={() => onNavigateTab('distributions')}
          className="bg-teal-50/70 rounded-2xl p-3.5 border border-teal-300 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-950">Schedules</span>
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
              <Truck className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-teal-950 tracking-tight">{distributions.length}</span>
            <span className="text-[10px] font-black text-teal-900 bg-teal-200/70 px-2 py-0.5 rounded-md">
              Active Hubs
            </span>
          </div>
        </div>

        {/* Card 3: Digital ID (Blue) */}
        <div
          onClick={() => onNavigateTab('id_card')}
          className="bg-blue-50/70 rounded-2xl p-3.5 border border-blue-300 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-950">Digital ID</span>
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
              <QrCode className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-blue-950 tracking-tight">Active</span>
            <span className="text-[10px] font-black text-blue-900 bg-blue-200/70 px-2 py-0.5 rounded-md">
              QR Ready
            </span>
          </div>
        </div>

        {/* Card 4: Aid History (Amber) */}
        <div
          onClick={() => onNavigateTab('history')}
          className="bg-amber-50/70 rounded-2xl p-3.5 border border-amber-300 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-950">History</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
              <Gift className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-amber-950 tracking-tight">{completedAidCount}</span>
            <span className="text-[10px] font-black text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-md">
              Aid Vouchers
            </span>
          </div>
        </div>

      </div>

      {/* 3. CONSOLIDATED ACTIVE STATUS CARD (ONE SINGLE COMPACT CARD INSTEAD OF MANY) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
        
        {/* Active Request Row */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#006B56]" />
              <span>Current Assistance Request</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('my_requests')}
              className="text-[#006B56] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {currentReq ? (
            <div
              onClick={() => onNavigateTab('my_requests')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-100 transition cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-slate-900 truncate">
                  {currentReq.category ? `${currentReq.category} Assistance` : 'Assistance Case'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  currentReq.beneficiary_confirmed || currentReq.recipient_confirmed
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : currentReq.status === 'Handed Over' || (currentReq.distributed_at && !currentReq.beneficiary_confirmed)
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                    : currentReq.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentReq.status === 'Fulfilled'
                    ? 'bg-blue-100 text-blue-800'
                    : currentReq.status === 'Rejected'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {currentReq.beneficiary_confirmed || currentReq.recipient_confirmed
                    ? '✓ Delivered & Confirmed'
                    : currentReq.status === 'Handed Over' || (currentReq.distributed_at && !currentReq.beneficiary_confirmed)
                    ? 'Awaiting Your Confirmation'
                    : (currentReq.status_label || currentReq.status || 'Under Review')}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                  <span className="font-mono">{currentReq.request_code}</span>
                  <span className="text-[#006B56] font-bold">
                    {currentReq.beneficiary_confirmed || currentReq.recipient_confirmed
                      ? '100% Confirmed'
                      : currentReq.status === 'Handed Over' || currentReq.distributed_at
                      ? '90% Handed Over'
                      : currentReq.status === 'Approved'
                      ? '75% Approved'
                      : '35% Under Assessment'}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-[#006B56] rounded-full transition-all duration-300"
                    style={{
                      width: currentReq.beneficiary_confirmed || currentReq.recipient_confirmed 
                        ? '100%' 
                        : currentReq.status === 'Handed Over' || currentReq.distributed_at
                        ? '90%'
                        : currentReq.status === 'Approved' 
                        ? '75%' 
                        : '35%'
                    }}
                  />
                </div>
              </div>

              {/* Quick Confirm Button if awaiting confirmation */}
              {(currentReq.status === 'Handed Over' || (currentReq.distributed_at && !currentReq.beneficiary_confirmed)) && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onConfirmReceipt) onConfirmReceipt(currentReq);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm You Received This Aid</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
              No active assistance request.{' '}
              <button
                type="button"
                onClick={onRequestAssistance}
                className="text-[#006B56] font-bold hover:underline cursor-pointer"
              >
                Submit one now
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Upcoming Distribution Row */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-700" />
              <span>Next Distribution</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('distributions')}
              className="text-teal-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Schedules</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {currentDist ? (
            <div
              onClick={() => onNavigateTab('distributions')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50/40 border border-slate-100 transition cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentDist.title || currentDist.aid_type || 'Relief Dispatch'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  📍 {currentDist.centre_name || 'Designated Community Center'}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 inline-block mb-0.5">
                  {currentDist.status || 'Upcoming'}
                </span>
                <p className="text-[10px] text-slate-500 font-medium">
                  {currentDist.date || 'Scheduled'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
              No distributions currently scheduled in your area.
            </div>
          )}
        </div>

      </div>

      {/* 4. DISCREET MINIMAL FOOTER: FREE AID & HELPLINE (NO GIANT CARDS) */}
      <div className="pt-2 px-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>ADRA Aid is 100% Free. Never pay for aid.</span>
        </div>

        <div className="flex items-center gap-3 font-semibold text-xs">
          <a
            href="tel:0800720112"
            className="text-[#006B56] hover:underline flex items-center gap-1"
          >
            <PhoneCall className="w-3 h-3" />
            <span>0800-720-112</span>
          </a>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => onNavigateTab('about')}
            className="text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            About ADRA
          </button>
        </div>
      </div>

    </div>
  );
}

export default BeneficiaryMobileDashboard;
