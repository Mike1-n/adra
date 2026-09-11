import React from 'react';
import {
  ChevronRight,
  ArrowRight,
  FileText,
  Gift,
  Bell,
  MessageSquare,
  Calendar,
  Megaphone,
  Package,
  Truck,
  HandHeart
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
  const latestNotif = notifications[0] || null;

  // Extract initials for clean profile avatar
  const initials = beneficiary?.full_name
    ? beneficiary.full_name
        .trim()
        .split(/\s+/)
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ID';

  return (
    <div className="space-y-3.5 p-4 pb-12 bg-[#F4F7F5] text-slate-900 font-sans">
      {/* 1. CLEAN CONSOLIDATED BENEFICIARY PROFILE (COMPACT) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/70 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar circle with initials */}
          <div className="w-10 h-10 rounded-xl bg-[#006B56] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
            {initials}
          </div>

          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 block leading-tight">
              Welcome back,
            </span>
            <h2 className="text-sm font-black text-slate-900 tracking-tight truncate leading-tight mt-0.5">
              {beneficiary?.full_name || 'Beneficiary'}
            </h2>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                {beneficiary?.beneficiary_code || 'ADRA-SS-PENDING'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. QUICK ACTIONS GRID (4 CLEAN TILES) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Quick Actions
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab('my_requests')}
            className="text-xs font-bold text-[#006B56] hover:underline flex items-center cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {/* My Requests */}
          <button
            type="button"
            onClick={() => onNavigateTab('my_requests')}
            className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-2xs hover:shadow-sm group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition relative">
              <FileText className="w-6 h-6 stroke-[2.5] text-black" />
              {requests.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-black text-white text-[9px] font-black rounded-full shadow-2xs">
                  {requests.length}
                </span>
              )}
            </div>
            <span className="text-[11px] font-extrabold text-black leading-tight">
              My Requests
            </span>
          </button>

          {/* Aid History */}
          <button
            type="button"
            onClick={() => onNavigateTab('history')}
            className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-2xs hover:shadow-sm group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition">
              <Gift className="w-6 h-6 stroke-[2.5] text-black" />
            </div>
            <span className="text-[11px] font-extrabold text-black leading-tight">
              Aid History
            </span>
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => onNavigateTab('notifications')}
            className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-2xs hover:shadow-sm group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition relative">
              <Bell className="w-6 h-6 stroke-[2.5] text-black" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-[#E53E3E] text-white text-[9px] font-black rounded-full shadow-2xs">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-extrabold text-black leading-tight">
              Notifications
            </span>
          </button>

          {/* Feedback & Complaints */}
          <button
            type="button"
            onClick={() => onNavigateTab('feedback')}
            className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-2xs hover:shadow-sm group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition">
              <MessageSquare className="w-6 h-6 stroke-[2.5] text-black" />
            </div>
            <span className="text-[11px] font-extrabold text-black leading-tight">
              Feedback
            </span>
          </button>
        </div>
      </div>

      {/* 3. PRIMARY ACTION: REQUEST ASSISTANCE */}
      <button
        type="button"
        onClick={onRequestAssistance}
        className="w-full py-3.5 px-5 rounded-2xl bg-[#006B56] hover:bg-[#005745] text-white font-extrabold text-sm flex items-center justify-between shadow-sm cursor-pointer transition active:scale-[0.99]"
      >
        <div className="flex items-center gap-2.5">
          <HandHeart className="w-5 h-5 text-white shrink-0" />
          <span className="tracking-wide">Request Assistance</span>
        </div>
        <ArrowRight className="w-5 h-5 text-white shrink-0" />
      </button>

      {/* 4. DYNAMIC: MY CURRENT REQUEST (ONLY REAL DATA) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#006B56]" />
            My Current Request
          </span>
          {requests.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('my_requests')}
              className="text-[11px] font-bold text-[#006B56] hover:underline cursor-pointer"
            >
              View All ({requests.length})
            </button>
          )}
        </div>

        {currentReq ? (
          <div
            onClick={() => onNavigateTab('my_requests')}
            className="bg-white rounded-2xl p-3.5 shadow-2xs border border-slate-100 flex items-center justify-between cursor-pointer hover:border-emerald-200 transition"
          >
            <div className="w-11 h-11 rounded-xl bg-[#EAF5F0] text-[#006B56] flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>

            <div className="flex-1 px-3 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-extrabold text-slate-900 truncate">
                  {currentReq.category ? `${currentReq.category} Assistance` : 'Assistance Request'}
                </h4>
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
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                {currentReq.request_code}
              </p>
              {currentReq.created_at && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Submitted: {new Date(currentReq.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 border border-slate-200/70 text-center space-y-1.5 shadow-2xs">
            <p className="text-xs font-bold text-slate-700">No active assistance requests</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Need food rations, clean water, or agricultural support?
            </p>
            <button
              type="button"
              onClick={onRequestAssistance}
              className="text-xs font-extrabold text-[#006B56] hover:underline pt-0.5 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Submit a Request</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* 5. DYNAMIC: UPCOMING DISTRIBUTION (ONLY REAL DATA) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#006B56]" />
            Upcoming Distribution
          </span>
          {distributions.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('distributions')}
              className="text-[11px] font-bold text-[#006B56] hover:underline cursor-pointer"
            >
              Schedules ({distributions.length})
            </button>
          )}
        </div>

        {currentDist ? (
          <div
            onClick={() => onNavigateTab('distributions')}
            className="bg-white rounded-2xl p-3.5 shadow-2xs border border-slate-100 flex items-center justify-between cursor-pointer hover:border-emerald-200 transition"
          >
            <div className="w-11 h-11 rounded-xl bg-[#EAF5F0] text-[#006B56] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>

            <div className="flex-1 px-3 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-900 truncate">
                  {currentDist.title || currentDist.aid_type || 'Aid Distribution'}
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0 ml-2">
                  {currentDist.status || 'Upcoming'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1 font-medium">
                <span>📅 {currentDist.date || 'Scheduled'}</span>
                {currentDist.time_window && <span>🕒 {currentDist.time_window}</span>}
              </div>
              {currentDist.centre_name && (
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  📍 {currentDist.centre_name}
                </p>
              )}
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/70 text-xs text-slate-500 shadow-2xs">
            No distributions currently scheduled in your area.
          </div>
        )}
      </div>

      {/* 6. DYNAMIC: LATEST NOTIFICATION (ONLY IF NOTIFICATIONS EXIST) */}
      {latestNotif && (
        <div
          onClick={() => onNavigateTab('notifications')}
          className="bg-white rounded-2xl p-3.5 shadow-2xs border border-slate-100 flex items-center justify-between cursor-pointer hover:border-emerald-200 transition"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006B56] flex items-center justify-center shrink-0 mr-2.5">
            <Megaphone className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {latestNotif.title || 'Latest Notification'}
              </h4>
              {latestNotif.created_at && (
                <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                  {latestNotif.created_at}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
              {latestNotif.message}
            </p>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
        </div>
      )}
    </div>
  );
}
