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
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

function matchesBeneficiaryLocation(progLocation, beneficiary) {
  if (!progLocation || !beneficiary) return false;
  const pLoc = progLocation.toLowerCase();
  if (pLoc.includes('nationwide') || pLoc.includes('all south sudan')) return true;

  const benRaw = [
    beneficiary.state,
    beneficiary.county,
    beneficiary.payam,
    beneficiary.location
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!benRaw) return false;

  const stopWords = new Set(['south', 'sudan', 'state', 'county', 'payam', 'town', 'city', 'central', 'and', 'the', 'all']);
  const progTokens = pLoc
    .split(/[\s,()/&-]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 3 && !stopWords.has(t));

  const benTokens = benRaw
    .split(/[\s,()/&-]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 3 && !stopWords.has(t));

  return (
    progTokens.some(token => benRaw.includes(token)) ||
    benTokens.some(token => pLoc.includes(token))
  );
}

export function BeneficiaryMobileDashboard({
  beneficiary,
  requests = [],
  distributions = [],
  activeProgrammes = [],
  notifications = [],
  unreadCount = 0,
  onRequestAssistance,
  onApplyForProgramme,
  onNavigateTab,
  onConfirmReceipt
}) {
  const matchingOperations = (activeProgrammes || []).filter(
    p => (!p.status || p.status.toLowerCase() === 'active') && matchesBeneficiaryLocation(p.location, beneficiary)
  );
  const currentReq = requests[0] || null;
  const currentDist = distributions[0] || null;

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

      {/* 2b. ACTIVE FIELD OPERATIONS IN BENEFICIARY'S LOCATION */}
      {matchingOperations.length > 0 && (
        <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200/90 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#006B56] text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-emerald-950">
                  Active Field Operations in Your Area
                </h2>
                <p className="text-[11px] text-emerald-800/80">
                  Ongoing ADRA programmes open for household applications in {beneficiary?.location || 'your location'}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-950 text-[10px] font-black shrink-0">
              {matchingOperations.length} Active
            </span>
          </div>

          <div className="space-y-2.5">
            {matchingOperations.map((op) => (
              <div
                key={op.id || op.project_code}
                className="bg-white rounded-xl border border-emerald-200/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold text-[#006B56] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                      {op.project_code || 'ACTIVE'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      {op.location}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {op.project_name}
                  </h3>
                  {op.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {op.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onApplyForProgramme ? onApplyForProgramme(op) : onRequestAssistance()}
                  className="px-3.5 py-2 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                    : (currentReq.status === 'Handed Over' || currentReq.status === 'goods_collected_by_beneficiary' || currentReq.dispatch_status === 'Collected by Beneficiary' || ((currentReq.distributed_at || currentReq.goods_collected_at) && !currentReq.beneficiary_confirmed))
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
                    : (currentReq.status === 'Handed Over' || currentReq.status === 'goods_collected_by_beneficiary' || currentReq.dispatch_status === 'Collected by Beneficiary' || ((currentReq.distributed_at || currentReq.goods_collected_at) && !currentReq.beneficiary_confirmed))
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
              {((currentReq.status === 'Handed Over' || currentReq.status === 'goods_collected_by_beneficiary' || currentReq.dispatch_status === 'Collected by Beneficiary' || currentReq.distributed_at || currentReq.goods_collected_at) && !currentReq.beneficiary_confirmed && !currentReq.recipient_confirmed) && (
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
                    <span>Confirm Received</span>
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
            onClick={() => onNavigateTab && onNavigateTab('help')}
            className="text-[#006B56] hover:underline cursor-pointer flex items-center gap-1 font-bold"
          >
            <HelpCircle className="w-3 h-3 text-[#006B56]" />
            <span>Help & FAQs</span>
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('about')}
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
