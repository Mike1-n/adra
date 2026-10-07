import React, { useState, useMemo } from 'react';
import {
  Banknote,
  Search,
  CheckCircle2,
  Clock,
  Smartphone,
  MapPin,
  Phone,
  ShieldCheck,
  Receipt,
  ChevronDown,
  ChevronUp,
  X,
  SlidersHorizontal,
  Info
} from 'lucide-react';

export function FinanceDisbursementsView({
  requests = [],
  activeFilter = 'pending_finance',
  onFilterChange,
  onOpenSidebar,
  onOpenDisburse,
  onViewVoucher
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Filtered list based on activeFilter from Sidebar
  const filteredList = useMemo(() => {
    return requests.filter(req => {
      const q = (searchQuery || '').toLowerCase().trim();
      const matchesSearch =
        !q ||
        (req.request_code || req.id || '').toLowerCase().includes(q) ||
        (req.field_worker_name || '').toLowerCase().includes(q) ||
        (req.payout_phone || req.field_worker_phone || '').toLowerCase().includes(q) ||
        (req.purpose || req.title || req.reason || '').toLowerCase().includes(q) ||
        (req.location || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const isPending =
        req.status === 'Approved (Pending Finance Disbursement)' ||
        req.stage === 3 ||
        req.status === 'Approved by Program Manager' ||
        req.status === 'Pending Finance Disbursement';

      const isDisbursed =
        req.stage === 4 ||
        req.status === 'Disbursed' ||
        req.status === 'Disbursed / Paid';

      if (activeFilter === 'pending_finance') return isPending;
      if (activeFilter === 'disbursed') return isDisbursed;
      return true;
    });
  }, [requests, searchQuery, activeFilter]);

  const filterLabel = useMemo(() => {
    switch (activeFilter) {
      case 'pending_finance':
        return 'Pending Payout';
      case 'disbursed':
        return 'Disbursed';
      default:
        return 'All Requisitions';
    }
  }, [activeFilter]);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-3.5 pb-16 animate-in fade-in duration-150">
      
      {/* 1. SIDEBAR FILTER TRIGGER & SEARCH BAR */}
      <div className="flex items-center gap-2">
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition shadow-2xs cursor-pointer shrink-0"
            title="Open sidebar to switch disbursement filter"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#006B56]" />
            <span className="text-xs text-[#006B56] font-extrabold">{filterLabel}</span>
            <span className="bg-emerald-100 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded font-black">
              {filteredList.length}
            </span>
          </button>
        )}

        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search worker, phone, location..."
            className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#006B56] text-slate-900 placeholder:text-slate-400 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. REQUISITIONS VIEW */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Banknote className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">No Requisitions Found</h4>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              {activeFilter === 'pending_finance'
                ? 'No field facilitation requests are currently waiting for Finance disbursement.'
                : 'No requisitions matching your filter criteria.'}
            </p>
          </div>
        ) : (
          <>
            {/* 2A. CLEAN PHONE MODE: NUMBERED • NAME • AMOUNT • ACTION + VIEW BAR */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredList.map((req, idx) => {
                const isExpanded = expandedId === req.id;
                const isReadyForPayout =
                  req.status === 'Approved (Pending Finance Disbursement)' ||
                  req.stage === 3 ||
                  req.status === 'Approved by Program Manager' ||
                  req.status === 'Pending Finance Disbursement';

                const isDisbursed = req.stage === 4 || req.status === 'Disbursed' || req.status === 'Disbursed / Paid';
                const payoutPhone = req.payout_phone || req.field_worker_phone || req.recipient_phone;
                const preferredMethod = req.preferred_payout || req.payout_channel || 'm-Gurush Mobile Money';

                return (
                  <div key={req.id} className="bg-white transition">
                    
                    {/* Clean compact main row */}
                    <div className="p-3.5 flex items-center justify-between gap-2.5">
                      {/* Number badge & Worker Name */}
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0 border border-slate-200">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 truncate">
                          <span className="text-xs font-black text-slate-900 block truncate">
                            {req.field_worker_name || req.worker_name || 'Field Worker'}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 font-bold">
                            {req.request_code || req.id}
                          </span>
                        </div>
                      </div>

                      {/* Amount & Status */}
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-[#006B56] block font-mono">
                          SSP {Number(req.amount || 0).toLocaleString()}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase inline-block ${
                          isDisbursed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {isDisbursed ? 'Paid' : 'Ready'}
                        </span>
                      </div>

                      {/* Direct Action Button */}
                      <div className="shrink-0">
                        {isReadyForPayout && onOpenDisburse ? (
                          <button
                            type="button"
                            onClick={() => onOpenDisburse(req)}
                            className="px-3 py-1.5 bg-[#006B56] hover:bg-[#005242] text-white font-bold text-xs rounded-xl shadow-2xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Pay</span>
                          </button>
                        ) : isDisbursed && onViewVoucher ? (
                          <button
                            type="button"
                            onClick={() => onViewVoucher(req)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Voucher</span>
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* View Bar toggle */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(req.id)}
                      className="w-full py-1.5 px-3.5 bg-slate-50/70 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-[11px] font-semibold flex items-center justify-between transition cursor-pointer border-t border-slate-100"
                    >
                      <span className="flex items-center gap-1">
                        <Info className="w-3 h-3 text-slate-400" />
                        <span>{isExpanded ? 'Hide Details' : 'View More Information'}</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* Expanded details container */}
                    {isExpanded && (
                      <div className="p-3.5 bg-slate-50/90 border-t border-slate-100 text-xs space-y-2 animate-in fade-in-50 duration-150">
                        {/* Date, Location, and Channel */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 rounded-xl bg-white border border-slate-200/80 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Mission Location</span>
                            <div className="flex items-center gap-1 font-semibold text-slate-800">
                              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{req.location || req.payam || req.state || 'Field Depot'}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              {new Date(req.created_at || req.date || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-white border border-slate-200/80 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Payout Channel</span>
                            <div className="flex items-center gap-1 font-semibold text-slate-800">
                              <Smartphone className="w-3 h-3 text-[#006B56]" />
                              <span className="truncate">{preferredMethod}</span>
                            </div>
                            {payoutPhone && (
                              <a href={`tel:${payoutPhone}`} className="font-mono text-[10px] font-bold text-slate-700 block">
                                {payoutPhone}
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Purpose */}
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-[11px] text-slate-700">
                          <span className="font-bold text-slate-900 block mb-0.5">Facilitation Purpose:</span>
                          <p className="leading-relaxed">
                            {req.purpose || req.title || 'Direct field operational facilitation stipend.'}
                          </p>
                        </div>

                        {/* Remarks / Endorsements */}
                        {req.pm_remarks && (
                          <div className="p-2 rounded-xl bg-teal-50 border border-teal-100 text-[11px] text-teal-950 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                            <p className="italic">
                              <span className="font-bold">{req.pm_approved_by || 'PM'}: </span>
                              "{req.pm_remarks}"
                            </p>
                          </div>
                        )}

                        {/* Line items breakdown if available */}
                        {req.breakdown && req.breakdown.length > 0 && (
                          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden text-[11px]">
                            <div className="px-2.5 py-1 bg-slate-50 font-bold text-slate-600 text-[10px] uppercase">
                              Itemized Breakdown
                            </div>
                            {req.breakdown.map((item, idx) => (
                              <div key={idx} className="p-2 flex items-center justify-between">
                                <span className="font-medium text-slate-800 truncate">{item.item || item.description}</span>
                                <span className="font-mono font-bold text-slate-900 shrink-0 ml-2">
                                  SSP {Number(item.total || item.amount || 0).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 2B. DESKTOP / TABLET DATA TABLE (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-700">
                    <th className="py-3 px-3 text-center w-10">#</th>
                    <th className="py-3 px-4">Req # & Date</th>
                    <th className="py-3 px-4">Field Worker</th>
                    <th className="py-3 px-4">Location & Purpose</th>
                    <th className="py-3 px-4">Payout Channel</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((req, idx) => {
                    const isReadyForPayout =
                      req.status === 'Approved (Pending Finance Disbursement)' ||
                      req.stage === 3 ||
                      req.status === 'Approved by Program Manager' ||
                      req.status === 'Pending Finance Disbursement';

                    const isDisbursed = req.stage === 4 || req.status === 'Disbursed' || req.status === 'Disbursed / Paid';
                    const payoutPhone = req.payout_phone || req.field_worker_phone || req.recipient_phone;
                    const preferredMethod = req.preferred_payout || req.payout_channel || 'm-Gurush';

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/60 transition">
                        {/* Number Index */}
                        <td className="py-3.5 px-3 align-top text-center text-slate-400 font-mono font-bold text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Req Code & Date */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 block">
                            {req.request_code || req.id}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(req.created_at || req.date || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </td>

                        {/* Field Worker */}
                        <td className="py-3.5 px-4 align-top">
                          <span className="font-bold text-slate-900 block">
                            {req.field_worker_name || req.worker_name || 'Field Worker'}
                          </span>
                          {payoutPhone && (
                            <span className="font-mono text-[11px] text-slate-500 block">
                              {payoutPhone}
                            </span>
                          )}
                        </td>

                        {/* Location & Purpose */}
                        <td className="py-3.5 px-4 align-top max-w-[220px]">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-800">
                            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{req.location || req.payam || req.state || 'Field Depot'}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {req.purpose || req.title || 'Field facilitation'}
                          </p>
                        </td>

                        {/* Payout Channel */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            <Smartphone className="w-3 h-3 text-[#006B56]" />
                            <span>{preferredMethod}</span>
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <span className="font-mono font-black text-[#006B56] text-xs">
                            SSP {Number(req.amount || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isDisbursed
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}>
                            {isDisbursed ? 'Disbursed' : 'PM Approved'}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                          {isReadyForPayout && onOpenDisburse ? (
                            <button
                              type="button"
                              onClick={() => onOpenDisburse(req)}
                              className="px-3 py-1.5 rounded-xl bg-[#006B56] hover:bg-[#005242] text-white font-bold text-xs inline-flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span>Disburse</span>
                            </button>
                          ) : isDisbursed && onViewVoucher ? (
                            <button
                              type="button"
                              onClick={() => onViewVoucher(req)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Voucher</span>
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
