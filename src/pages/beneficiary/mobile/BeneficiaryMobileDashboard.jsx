import React from 'react';
import {
  HandHeart,
  CreditCard,
  Truck,
  History,
  MessageSquareQuote,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle,
  Calendar,
  ChevronRight,
  Phone,
  Sparkles,
  QrCode,
  Package,
  ArrowRight
} from 'lucide-react';
import { Button } from '../../../components/common/Button';

export function BeneficiaryMobileDashboard({
  beneficiary,
  requests = [],
  distributions = [],
  onRequestAssistance,
  onNavigateTab
}) {
  // Find pending or active request
  const latestRequest = requests[0] || null;
  const upcomingDist = distributions[0] || null;

  return (
    <div className="space-y-4 p-4 pb-20 bg-white text-slate-900">
      {/* Beneficiary Header Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-slate-50 border border-emerald-200 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={beneficiary?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'}
              alt=""
              className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs"
            />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Welcome back
              </span>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {beneficiary?.full_name || 'Mary Nyambura'}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  {beneficiary?.beneficiary_code || 'ADRA-SS-000125'}
                </span>
                <span className="text-[10px] text-slate-400">•</span>
                <span className="text-[11px] text-slate-500 truncate max-w-[130px]">
                  {beneficiary?.location?.split(',')[0] || 'Turkana West'}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {beneficiary?.verification_status === 'Flagged for Review' ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Flagged
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* HERO PRIMARY ACTION: REQUEST ASSISTANCE */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-700/20 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/40 text-emerald-100 text-[10px] font-bold border border-emerald-400/40">
            <Sparkles className="w-3 h-3 text-emerald-200" />
            Humanitarian Support Active
          </div>

          <div>
            <h3 className="text-lg font-black tracking-tight text-white">
              Need Assistance?
            </h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed mt-0.5 max-w-xs">
              Apply for food rations, clean water, medical aid, shelter, or seeds in under 3 minutes.
            </p>
          </div>

          <button
            type="button"
            onClick={onRequestAssistance}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer active:scale-98"
          >
            <HandHeart className="w-4 h-4 text-emerald-600" />
            <span>Select & Request Assistance</span>
            <ArrowRight className="w-4 h-4 text-emerald-600 ml-1" />
          </button>
        </div>
      </div>

      {/* RECENT REQUEST STATUS CARD */}
      {latestRequest && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              Latest Assistance Request
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('my_requests')}
              className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              View All ({requests.length})
            </button>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-700">
                {latestRequest.request_code}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                latestRequest.status === 'Approved'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : latestRequest.status === 'Pending' || latestRequest.status === 'Submitted'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-blue-100 text-blue-800 border-blue-300'
              }`}>
                {latestRequest.status_label || latestRequest.status}
              </span>
            </div>

            <div className="text-xs">
              <span className="font-bold text-slate-900 block">{latestRequest.category}</span>
              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                {latestRequest.description}
              </p>
            </div>

            {latestRequest.review_notes && (
              <p className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="font-semibold">Reviewer Notes: </span>
                {latestRequest.review_notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ACTIVE COLLECTION TOKEN CARD */}
      {upcomingDist && upcomingDist.collection_token && (
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-700" />
              Upcoming Gate Collection
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('distributions')}
              className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
            >
              Details
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-300">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Gate Token
              </span>
              <span className="font-mono text-sm font-black text-emerald-800">
                {upcomingDist.collection_token}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {upcomingDist.centre_name} • {upcomingDist.date}
              </span>
            </div>
            <QrCode className="w-8 h-8 text-emerald-700" />
          </div>
        </div>
      )}

      {/* QUICK SERVICES GRID */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-800 block px-1">
          Beneficiary Services
        </span>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateTab('id_card')}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 text-left hover:border-emerald-300 hover:shadow-xs transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">My Digital ID</span>
            <span className="text-[10px] text-slate-400">QR pass & verification</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('distributions')}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 text-left hover:border-emerald-300 hover:shadow-xs transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">Schedules</span>
            <span className="text-[10px] text-slate-400">Depots & date slots</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('history')}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 text-left hover:border-emerald-300 hover:shadow-xs transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
              <History className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">Aid History</span>
            <span className="text-[10px] text-slate-400">Past rations & receipts</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('feedback')}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 text-left hover:border-emerald-300 hover:shadow-xs transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">Feedback & Report</span>
            <span className="text-[10px] text-slate-400">Confidential grievance</span>
          </button>
        </div>
      </div>

      {/* TOLL-FREE HOTLINE BANNER */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              ADRA Toll-Free Hotline
            </span>
            <span className="text-xs font-extrabold text-slate-900">
              0800-720-112
            </span>
          </div>
        </div>

        <a
          href="tel:0800720112"
          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
        >
          Call Free
        </a>
      </div>
    </div>
  );
}
