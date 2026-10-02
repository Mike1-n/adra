import React, { useState, useMemo } from 'react';
import {
  Banknote,
  Search,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  RefreshCw,
  Send,
  MapPin,
  Phone,
  X,
  SlidersHorizontal,
  FileCheck,
  Eye
} from 'lucide-react';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

export function PMFacilitationsView({
  requests = [],
  pmName = 'Peter Deng',
  activeFilter = 'pending_pm',
  onFilterChange,
  onOpenSidebar,
  onRefresh,
  onBack
}) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('approve'); // 'approve' | 'reject'
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field Truth Report Viewer Modal State
  const [viewingReport, setViewingReport] = useState(null);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const q = (searchQuery || '').toLowerCase().trim();
      const matchesSearch =
        !q ||
        (req.request_code || req.id || '').toLowerCase().includes(q) ||
        (req.field_worker_name || '').toLowerCase().includes(q) ||
        (req.title || req.purpose || req.reason || '').toLowerCase().includes(q) ||
        (req.location || '').toLowerCase().includes(q) ||
        (req.linked_beneficiary_name || '').toLowerCase().includes(q);

      let matchesStatus = true;
      if (activeFilter === 'pending_pm') {
        matchesStatus =
          req.status === 'Pending Program Manager Approval' ||
          req.stage === 2 ||
          req.status === 'Endorsed by Supervisor';
      } else if (activeFilter === 'approved_pm') {
        matchesStatus =
          req.status === 'Approved (Pending Finance Disbursement)' ||
          req.stage === 3 ||
          req.status === 'Approved by Program Manager';
      } else if (activeFilter === 'disbursed') {
        matchesStatus =
          req.stage === 4 ||
          req.status === 'Disbursed / Paid' ||
          req.status === 'Disbursed';
      }

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, activeFilter]);

  // Active filter display label
  const filterLabel = useMemo(() => {
    switch (activeFilter) {
      case 'pending_pm':
        return 'Pending Review';
      case 'approved_pm':
        return 'Authorized';
      case 'disbursed':
        return 'Disbursed';
      default:
        return 'All Facilitations';
    }
  }, [activeFilter]);

  // Handle open review modal
  const handleOpenReview = (req, action) => {
    setSelectedRequest(req);
    setReviewAction(action);
    setReviewError('');
    setReviewNotes(
      action === 'approve'
        ? `Authorized by Program Manager ${pmName}. Scope verified against field workplan.`
        : ''
    );
    setShowReviewModal(true);
  };

  // Submit review decision
  const handleSubmitReview = async () => {
    if (!selectedRequest) return;
    if (reviewAction === 'reject') {
      if (!reviewNotes.trim() || reviewNotes.trim().length < 5) {
        setReviewError('Please enter a specific reason for rejection.');
        toast.warning('Please enter a rejection reason.');
        return;
      }
    }

    setIsSubmitting(true);
    setReviewError('');
    try {
      if (reviewAction === 'approve') {
        const res = await db.approveFieldFundingByPM(
          selectedRequest.id,
          reviewNotes || 'Approved by Programme Manager for finance disbursement.',
          pmName
        );
        if (res?.error) throw res.error;
        toast.success(`Facilitation ${selectedRequest.id} authorized!`);
      } else {
        const res = await db.rejectFieldFundingByPM(
          selectedRequest.id,
          reviewNotes,
          pmName
        );
        if (res?.error) throw res.error;
        toast.info(`Facilitation ${selectedRequest.id} rejected.`);
      }

      setShowReviewModal(false);
      setSelectedRequest(null);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Error submitting PM review:', err);
      toast.error('Failed to submit decision. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 pb-8 animate-in fade-in duration-150">
      
      {/* 1. Status Filter Chip & Search */}
      <div className="flex items-center gap-2">
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition shadow-2xs cursor-pointer shrink-0"
            title="Open sidebar to switch status filter"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#006B56]" />
            <span className="text-xs text-[#006B56] font-extrabold">{filterLabel}</span>
            <span className="bg-emerald-100 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded font-black">
              {filteredRequests.length}
            </span>
          </button>
        )}

        {/* Compact Search Bar */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requisitions..."
            className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#006B56] transition text-slate-900 placeholder:text-slate-400 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Streamlined Requisitions List */}
      <div className="space-y-2.5">
        {filteredRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-400">
              <Banknote className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">No Facilitations Found</h4>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              {activeFilter === 'pending_pm'
                ? 'No requisitions currently awaiting your approval.'
                : 'No records matching the selected status or search.'}
            </p>
          </div>
        ) : (
          filteredRequests.map(req => {
            const isExpanded = expandedId === req.id;
            const isPendingPM =
              req.status === 'Pending Program Manager Approval' ||
              req.stage === 2 ||
              req.status === 'Endorsed by Supervisor';
            const isDisbursed =
              req.status === 'Disbursed' ||
              req.stage === 4 ||
              req.status === 'Disbursed / Paid';
            const isPendingFinance =
              req.status === 'Approved (Pending Finance Disbursement)' ||
              req.stage === 3 ||
              req.status === 'Approved by Program Manager';

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition"
              >
                <div className="p-3.5 space-y-2.5">
                  
                  {/* Top Row: Worker & Amount */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {req.field_worker_name || 'Field Worker'}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {req.id || req.request_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{req.location || 'Field'}</span>
                        </span>
                        <span>•</span>
                        <span>{new Date(req.created_at || req.date || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-[#006B56]">
                        SSP {Number(req.amount || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        via {req.payout_channel || 'm-Gurush'}
                      </div>
                    </div>
                  </div>

                  {/* Purpose */}
                  <p className="text-xs text-slate-700 leading-snug font-medium">
                    {req.purpose || req.title || req.reason || 'Operational facilitation and transport'}
                  </p>

                  {/* Supervisor Note Preview (if exists) */}
                  {req.supervisor_remarks && (
                    <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100 text-[11px] text-emerald-950 flex items-start gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#006B56] shrink-0 mt-0.5" />
                      <p className="italic">
                        <span className="font-bold">{req.supervisor_endorsed_by || 'Supervisor'}: </span>
                        "{req.supervisor_remarks}"
                      </p>
                    </div>
                  )}

                  {/* Status Badge if not pending */}
                  {!isPendingPM && (
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Status:</span>
                      <span className={`font-bold px-2 py-0.5 rounded-md ${
                        isDisbursed
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPendingFinance
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  )}

                  {/* POST-DISBURSEMENT ASSESSMENT & TRUTH REPORT STATUS */}
                  {isDisbursed && (
                    <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#006B56]" />
                          <span>Field Verification Assessment</span>
                        </div>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                          req.post_disbursement_assessment
                            ? 'bg-emerald-200 text-[#006B56]'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {req.post_disbursement_assessment ? '✓ Verified True on Ground' : '⏳ In Field Assessment'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug">
                        {req.post_disbursement_assessment
                          ? `Field officer ${req.post_disbursement_assessment.assessed_by || req.field_worker_name} submitted formal assessment (${req.post_disbursement_assessment.assessment_code}) confirming beneficiary assignment is true and genuine.`
                          : `Facilitation disbursed. Field officer ${req.field_worker_name} is conducting on-site assessment for ${req.linked_beneficiary_name || 'the beneficiary'} to confirm assignment truth.`}
                      </p>

                      {req.post_disbursement_assessment && (
                        <button
                          type="button"
                          onClick={() => setViewingReport(req.post_disbursement_assessment)}
                          className="w-full py-1.5 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>View Field Assessment Truth Report</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Quick Action Buttons (Only when Pending PM) */}
                  {isPendingPM && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenReview(req, 'reject')}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:scale-98 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenReview(req, 'approve')}
                        className="w-full py-2 bg-[#006B56] hover:bg-[#005242] text-white active:scale-98 text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>Authorize</span>
                      </button>
                    </div>
                  )}

                  {/* Minimal Details Toggle */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    className="w-full pt-1 text-slate-500 hover:text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Details' : 'View Item Breakdown'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Expanded Item Breakdown */}
                {isExpanded && (
                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs space-y-2">
                    {req.breakdown && req.breakdown.length > 0 ? (
                      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
                        {req.breakdown.map((item, idx) => (
                          <div key={idx} className="p-2 flex items-center justify-between text-[11px]">
                            <div>
                              <span className="font-bold text-slate-800">
                                {item.item || item.description || `Item #${idx + 1}`}
                              </span>
                              <div className="text-[10px] text-slate-500">
                                Qty: {item.quantity || 1} × SSP {Number(item.unit_price || item.unitCost || 0).toLocaleString()}
                              </div>
                            </div>
                            <span className="font-black text-slate-900">
                              SSP {Number(item.total || item.amount || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600">
                        No itemized lines attached. Direct facilitation.
                      </div>
                    )}

                    {req.recipient_phone && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 px-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Recipient Phone: <strong className="text-slate-900 font-mono">{req.recipient_phone}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Clean Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white ${
                  reviewAction === 'approve' ? 'bg-[#006B56]' : 'bg-rose-600'
                }`}>
                  {reviewAction === 'approve' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {reviewAction === 'approve' ? 'Authorize Facilitation' : 'Reject Facilitation'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Worker:</span>
                <span className="font-bold text-slate-900">{selectedRequest.field_worker_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-black text-[#006B56]">SSP {Number(selectedRequest.amount || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {reviewAction === 'approve' ? 'Note (Optional):' : 'Rejection Reason *'}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => {
                  setReviewNotes(e.target.value);
                  if (reviewError) setReviewError('');
                }}
                placeholder={
                  reviewAction === 'approve'
                    ? 'Optional approval remark...'
                    : 'Provide reason for rejection...'
                }
                rows={2}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#006B56] text-slate-900"
              />
              {reviewError && (
                <p className="text-[11px] text-rose-600 font-bold">{reviewError}</p>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={isSubmitting}
                className={`py-2 text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer ${
                  reviewAction === 'approve'
                    ? 'bg-[#006B56] hover:bg-[#005242]'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{reviewAction === 'approve' ? 'Authorize' : 'Reject'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Field Assessment Truth Report Dossier Viewer Modal for PM */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006B56] border border-emerald-200 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Field Verification & Truth Report
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Assessment Code: {viewingReport.assessment_code || 'FA-2026'} • Filed: {new Date(viewingReport.submitted_at || Date.now()).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingReport(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Officer Truth Certification Banner */}
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-300 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-[#006B56]" />
                <span>Assignment Formally Confirmed True on Ground</span>
              </div>
              <p className="text-xs text-emerald-900 italic leading-relaxed">
                "{viewingReport.truth_statement || `I hereby certify under official duty that I conducted an in-person field visit. The assignment given concerning this beneficiary is verified true and in acute need of humanitarian relief.`}"
              </p>
              <div className="text-[10px] text-emerald-800 font-bold pt-1 border-t border-emerald-200">
                Assessed & Reported by: <strong>{viewingReport.assessed_by || 'Field Officer'}</strong>
              </div>
            </div>

            {/* Ground Situation Report */}
            <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                On-Ground Situation & Vulnerability Findings
              </span>
              <p className="text-slate-800 leading-relaxed font-medium">
                {viewingReport.ground_situation_report || 'Household visited in-person. Severe food insecurity and critical vulnerability observed on-site.'}
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 block">Vulnerability Score</span>
                <span className="text-base font-black text-emerald-800">{viewingReport.vulnerability_score || 85}/100</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 block">Urgency Status</span>
                <span className="text-xs font-black text-rose-700">{viewingReport.urgency_level || 'Critical Emergency'}</span>
              </div>
            </div>

            {/* Photos if attached */}
            {viewingReport.evidence_photos && viewingReport.evidence_photos.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                  Field Photo Evidence ({viewingReport.evidence_photos.length})
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {viewingReport.evidence_photos.map((p, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                      <img src={p.url} alt={p.name || p.title || 'Evidence'} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents if attached */}
            {viewingReport.evidence_documents && viewingReport.evidence_documents.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                  Attached Verification Documents ({viewingReport.evidence_documents.length})
                </span>
                <div className="space-y-1.5">
                  {viewingReport.evidence_documents.map((doc, i) => (
                    <div key={i} className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded bg-blue-100 text-blue-700 font-bold font-mono text-[9px] flex items-center justify-center shrink-0">
                          {doc.name?.split('.').pop()?.toUpperCase() || 'DOC'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 truncate block text-[11px]">{doc.name}</span>
                          <span className="text-[9px] text-slate-400">{doc.category || 'Verification Document'} • {doc.size || 'Attached'}</span>
                        </div>
                      </div>
                      {doc.url && (
                        <a
                          href={doc.url}
                          download={doc.name}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-blue-700 font-bold text-[10px] flex items-center gap-1 shrink-0 transition"
                        >
                          <Eye className="w-3 h-3 text-blue-600" />
                          <span>View</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setViewingReport(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PMFacilitationsView;
