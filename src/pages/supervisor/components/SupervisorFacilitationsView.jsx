import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  MapPin,
  User,
  Eye,
  FileText,
  Download,
  AlertCircle,
  Inbox,
  X
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { db } from '../../../lib/supabase';
import { exportToPDF } from '../../../lib/reportGenerator';

export function SupervisorFacilitationsView({
  requests = [],
  supervisorName = 'Emmanuel Adeyemi',
  initialStatusTab = 'pending',
  onStatusTabChange,
  onRefresh,
  onBack
}) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(initialStatusTab || 'pending');
  const [search, setSearch] = useState('');
  const [selectedDetailReq, setSelectedDetailReq] = useState(null);

  React.useEffect(() => {
    if (initialStatusTab) {
      setActiveTab(initialStatusTab);
    }
  }, [initialStatusTab]);

  // Review action modal / state
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
        if (r.status?.includes('Rejected') || r.stage === -1 || r.returned_to_worker || r.supervisor_review?.status === 'Rejected') {
          return false;
        }
        return r.status === 'Pending Supervisor Approval' || r.stage === 1 || r.status === 'Submitted' || r.status === 'Pending';
      }
      if (activeTab === 'in_progress') {
        if (r.status?.includes('Rejected') || r.stage === -1 || r.returned_to_worker || r.supervisor_review?.status === 'Rejected') {
          return false;
        }
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
        return r.status?.includes('Rejected') || r.stage === -1 || r.returned_to_worker || r.supervisor_review?.status === 'Rejected';
      }
      return true;
    });
  }, [requests, search, activeTab]);

  // Counts
  const counts = useMemo(() => {
    return {
      pending: requests.filter(r =>
        !r.status?.includes('Rejected') &&
        r.stage !== -1 &&
        !r.returned_to_worker &&
        r.supervisor_review?.status !== 'Rejected' &&
        (r.status === 'Pending Supervisor Approval' || r.stage === 1 || r.status === 'Submitted' || r.status === 'Pending')
      ).length,
      in_progress: requests.filter(
        r =>
          !r.status?.includes('Rejected') &&
          r.stage !== -1 &&
          !r.returned_to_worker &&
          r.supervisor_review?.status !== 'Rejected' &&
          (r.status === 'Endorsed by Supervisor' ||
           r.status === 'Approved by Program Manager' ||
           r.status === 'Approved (Pending Finance Disbursement)' ||
           r.status === 'Pending Finance Disbursement' ||
           r.stage === 2 ||
           r.stage === 3)
      ).length,
      disbursed: requests.filter(r => r.status === 'Disbursed / Paid' || r.status === 'Disbursed' || r.stage === 4).length,
      rejected: requests.filter(r => r.status?.includes('Rejected') || r.stage === -1 || r.returned_to_worker || r.supervisor_review?.status === 'Rejected').length,
      all: requests.length
    };
  }, [requests]);

  const handleOpenReview = (req, action) => {
    setReviewingReq(req);
    setReviewAction(action);
    setReviewError('');
    setReviewNotes(
      action === 'approve'
        ? `Verified in-field operational necessity for ${req.linked_beneficiary_name || req.field_worker_name} assessment route in ${req.payam || req.county || 'field'}. Budget lines endorsed.`
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
        toast.success(`Endorsed facilitation ${reviewingReq.request_code || reviewingReq.id}. Escalated to Program Manager for approval.`);
      } else {
        await db.rejectFieldFundingBySupervisor(reviewingReq.id, supervisorName, reviewNotes.trim());
        toast.info(`Facilitation request ${reviewingReq.request_code || reviewingReq.id} has been returned/declined.`);
      }

      setReviewingReq(null);
      setReviewAction(null);
      setReviewNotes('');
      setReviewError('');
      setSelectedDetailReq(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Supervisor facilitation review error:', err);
      toast.error('Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    if (!filteredRequests || filteredRequests.length === 0) {
      toast.info('No facilitations to export.');
      return;
    }

    const columns = [
      { header: 'Req Code', key: 'display_code' },
      { header: 'Field Worker', key: 'display_worker' },
      { header: 'Amount (SSP)', key: 'display_amount' },
      { header: 'Location / Case', key: 'display_loc' },
      { header: 'Status', key: 'display_status' }
    ];

    const data = filteredRequests.map(item => ({
      display_code: item.request_code || item.id,
      display_worker: item.field_worker_name || 'Field Officer',
      display_amount: Number(item.amount || 0).toLocaleString(),
      display_loc: `${item.payam || ''}, ${item.county || ''} • ${item.linked_beneficiary_name || ''}`,
      display_status: item.status || 'Pending'
    }));

    exportToPDF({
      title: 'ADRA SOUTH SUDAN - SUPERVISOR FACILITATIONS',
      subtitle: `Queue: ${activeTab.toUpperCase()} • Total Records: ${filteredRequests.length} • Generated: ${new Date().toLocaleString()}`,
      columns,
      data,
      fileName: `ADRA_SS_supervisor_facilitations_${activeTab}_${new Date().toISOString().slice(0, 10)}.pdf`,
      summary: [
        { label: 'Total Requisitions', value: String(filteredRequests.length) },
        { label: 'Queue Tab', value: activeTab.replace('_', ' ') },
        { label: 'Supervisor', value: supervisorName }
      ]
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredRequests || filteredRequests.length === 0) {
      toast.info('No facilitations to export.');
      return;
    }
    const rows = [
      ['Req Code', 'Field Worker', 'Amount (SSP)', 'Location', 'Linked Beneficiary', 'Status', 'Date']
    ];
    filteredRequests.forEach(item => {
      rows.push([
        item.request_code || item.id,
        item.field_worker_name || 'Field Officer',
        item.amount || 0,
        `${item.payam || ''}, ${item.county || ''}`,
        item.linked_beneficiary_name || '',
        item.status || 'Pending',
        new Date(item.created_at || Date.now()).toLocaleDateString()
      ]);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(x => `"${(x || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `ADRA_SS_supervisor_facilitations_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-2.5 pb-20 max-w-4xl mx-auto animate-in fade-in duration-150">
      
      {/* 1. Single Clean Compact Toolbar Header */}
      <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-black text-slate-900 capitalize">
            {activeTab === 'pending' ? 'Pending Endorsements' : `${activeTab.replace('_', ' ')} Facilitations`}
          </h2>
          <span className="text-[10px] font-black text-[#006B56] bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
            {filteredRequests.length} {filteredRequests.length === 1 ? 'case' : 'cases'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-1 max-w-xs justify-end">
          <div className="relative flex-1 min-w-[120px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by worker, code, boma..."
              className="w-full pl-7 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B56]"
            />
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black rounded-xl shadow-xs transition cursor-pointer active:scale-95 shrink-0"
            title="Download PDF Report"
          >
            <FileText className="w-3 h-3" />
            <span>PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#006B56] border border-emerald-200/80 text-[11px] font-bold rounded-xl transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
            title="Download CSV"
          >
            <Download className="w-3 h-3" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'pending', label: 'Pending Endorsement', count: counts.pending },
          { id: 'in_progress', label: 'In Progress / PM', count: counts.in_progress },
          { id: 'disbursed', label: 'Disbursed', count: counts.disbursed },
          { id: 'rejected', label: 'Rejected', count: counts.rejected },
          { id: 'all', label: 'All Facilitations', count: counts.all }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              if (onStatusTabChange) onStatusTabChange(tab.id);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 2. MINIMAL, SLIM 5-COLUMN TABLE */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 space-y-1.5 shadow-2xs">
          <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-800">
            {activeTab === 'pending'
              ? 'No Pending Facilitation Requisitions'
              : `No ${activeTab.replace('_', ' ')} Records Found`}
          </p>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            {activeTab === 'pending'
              ? 'All field worker operational facilitations have been reviewed or processed.'
              : 'There are no requisitions matching the selected status or search filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
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
                {filteredRequests.map((req) => {
                  const isRejected = (
                    req.status?.includes('Rejected') ||
                    req.stage === -1 ||
                    req.returned_to_worker ||
                    req.supervisor_review?.status === 'Rejected'
                  );
                  const isPending = !isRejected && (
                    req.status === 'Pending Supervisor Approval' ||
                    req.stage === 1 ||
                    req.status === 'Submitted' ||
                    req.status === 'Pending'
                  );
                  const isDisbursed = !isRejected && (
                    req.status === 'Disbursed' ||
                    req.stage === 4 ||
                    req.status === 'Disbursed / Paid'
                  );
                  const isReadyFinance = !isRejected && (
                    req.status === 'Approved (Pending Finance Disbursement)' ||
                    req.stage === 3
                  );
                  const isEscalatedPM = !isRejected && (
                    req.status === 'Pending Program Manager Approval' ||
                    req.status === 'Endorsed by Supervisor' ||
                    req.stage === 2
                  );

                  const displayAmount = req.breakdown?.length > 0 
                    ? req.breakdown.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
                    : Number(req.amount || 0);

                  const displayStatus = isRejected
                    ? 'Rejected'
                    : isDisbursed
                    ? 'Disbursed'
                    : isReadyFinance
                    ? 'Authorized'
                    : isEscalatedPM
                    ? 'Pending PM'
                    : 'Pending';

                  return (
                    <tr
                      key={req.id || req.request_code}
                      onClick={() => setSelectedDetailReq(req)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      {/* 1. Req Code */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-[#006B56]">
                          {req.request_code || req.id}
                        </span>
                      </td>

                      {/* 2. Field Worker */}
                      <td className="py-2 px-3 font-bold text-slate-900 text-xs whitespace-nowrap">
                        {req.field_worker_name || 'Field Worker'}
                      </td>

                      {/* 3. Amount */}
                      <td className="py-2 px-3 whitespace-nowrap font-bold text-xs text-[#006B56]">
                        SSP {displayAmount.toLocaleString()}
                      </td>

                      {/* 4. Status */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                          isRejected
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : isDisbursed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isReadyFinance || isEscalatedPM
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {displayStatus}
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

      {/* 3. REQUISITION DETAILS & ACTION DOSSIER MODAL */}
      {selectedDetailReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[90vh] overflow-y-auto text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#006B56] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                  {selectedDetailReq.request_code || selectedDetailReq.id}
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Facilitation Dossier</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Field worker operational funding breakdown</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailReq(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile & Context */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-900">{selectedDetailReq.field_worker_name || 'Field Officer'}</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#006B56]">
                  SSP {Number(selectedDetailReq.amount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <MapPin className="w-3 h-3 text-[#006B56]" />
                <span>{selectedDetailReq.payam || 'Payam'}, {selectedDetailReq.county || 'County'}</span>
                {selectedDetailReq.linked_beneficiary_name && (
                  <>
                    <span>•</span>
                    <span className="text-slate-700 font-semibold">Case: {selectedDetailReq.linked_beneficiary_name}</span>
                  </>
                )}
              </div>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                <span>Payout Channel:</span>
                <span className="font-bold text-slate-900">
                  {selectedDetailReq.preferred_payout || 'm-Gurush Mobile Money'} ({selectedDetailReq.payout_phone || selectedDetailReq.field_worker_phone || 'Registered Phone'})
                </span>
              </div>
            </div>

            {/* Purpose */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Purpose / Justification</span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {selectedDetailReq.purpose || 'Community verification logistics and operational support for household assessment.'}
              </p>
            </div>

            {/* Itemized Cost Breakdown */}
            {selectedDetailReq.breakdown && selectedDetailReq.breakdown.length > 0 && (
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Itemized Cost Breakdown ({selectedDetailReq.currency || 'SSP'})
                </span>
                <div className="divide-y divide-slate-100 text-xs">
                  {selectedDetailReq.breakdown.map((item, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between">
                      <span className="text-slate-700 font-medium">{item.item}</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {Number(item.amount).toLocaleString()} SSP
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 flex items-center justify-between font-black text-slate-900">
                    <span>Total Requisition:</span>
                    <span className="text-[#006B56] text-sm font-mono">
                      SSP {Number(selectedDetailReq.amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Supervisor Endorsement / Rejection Action buttons (if Pending) */}
            {(selectedDetailReq.status === 'Pending Supervisor Approval' || selectedDetailReq.stage === 1 || selectedDetailReq.status === 'Submitted' || selectedDetailReq.status === 'Pending') && (
              <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenReview(selectedDetailReq, 'reject')}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition active:scale-95 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenReview(selectedDetailReq, 'approve')}
                  className="flex-2 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black transition active:scale-95 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Endorse Requisition</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. CONFIRMATION REVIEW MODAL (Notes / Rejection reason) */}
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
                  SSP {Number(reviewingReq.amount).toLocaleString()}
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
                    'Supervisor Endorsement Remarks (for PM)'
                  ) : (
                    <span className="text-rose-700 flex items-center gap-1 font-black">
                      Reason for Rejection <span className="text-rose-500 font-black">*</span>
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
                    : 'Explain clearly why this request cannot be approved...'
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

export default SupervisorFacilitationsView;
