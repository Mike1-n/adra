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
  Download,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ArrowRight,
  SlidersHorizontal
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

  // Tab counts
  const pendingRequests = useMemo(() => {
    return requests.filter(
      r => r.status === 'Approved (Pending Finance Disbursement)' ||
           r.stage === 3 ||
           r.status === 'Approved by Program Manager' ||
           r.status === 'Pending Finance Disbursement'
    );
  }, [requests]);

  const disbursedRequests = useMemo(() => {
    return requests.filter(
      r => r.stage === 4 || r.status === 'Disbursed' || r.status === 'Disbursed / Paid'
    );
  }, [requests]);

  const pendingTotal = pendingRequests.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const disbursedTotal = disbursedRequests.reduce((sum, r) => sum + Number(r.amount || 0), 0);

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

      {/* 2. SUMMARY STRIP */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-3 px-4 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            {activeFilter === 'pending_finance' ? 'Ready For Immediate Payout' : activeFilter === 'disbursed' ? 'Total Disbursed' : 'Facilitations Total'}
          </span>
          <div className="text-base font-black text-emerald-400">
            SSP {activeFilter === 'pending_finance' ? pendingTotal.toLocaleString() : activeFilter === 'disbursed' ? disbursedTotal.toLocaleString() : (pendingTotal + disbursedTotal).toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-300 block">
            {filteredList.length} Requisition{filteredList.length === 1 ? '' : 's'}
          </span>
          <span className="text-[10px] text-slate-400">
            Authorized by PM
          </span>
        </div>
      </div>

      {/* 3. REQUISITIONS LIST */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2 shadow-2xs">
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
          filteredList.map(req => {
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
              <div
                key={req.id}
                className={`bg-white rounded-3xl border transition shadow-2xs overflow-hidden ${
                  isReadyForPayout
                    ? 'border-amber-200/90 ring-1 ring-amber-100/80'
                    : isDisbursed
                    ? 'border-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="p-4 space-y-3">
                  {/* Top: Worker & Code */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {req.field_worker_name || req.worker_name || 'Field Worker'}
                        </span>
                        <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                          {req.request_code || req.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{req.location || req.payam || req.state || 'Field Mission'}</span>
                        </span>
                        <span>•</span>
                        <span>{new Date(req.created_at || req.date || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-[#006B56] tracking-tight">
                        SSP {Number(req.amount || 0).toLocaleString()}
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded block text-center ${
                        isDisbursed
                          ? 'bg-emerald-100 text-emerald-800'
                          : isReadyForPayout
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isDisbursed ? 'PAID & VOUCHERED' : 'READY FOR PAYOUT'}
                      </span>
                    </div>
                  </div>

                  {/* Payout Channel Strip */}
                  <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Smartphone className="w-3.5 h-3.5 text-[#006B56]" />
                      <span className="font-medium truncate max-w-[140px]">{preferredMethod}</span>
                    </div>
                    {payoutPhone && (
                      <a
                        href={`tel:${payoutPhone}`}
                        className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200"
                      >
                        <Phone className="w-3 h-3 text-[#006B56]" />
                        <span>{payoutPhone}</span>
                      </a>
                    )}
                  </div>

                  {/* Purpose Narrative */}
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {req.purpose || req.title || req.reason || 'Operational mission facilitation and field outreach stipend.'}
                  </p>

                  {/* Supervisor & PM Endorsement Badges */}
                  <div className="space-y-1.5 text-[11px]">
                    {req.supervisor_remarks && (
                      <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100 text-emerald-950 flex items-start gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#006B56] shrink-0 mt-0.5" />
                        <p className="italic">
                          <span className="font-bold">{req.supervisor_endorsed_by || 'Supervisor'}: </span>
                          "{req.supervisor_remarks}"
                        </p>
                      </div>
                    )}
                    {req.pm_remarks && (
                      <div className="bg-teal-50/70 p-2 rounded-xl border border-teal-100 text-teal-950 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                        <p className="italic">
                          <span className="font-bold">{req.pm_approved_by || 'PM Grace'}: </span>
                          "{req.pm_remarks}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Disbursed Voucher Info (if paid) */}
                  {isDisbursed && req.finance_disbursement && (
                    <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 text-xs text-emerald-950 space-y-2">
                      <div className="flex items-center justify-between font-black text-emerald-900">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-[#006B56]" />
                          <span>Disbursement Voucher</span>
                        </div>
                        <span className="font-mono text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                          {req.finance_disbursement.voucher_reference || 'VOUCH-PAID'}
                        </span>
                      </div>
                      
                      <div className="text-[11px] text-slate-600 flex items-center justify-between">
                        <span>Txn: <strong className="font-mono text-slate-800">{req.finance_disbursement.transaction_ref || 'TXN-OK'}</strong></span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-100">
                          ✓ Settled
                        </span>
                      </div>

                      {/* View Receipt Button */}
                      <button
                        type="button"
                        onClick={() => onViewVoucher(req)}
                        className="w-full py-2 bg-[#006B56] hover:bg-[#005242] text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Receipt</span>
                      </button>
                    </div>
                  )}

                  {/* ACTION: Disburse Payout Button */}
                  {isReadyForPayout && (
                    <button
                      type="button"
                      onClick={() => onOpenDisburse(req)}
                      className="w-full py-2.5 bg-gradient-to-r from-[#006B56] to-emerald-600 hover:from-[#005242] hover:to-emerald-700 text-white font-black text-xs rounded-2xl shadow-xs active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Execute Disbursement & Generate Voucher</span>
                    </button>
                  )}

                  {/* Accordion line-items toggle */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    className="w-full pt-1.5 text-slate-500 hover:text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer border-t border-slate-100"
                  >
                    <span>{isExpanded ? 'Hide Line Items' : 'View Itemized Breakdown'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Detailed line items */}
                {isExpanded && (
                  <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 text-xs space-y-2">
                    {req.breakdown && req.breakdown.length > 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                        {req.breakdown.map((item, idx) => (
                          <div key={idx} className="p-2.5 flex items-center justify-between text-[11px]">
                            <div>
                              <span className="font-bold text-slate-800 block">
                                {item.item || item.description || `Line Item #${idx + 1}`}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {item.category || req.category || 'Operational Facilitation'}
                              </span>
                            </div>
                            <span className="font-black text-slate-900">
                              SSP {Number(item.total || item.amount || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600">
                        Direct mission facilitation stipend without sub-lines.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
