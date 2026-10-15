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
  MapPin
} from 'lucide-react';

export function BeneficiaryMobileDashboard({
  beneficiary,
  requests = [],
  distributions = [],
  notifications = [],
  unreadCount = 0,
  onRequestAssistance,
  onNavigateTab
}) {
  const currentReq = requests[0] || null;
  const currentDist = distributions[0] || null;

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

      {/* 2. COMPACT 4-ICON QUICK SERVICE BAR (CLEAN & MINIMAL) */}
      <div className="grid grid-cols-4 gap-2 py-1">
        {/* Requests */}
        <button
          type="button"
          onClick={() => onNavigateTab('my_requests')}
          className="p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 transition flex flex-col items-center justify-center text-center cursor-pointer shadow-2xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006B56] flex items-center justify-center mb-1 relative group-hover:scale-105 transition">
            <FileText className="w-5 h-5 stroke-[2]" />
            {requests.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#006B56] text-white">
                {requests.length}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-800 truncate w-full">
            Requests
          </span>
        </button>

        {/* Distributions */}
        <button
          type="button"
          onClick={() => onNavigateTab('distributions')}
          className="p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-teal-300 transition flex flex-col items-center justify-center text-center cursor-pointer shadow-2xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-1 relative group-hover:scale-105 transition">
            <Truck className="w-5 h-5 stroke-[2]" />
            {distributions.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-teal-700 text-white">
                {distributions.length}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-800 truncate w-full">
            Schedules
          </span>
        </button>

        {/* Digital ID */}
        <button
          type="button"
          onClick={() => onNavigateTab('id_card')}
          className="p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-blue-300 transition flex flex-col items-center justify-center text-center cursor-pointer shadow-2xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-1 group-hover:scale-105 transition">
            <QrCode className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[11px] font-bold text-slate-800 truncate w-full">
            Digital ID
          </span>
        </button>

        {/* Aid History */}
        <button
          type="button"
          onClick={() => onNavigateTab('history')}
          className="p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-amber-300 transition flex flex-col items-center justify-center text-center cursor-pointer shadow-2xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-1 group-hover:scale-105 transition">
            <Gift className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[11px] font-bold text-slate-800 truncate w-full">
            History
          </span>
        </button>
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
                  currentReq.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentReq.status === 'Fulfilled'
                    ? 'bg-blue-100 text-blue-800'
                    : currentReq.status === 'Rejected'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {currentReq.status_label || currentReq.status || 'Under Review'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                  <span className="font-mono">{currentReq.request_code}</span>
                  <span className="text-[#006B56] font-bold">
                    {currentReq.status === 'Fulfilled'
                      ? '100% Completed'
                      : currentReq.status === 'Approved'
                      ? '75% Approved'
                      : '35% Under Assessment'}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-[#006B56] rounded-full transition-all duration-300"
                    style={{
                      width: currentReq.status === 'Fulfilled' ? '100%' : currentReq.status === 'Approved' ? '75%' : '35%'
                    }}
                  />
                </div>
              </div>
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
