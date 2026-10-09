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
  Eye,
  Download,
  FileText
} from 'lucide-react';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import { exportToPDF, exportVoucherPDF } from '../../../lib/reportGenerator';

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

  // Requisition Full Details Modal State
  const [selectedDetailReq, setSelectedDetailReq] = useState(null);

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

      const isRej = req.status === 'Rejected by Program Manager' ||
                    req.status === 'Rejected' ||
                    req.stage === -1 ||
                    Boolean(req.returned_to_worker) ||
                    (typeof req.status === 'string' && req.status.toLowerCase().includes('reject'));

      let matchesStatus = true;
      if (activeFilter === 'pending_pm') {
        matchesStatus =
          !isRej &&
          (req.status === 'Pending Program Manager Approval' ||
          req.stage === 2 ||
          req.status === 'Endorsed by Supervisor');
      } else if (activeFilter === 'approved_pm') {
        matchesStatus =
          !isRej &&
          (req.status === 'Approved (Pending Finance Disbursement)' ||
          req.stage === 3 ||
          req.status === 'Approved by Program Manager');
      } else if (activeFilter === 'disbursed') {
        matchesStatus =
          !isRej &&
          (req.stage === 4 ||
          req.status === 'Disbursed / Paid' ||
          req.status === 'Disbursed');
      } else if (activeFilter === 'rejected') {
        matchesStatus = isRej;
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
      case 'rejected':
        return 'Rejected by PM';
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

  // Export Requisitions to PDF
  const handleExportPDF = () => {
    if (!filteredRequests || filteredRequests.length === 0) {
      toast.info('No facilitations to export.');
      return;
    }

    const columns = [
      { header: 'Req Code', key: 'display_code' },
      { header: 'Field Worker', key: 'field_worker_name' },
      { header: 'Amount (SSP)', key: 'display_amount' },
      { header: 'Date', key: 'display_date' },
      { header: 'Status', key: 'display_status' }
    ];

    const data = filteredRequests.map(r => {
      const isRejected = r.status === 'Rejected by Program Manager' || r.status === 'Rejected' || r.stage === -1 || Boolean(r.returned_to_worker);
      const isPendingPM = !isRejected && (r.status === 'Pending Program Manager Approval' || r.stage === 2 || r.status === 'Endorsed by Supervisor');
      const isDisbursed = !isRejected && (r.status === 'Disbursed' || r.stage === 4 || r.status === 'Disbursed / Paid');
      const isPendingFinance = !isRejected && (r.status === 'Approved by Program Manager' || r.status === 'Approved by PM' || r.stage === 3);

      const statusText = isRejected ? 'Rejected' : isDisbursed ? 'Disbursed' : isPendingFinance ? 'Finance Queue' : isPendingPM ? 'Pending PM' : (r.status || 'Pending');

      return {
        display_code: r.request_code || r.id || 'REQ-001',
        field_worker_name: r.field_worker_name || r.worker_name || 'Field Officer',
        display_amount: `SSP ${Number(r.amount || 0).toLocaleString()}`,
        display_date: new Date(r.created_at || Date.now()).toLocaleDateString(),
        display_status: statusText
      };
    });

    const totalSSP = filteredRequests.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    exportToPDF({
      title: 'ADRA SOUTH SUDAN - FIELD FACILITATIONS & REQUISITIONS',
      subtitle: `Filter: ${filterLabel} • Total Count: ${filteredRequests.length} records • Generated: ${new Date().toLocaleString()}`,
      columns,
      data,
      fileName: `ADRA_SS_facilitations_${activeFilter}_${new Date().toISOString().slice(0, 10)}.pdf`,
      summary: [
        { label: 'Total Requisitions', value: String(filteredRequests.length) },
        { label: 'Total Value', value: `SSP ${totalSSP.toLocaleString()}` },
        { label: 'Filter Scope', value: filterLabel }
      ]
    });
    toast.success('PDF report downloaded successfully.');
  };

  // Export Requisitions to CSV
  const handleExportCSV = () => {
    if (!filteredRequests || filteredRequests.length === 0) {
      toast.info('No facilitations to export.');
      return;
    }
    const rows = [
      ['Req Code', 'Field Worker', 'Amount (SSP)', 'Date', 'Status', 'Purpose']
    ];
    filteredRequests.forEach(r => {
      rows.push([
        r.request_code || r.id,
        r.field_worker_name || 'Field Officer',
        r.amount || 0,
        new Date(r.created_at || Date.now()).toLocaleDateString(),
        r.status || 'Pending',
        r.purpose || r.description || ''
      ]);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(x => `"${(x || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `ADRA_SS_facilitations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3 pb-8 animate-in fade-in duration-150">
      
      {/* 1. Status Filter Chip & Search & PDF / CSV Export */}
      <div className="flex flex-wrap items-center gap-2">
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
        <div className="relative flex-1 min-w-[180px]">
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

        {/* Visible PDF & CSV Download Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer active:scale-95"
            title="Download PDF Report"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#006B56] border border-emerald-200/80 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs active:scale-95"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 3. CLEAN & SIMPLE REQUISITIONS TABLE */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2 shadow-2xs">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Banknote className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Facilitations Found</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {activeFilter === 'pending_pm'
              ? 'No requisitions currently awaiting your approval.'
              : 'No records matching the selected status or search.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden max-w-5xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2 px-3 w-36">Req Code</th>
                  <th className="py-2 px-3">Field Worker</th>
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 px-3 w-28">Status</th>
                  <th className="py-2 px-3 w-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map(req => {
                  const isRejected = req.status === 'Rejected by Program Manager' ||
                                     req.status === 'Rejected' ||
                                     req.stage === -1 ||
                                     Boolean(req.returned_to_worker) ||
                                     (typeof req.status === 'string' && req.status.toLowerCase().includes('reject'));

                  const isPendingPM = !isRejected && (
                    req.status === 'Pending Program Manager Approval' ||
                    req.stage === 2 ||
                    req.status === 'Endorsed by Supervisor'
                  );
                  const isDisbursed = !isRejected && (
                    req.status === 'Disbursed' ||
                    req.stage === 4 ||
                    req.status === 'Disbursed / Paid'
                  );
                  const isPendingFinance = !isRejected && (
                    req.status === 'Approved (Pending Finance Disbursement)' ||
                    req.stage === 3 ||
                    req.status === 'Approved by Program Manager'
                  );

                  return (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedDetailReq(req)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      {/* 1. Req Code */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-[#006B56]">
                          {req.id || req.request_code}
                        </span>
                      </td>

                      {/* 2. Field Worker */}
                      <td className="py-2 px-3 font-bold text-slate-900 text-xs whitespace-nowrap">
                        {req.field_worker_name || 'Field Worker'}
                      </td>

                      {/* 3. Amount */}
                      <td className="py-2 px-3 whitespace-nowrap font-bold text-xs text-[#006B56]">
                        SSP {Number(req.amount || 0).toLocaleString()}
                      </td>

                      {/* 4. Status */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                          isRejected
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : isDisbursed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isPendingFinance
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : isPendingPM
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {isRejected ? 'Rejected' : isPendingPM ? 'Pending Review' : isPendingFinance ? 'Authorized' : isDisbursed ? 'Disbursed' : req.status}
                        </span>
                      </td>

                      {/* 5. Action */}
                      <td className="py-2 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedDetailReq(req)}
                          className="px-2.5 py-1 bg-[#006B56] hover:bg-[#005544] text-white text-[11px] font-bold rounded-lg transition active:scale-95 inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REQUISITION DETAILS & BREAKDOWN MODAL */}
      {selectedDetailReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-[#006B56] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                  {selectedDetailReq.id || selectedDetailReq.request_code}
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Facilitation Requisition Details
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {new Date(selectedDetailReq.created_at || selectedDetailReq.date || Date.now()).toLocaleDateString()} &bull; {selectedDetailReq.location || 'Field'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailReq(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Vital Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">Field Officer</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{selectedDetailReq.field_worker_name || 'Field Worker'}</span>
                {selectedDetailReq.recipient_phone && (
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">Phone: {selectedDetailReq.recipient_phone}</span>
                )}
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                <span className="text-emerald-800 text-[10px] block font-bold uppercase tracking-wider">Requested Amount</span>
                <span className="font-black text-[#006B56] text-base mt-0.5 block">
                  SSP {Number(selectedDetailReq.amount || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">Payout: {selectedDetailReq.payout_channel || 'm-Gurush'}</span>
              </div>
            </div>

            {/* Purpose & Justification */}
            <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Requisition Purpose &amp; Justification
              </span>
              <p className="text-slate-800 leading-relaxed font-medium italic">
                "{selectedDetailReq.purpose || selectedDetailReq.title || selectedDetailReq.reason || 'Operational logistics and community guide facilitation.'}"
              </p>
            </div>

            {/* Supervisor Remarks */}
            {selectedDetailReq.supervisor_remarks && (
              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#006B56]" />
                  <span>Supervisor Endorsement ({selectedDetailReq.supervisor_endorsed_by || 'Supervisor'}):</span>
                </div>
                <p className="text-slate-800 italic text-[11px] leading-relaxed">
                  "{selectedDetailReq.supervisor_remarks}"
                </p>
              </div>
            )}

            {/* Rejection Reason if rejected */}
            {(selectedDetailReq.status === 'Rejected by Program Manager' || selectedDetailReq.status === 'Rejected' || selectedDetailReq.stage === -1) && (selectedDetailReq.pm_remarks || selectedDetailReq.rejection_reason) && (
              <div className="bg-rose-50/90 p-3 rounded-2xl border border-rose-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-900 text-[11px]">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Program Manager Rejection Reason:</span>
                </div>
                <p className="text-rose-800 italic text-[11px] leading-relaxed">
                  "{selectedDetailReq.pm_remarks || selectedDetailReq.rejection_reason}"
                </p>
              </div>
            )}

            {/* Itemized Lines Breakdown */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 block tracking-wider">
                Itemized Line Breakdown
              </span>
              {selectedDetailReq.breakdown && selectedDetailReq.breakdown.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                  {selectedDetailReq.breakdown.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">
                          {item.item || item.description || `Item #${idx + 1}`}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          Qty: {item.quantity || 1} &times; SSP {Number(item.unit_price || item.unitCost || 0).toLocaleString()}
                        </div>
                      </div>
                      <span className="font-black text-slate-900 text-xs">
                        SSP {Number(item.total || item.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 italic">
                  Direct operational facilitation allocation.
                </div>
              )}
            </div>

            {/* Post-Disbursement Assessment Button */}
            {selectedDetailReq.post_disbursement_assessment && (
              <button
                type="button"
                onClick={() => {
                  setViewingReport(selectedDetailReq.post_disbursement_assessment);
                }}
                className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <FileCheck className="w-4 h-4" />
                <span>View Field Assessment Truth Report</span>
              </button>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDetailReq(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => exportVoucherPDF(selectedDetailReq)}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#006B56] border border-emerald-200/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  title="Download Official PDF Voucher"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF Voucher</span>
                </button>
              </div>

              {/* If pending, provide review buttons directly inside modal */}
              {selectedDetailReq.status !== 'Rejected by Program Manager' &&
               selectedDetailReq.status !== 'Rejected' &&
               selectedDetailReq.stage !== -1 &&
               (selectedDetailReq.status === 'Pending Program Manager Approval' || selectedDetailReq.stage === 2 || selectedDetailReq.status === 'Endorsed by Supervisor') && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const req = selectedDetailReq;
                      setSelectedDetailReq(null);
                      handleOpenReview(req, 'reject');
                    }}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const req = selectedDetailReq;
                      setSelectedDetailReq(null);
                      handleOpenReview(req, 'approve');
                    }}
                    className="px-4 py-2 bg-[#006B56] hover:bg-[#005544] text-white text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
