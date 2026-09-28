import React, { useState, useMemo } from 'react';
import {
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Send,
  User,
  Smartphone,
  Calendar,
  AlertTriangle,
  Receipt,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { db } from '../../../lib/supabase';

export function SupervisorFacilitationsView({
  requests = [],
  supervisorName = 'Emmanuel Adeyemi',
  onRefresh,
  onBack
}) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'in_progress' | 'disbursed' | 'all'
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Review action modal / inline state
  const [reviewingReq, setReviewingReq] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'approve' | 'reject'
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch =
        r.request_code?.toLowerCase().includes(search.toLowerCase()) ||
        r.field_worker_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.linked_beneficiary_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.payam?.toLowerCase().includes(search.toLowerCase()) ||
        r.purpose?.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'pending') {
        return r.status === 'Pending Supervisor Approval' || r.stage === 1;
      }
      if (activeTab === 'in_progress') {
        return (
          r.status === 'Endorsed by Supervisor' ||
          r.status === 'Approved by Program Manager' ||
          r.status === 'Approved (Pending Finance Disbursement)' ||
          r.status === 'Pending Finance Disbursement' ||
          r.stage === 2 ||
          r.stage === 3
        );
      }
      if (activeTab === 'disbursed') {
        return r.status === 'Disbursed / Paid' || r.status === 'Disbursed' || r.stage === 4;
      }
      if (activeTab === 'rejected') {
        return r.status?.includes('Rejected') || r.stage === -1 || r.returned_to_worker;
      }
      return true;
    });
  }, [requests, search, activeTab]);

  // Counts
  const counts = useMemo(() => {
    return {
      pending: requests.filter(r => r.status === 'Pending Supervisor Approval' || r.stage === 1).length,
      in_progress: requests.filter(
        r =>
          r.status === 'Endorsed by Supervisor' ||
          r.status === 'Approved by Program Manager' ||
          r.status === 'Approved (Pending Finance Disbursement)' ||
          r.status === 'Pending Finance Disbursement' ||
          r.stage === 2 ||
          r.stage === 3
      ).length,
      disbursed: requests.filter(r => r.status === 'Disbursed / Paid' || r.status === 'Disbursed' || r.stage === 4).length,
      rejected: requests.filter(r => r.status?.includes('Rejected') || r.stage === -1 || r.returned_to_worker).length,
      all: requests.length
    };
  }, [requests]);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleOpenReview = (req, action) => {
    setReviewingReq(req);
    setReviewAction(action);
    setReviewError('');
    setReviewNotes(
      action === 'approve'
        ? `Verified in-field operational necessity for ${req.linked_beneficiary_name || req.field_worker_name} assessment route in ${req.payam}. Budget lines endorsed.`
        : ''
    );
  };

  const handleExecuteReview = async () => {
    if (!reviewingReq || !reviewAction) return;

    if (reviewAction === 'reject') {
      if (!reviewNotes.trim() || reviewNotes.trim().length < 5) {
        setReviewError('Please write a specific reason explaining why this facilitation is being returned or rejected.');
        toast.warning('Please write a reason for rejection before confirming.');
        return;
      }
    }

    try {
      setSubmitting(true);
      setReviewError('');
      if (reviewAction === 'approve') {
        await db.approveFieldFundingBySupervisor(
          reviewingReq.id,
          supervisorName,
          reviewNotes || 'Endorsed by Supervisor. Sent to Program Manager for authorization.'
        );
        toast.success(`Endorsed facilitation ${reviewingReq.request_code}. Escalated to Program Manager for approval.`);
      } else {
        await db.rejectFieldFundingBySupervisor(reviewingReq.id, supervisorName, reviewNotes.trim());
        toast.info(`Facilitation request ${reviewingReq.request_code} has been returned/declined.`);
      }

      setReviewingReq(null);
      setReviewAction(null);
      setReviewNotes('');
      setReviewError('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Supervisor facilitation review error:', err);
      toast.error('Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3.5 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight leading-tight">
                Facilitation Approvals
              </h2>
              <p className="text-[11px] text-slate-500">
                Endorse field officer cash requisitions before PM sign-off
              </p>
            </div>
          </div>

          <span className="text-xs font-black bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full border border-amber-300 shrink-0">
            {counts.pending} Action Needed
          </span>
        </div>

        {/* Workflow Chain Explanation Banner */}
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-600 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 font-bold text-slate-700">
            <span>1. Field Worker</span>
            <ArrowRight className="w-3 h-3 text-[#006B56]" />
            <span className="text-[#006B56] font-black underline decoration-2">2. Supervisor (You)</span>
            <ArrowRight className="w-3 h-3 text-purple-600" />
            <span>3. PM Grace</span>
            <ArrowRight className="w-3 h-3 text-blue-600" />
            <span>4. Finance</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between overflow-x-auto no-scrollbar border-b border-slate-200 px-1 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`pb-2 px-1.5 text-xs font-bold transition flex items-center gap-1 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'pending'
              ? 'border-amber-600 text-amber-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Pending</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {counts.pending}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('in_progress')}
          className={`pb-2 px-1.5 text-xs font-bold transition flex items-center gap-1 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'in_progress'
              ? 'border-purple-600 text-purple-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>With PM / Finance</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'in_progress' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {counts.in_progress}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('disbursed')}
          className={`pb-2 px-1.5 text-xs font-bold transition flex items-center gap-1 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'disbursed'
              ? 'border-[#006B56] text-[#006B56] font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Disbursed</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'disbursed' ? 'bg-emerald-100 text-[#006B56]' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {counts.disbursed}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          className={`pb-2 px-1.5 text-xs font-bold transition flex items-center gap-1 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'rejected'
              ? 'border-rose-600 text-rose-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Returned / Rejected</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {counts.rejected}
          </span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by worker, case code, boma..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-amber-500 outline-none shadow-2xs"
        />
      </div>

      {/* List */}
      {filteredRequests.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Requisitions in this Queue</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {activeTab === 'pending'
              ? 'All field worker facilitation requests have been endorsed or processed.'
              : 'No requisitions currently match your selected filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const isPending = req.status === 'Pending Supervisor Approval' || req.stage === 1 || req.status === 'Submitted' || req.status === 'Pending';
            const isEscalatedPM = req.status === 'Pending Program Manager Approval' || req.stage === 2;
            const isReadyFinance = req.status === 'Approved (Pending Finance Disbursement)' || req.stage === 3;
            const isDisbursed = req.status === 'Disbursed' || req.stage === 4;
            const isExpanded = expandedId === req.id;
            const displayAmount = req.breakdown?.length > 0 
              ? req.breakdown.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
              : Number(req.amount || 0);

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl border shadow-2xs overflow-hidden transition-all duration-150 ${
                  isPending ? 'border-amber-300 ring-1 ring-amber-300/60' : 'border-slate-200'
                }`}
              >
                {/* Requisition Card Header */}
                <div
                  onClick={() => toggleExpand(req.id)}
                  className="p-3.5 cursor-pointer hover:bg-slate-50/70 transition space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                          {req.request_code}
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                            req.status?.includes('Rejected') || req.stage === -1
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : isDisbursed
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : isReadyFinance
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : isEscalatedPM
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          ● {req.status}
                        </span>
                      </div>

                      <h3 className="text-xs font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Field Worker: {req.field_worker_name}</span>
                      </h3>

                      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{req.payam}, {req.county || 'Kapoeta'}</span>
                        <span>•</span>
                        <span className="text-slate-700 font-semibold truncate">
                          Case: {req.linked_beneficiary_name || req.linked_request_code}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-slate-900 tracking-tight block">
                          {displayAmount.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded block">
                          {req.currency || 'SSP'}
                        </span>
                      </div>
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons when Collapsed */}
                  {isPending && !isExpanded && (
                    <div 
                      className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenReview(req, 'reject')}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Reject Facilitation"
                      >
                        <XCircle className="w-3.5 h-3.5 text-white" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenReview(req, 'approve')}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="Endorse Facilitation"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Endorse Requisition</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Expandable Breakdown and Details */}
                {isExpanded && (
                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-3 text-xs animate-in fade-in duration-150">
                    {/* Purpose / Justification */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Field Worker Justification
                      </span>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {req.purpose}
                      </p>
                    </div>

                    {/* Itemized Breakdown Table */}
                    {req.breakdown && req.breakdown.length > 0 && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Itemized Cost Breakdown ({req.currency || 'SSP'})
                        </span>
                        <div className="divide-y divide-slate-100 text-xs">
                          {req.breakdown.map((item, idx) => (
                            <div key={idx} className="py-1.5 flex items-center justify-between">
                              <span className="text-slate-700 font-medium">{item.item}</span>
                              <span className="font-bold text-slate-900 font-mono">
                                {Number(item.amount).toLocaleString()} SSP
                              </span>
                            </div>
                          ))}
                          <div className="pt-1.5 flex items-center justify-between font-black text-slate-900">
                            <span>Total Requisition:</span>
                            <span className="text-[#006B56] text-sm">
                              {displayAmount.toLocaleString()} {req.currency || 'SSP'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payout Details */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                      <span>Payout Channel:</span>
                      <span className="font-bold text-slate-900">
                        {req.preferred_payout || 'm-Gurush Mobile Money'} ({req.payout_phone || req.field_worker_phone})
                      </span>
                    </div>

                    {/* Review Chain Status History */}
                    {req.supervisor_review?.reviewed_by && (
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 space-y-0.5">
                        <span className="text-[10px] font-black text-emerald-950 uppercase block">
                          Supervisor Endorsement (You):
                        </span>
                        <p className="text-xs text-emerald-900 italic">
                          "{req.supervisor_review.notes || 'Endorsed for PM authorization.'}"
                        </p>
                      </div>
                    )}

                    {/* Program Manager Review Decision */}
                    {req.pm_review?.reviewed_by && (
                      <div className={`border rounded-xl p-2.5 space-y-1 ${
                        req.pm_review?.status === 'Rejected' || req.status?.includes('Rejected')
                          ? 'bg-rose-50/80 border-rose-200'
                          : 'bg-blue-50/80 border-blue-200'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          {req.pm_review?.status === 'Rejected' || req.status?.includes('Rejected') ? (
                            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                          <span className={`text-[10px] font-black uppercase block ${
                            req.pm_review?.status === 'Rejected' || req.status?.includes('Rejected')
                              ? 'text-rose-950'
                              : 'text-blue-950'
                          }`}>
                            Program Manager Decision ({req.pm_rejected_by || req.pm_approved_by || req.pm_review?.reviewed_by || 'Program Manager'}):
                          </span>
                        </div>
                        <p className={`text-xs italic font-medium ${
                          req.pm_review?.status === 'Rejected' || req.status?.includes('Rejected')
                            ? 'text-rose-900'
                            : 'text-blue-900'
                        }`}>
                          "{req.pm_remarks || req.pm_review?.notes || (req.pm_review?.status === 'Rejected' ? 'Requisition declined.' : 'Authorized for finance payout.')}"
                        </p>
                        {req.pm_review?.status === 'Rejected' || req.status?.includes('Rejected') ? (
                          <p className="text-[10px] text-rose-700 font-bold pt-0.5">
                            ➔ Requisition returned directly to Field Worker ({req.field_worker_name}) for revision.
                          </p>
                        ) : (
                          <p className="text-[10px] text-blue-700 font-bold pt-0.5">
                            ➔ Authorized & escalated to Finance for disbursement voucher.
                          </p>
                        )}
                      </div>
                    )}

                    {req.finance_disbursement?.voucher_reference && (
                      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-2.5 space-y-0.5">
                        <span className="text-[10px] font-black text-blue-950 uppercase block">
                          Finance Payout Voucher:
                        </span>
                        <p className="text-xs text-blue-900 font-bold font-mono">
                          Voucher: {req.finance_disbursement.voucher_reference} | Txn: {req.finance_disbursement.transaction_ref}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons for Supervisor */}
                    {isPending && (
                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(req, 'reject')}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <XCircle className="w-3.5 h-3.5 text-white" />
                          <span>Reject / Return</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenReview(req, 'approve')}
                          className="flex-1 py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Endorse to PM Grace ({displayAmount.toLocaleString()} SSP)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewingReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-white ${
                    reviewAction === 'approve' ? 'bg-amber-500' : 'bg-rose-600'
                  }`}
                >
                  {reviewAction === 'approve' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <h3 className="font-black text-slate-900 text-sm">
                  {reviewAction === 'approve' ? 'Endorse Facilitation to PM' : 'Reject Facilitation'}
                </h3>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Field Worker:</span>
                <span className="font-bold text-slate-900">{reviewingReq.field_worker_name}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Amount:</span>
                <span className="font-black text-amber-700 text-xs">
                  {Number(reviewingReq.amount).toLocaleString()} {reviewingReq.currency || 'SSP'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Linked Case:</span>
                <span className="font-bold text-slate-800">{reviewingReq.linked_beneficiary_name}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  {reviewAction === 'approve' ? (
                    'Supervisor Endorsement Remarks (for PM Grace)'
                  ) : (
                    <span className="text-rose-700 flex items-center gap-1 font-black">
                      Reason for Rejection / Return <span className="text-rose-500 font-black">*</span>
                      <span className="text-[10px] text-rose-600 font-semibold">(Required)</span>
                    </span>
                  )}
                </label>
              </div>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => {
                  setReviewNotes(e.target.value);
                  if (reviewError) setReviewError('');
                }}
                placeholder={
                  reviewAction === 'approve'
                    ? 'Enter operational verification remarks for Programme Manager...'
                    : 'Explain clearly why this request cannot be approved so the field worker knows what to adjust...'
                }
                className={`w-full text-xs font-medium p-2.5 bg-slate-50 border rounded-xl outline-none resize-none transition ${
                  reviewError
                    ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-200'
                    : reviewAction === 'approve'
                    ? 'border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                    : 'border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                }`}
              />
              {reviewError && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{reviewError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setReviewingReq(null);
                  setReviewAction(null);
                }}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteReview}
                disabled={submitting}
                className={`py-2 px-4 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 ${
                  reviewAction === 'approve'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting ? (
                  <span>Saving...</span>
                ) : (
                  <span>{reviewAction === 'approve' ? 'Confirm Endorsement' : 'Confirm Rejection'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
