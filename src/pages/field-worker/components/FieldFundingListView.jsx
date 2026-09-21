import React, { useState, useMemo, useEffect } from 'react';
import {
  Banknote,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Fuel,
  Users,
  Droplets,
  ClipboardList,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Send,
  Building2,
  Smartphone,
  ShieldCheck,
  Receipt,
  Download,
  Check,
  DollarSign,
  Trash2,
  MapPin,
  FileCheck,
  Layers,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { db } from '../../../lib/supabase';

const FUNDING_CATEGORIES = [
  { id: 'Transport & Vehicle Fuel', label: 'Transport & Fuel' },
  { id: 'Survey & Assessment Incidentals', label: 'Household Audit & Survey' },
  { id: 'Community Mobilization & Hall Rental', label: 'Community Mobilization' },
  { id: 'Security & Guide Allowances', label: 'Boma Guide & Security' },
  { id: 'Emergency Water & Relief Incidentals', label: 'Relief Incidentals' }
];

const URGENCY_OPTIONS = [
  { id: 'Standard SLA (48h)', label: 'Standard (48h)' },
  { id: 'Urgent (24h)', label: 'Urgent (24h)' },
  { id: 'Immediate Emergency (Same Day)', label: 'Emergency (Same Day)' }
];

const PAYMENT_METHODS = [
  { id: 'm-Gurush Mobile Money', label: 'm-Gurush Mobile' },
  { id: 'Cash at Sub-Office', label: 'Cash at Hub' },
  { id: 'Bank Transfer (Stanbic)', label: 'Bank Transfer' }
];

export function FieldFundingListView({
  requests = [],
  worker = {},
  tasks = [],
  initialTask = null,
  filterMode: externalFilterMode = 'request', // 'request' | 'pending' | 'approved'
  onFilterModeChange,
  onSubmitFundingRequest,
  onRefresh
}) {
  const toast = useToast();

  const [internalFilterMode, setInternalFilterMode] = useState(externalFilterMode || 'request');
  const currentView = externalFilterMode !== undefined ? externalFilterMode : internalFilterMode;

  const setView = (mode) => {
    if (onFilterModeChange) onFilterModeChange(mode);
    setInternalFilterMode(mode);
  };

  // Search filter
  const [search, setSearch] = useState('');

  // Which assignment has its facilitation form currently expanded
  const [activeFormTaskId, setActiveFormTaskId] = useState(
    initialTask?.id || initialTask?.request_code || null
  );

  // Breakdown & Form state
  const [breakdown, setBreakdown] = useState([
    { item: 'Fuel / Motorbike transport for Boma visit', amount: 150000 },
    { item: 'Local guide allowance & logistics', amount: 80000 }
  ]);
  const [justificationNote, setJustificationNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const totalAmount = useMemo(() => {
    return breakdown.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  }, [breakdown]);

  const handleAddBreakdownLine = () => {
    setBreakdown(prev => [...prev, { item: '', amount: '' }]);
  };

  const handleUpdateBreakdownLine = (index, field, value) => {
    setBreakdown(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveBreakdownLine = (index) => {
    if (breakdown.length <= 1) {
      setBreakdown([{ item: '', amount: '' }]);
      return;
    }
    setBreakdown(prev => prev.filter((_, i) => i !== index));
  };

  // Sync when initialTask changes
  useEffect(() => {
    if (initialTask) {
      const taskId = initialTask.id || initialTask.request_code;
      setActiveFormTaskId(taskId);
      setView('request');
      setJustificationNote(`Field operational facilitation & transport for conducting household vulnerability audit for ${initialTask.beneficiary_name} in ${initialTask.payam || worker.payam || 'assigned territory'}.`);
    }
  }, [initialTask]);

  const handleSelectTaskForForm = (task) => {
    const tId = task.id || task.request_code;
    if (activeFormTaskId === tId) {
      setActiveFormTaskId(null);
    } else {
      setActiveFormTaskId(tId);
      setJustificationNote(`Field operational facilitation & transport for conducting household vulnerability audit for ${task.beneficiary_name} in ${task.payam || worker.payam || 'assigned territory'}.`);
    }
  };

  // Submit Requisition for the selected task
  const handleSubmitRequisition = async (task) => {
    if (!totalAmount || totalAmount <= 0) {
      toast.error('Please enter at least one item with a valid amount.');
      return;
    }

    try {
      setSubmitting(true);
      const validBreakdown = breakdown
        .filter(b => b.item && Number(b.amount) > 0)
        .map(b => ({ item: b.item.trim(), amount: Number(b.amount) }));

      const payload = {
        field_worker_id: worker.id || 'fw-1',
        field_worker_name: worker.name || 'John Deng',
        linked_request_code: task?.request_code || 'GEN-OPS',
        linked_beneficiary_name: task?.beneficiary_name || `${worker.payam || 'Kapoeta Town'} Field Case`,
        linked_location: task?.payam || worker.payam || 'Kapoeta Town',
        payam: task?.payam || worker.payam || 'Kapoeta Town',
        county: task?.county || worker.county || 'Kapoeta South',
        state: worker.state || 'Eastern Equatoria',
        project_name: task?.program_name || task?.project_name || 'Emergency Food Security & Livelihoods (EFSLR)',
        category: 'Field Operational Facilitation',
        urgency: 'Standard SLA (48h)',
        preferred_payout: 'm-Gurush Mobile Money',
        payout_phone: worker.phone || '+211-921-550101',
        amount: totalAmount,
        currency: 'SSP',
        purpose: justificationNote?.trim() || `Field operational facilitation for ${task.beneficiary_name}`,
        breakdown: validBreakdown.length > 0 ? validBreakdown : [
          { item: 'Field Operational Facilitation', amount: totalAmount }
        ]
      };

      if (onSubmitFundingRequest) {
        await onSubmitFundingRequest(payload);
      } else {
        await db.createFieldFundingRequest(payload);
      }

      toast.success(`Facilitation of ${totalAmount.toLocaleString()} SSP submitted for ${task.beneficiary_name} (#${task.request_code}).`);
      if (onRefresh) onRefresh();

      // Collapse form & switch to pending list view
      setActiveFormTaskId(null);
      setView('pending');
    } catch (err) {
      console.error('Error submitting facilitation:', err);
      toast.error('Failed to submit facilitation request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter tasks for 'request' view
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        t.request_code?.toLowerCase().includes(q) ||
        t.beneficiary_name?.toLowerCase().includes(q) ||
        t.payam?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    });
  }, [tasks, search]);

  // Filter requests
  const pendingRequests = useMemo(() => {
    return requests.filter(r => r.status !== 'Disbursed' && !r.status?.includes('Rejected'));
  }, [requests]);

  const approvedRequests = useMemo(() => {
    return requests.filter(r => r.status === 'Disbursed');
  }, [requests]);

  // Simulation handlers for approval tiers
  const handleApproveAsSupervisor = async (req) => {
    try {
      setProcessingId(req.id);
      await db.approveFieldFundingBySupervisor(
        req.id, 
        worker.supervisor_name || 'Emmanuel Adeyemi',
        'Verified in-field operational necessity. Budget lines comply with Kapoeta South allocation.'
      );
      toast.success(`Request ${req.request_code} approved by Supervisor Emmanuel Adeyemi.`);
      if (onRefresh) onRefresh();
    } catch (e) {
      toast.error('Failed to approve request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAsPM = async (req) => {
    try {
      setProcessingId(req.id);
      await db.approveFieldFundingByProgramManager(
        req.id,
        'Grace Ochieng (Program Manager)',
        'Approved for finance disbursement.'
      );
      toast.success(`Request ${req.request_code} approved by PM Grace Ochieng.`);
      if (onRefresh) onRefresh();
    } catch (e) {
      toast.error('Failed to approve request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDisburseAsFinance = async (req) => {
    try {
      setProcessingId(req.id);
      await db.disburseFieldFundingByFinance(req.id, 'Mark Ladu (Finance Officer)', {
        payment_method: req.preferred_payout || 'm-Gurush Mobile Money',
        notes: `Funds disbursed to ${req.field_worker_name} (${req.payout_phone || req.field_worker_phone}).`
      });
      toast.success(`Funds (${Number(req.amount).toLocaleString()} ${req.currency || 'SSP'}) disbursed! Voucher generated.`);
      if (onRefresh) onRefresh();
    } catch (e) {
      toast.error('Failed to disburse funds.');
    } finally {
      setProcessingId(null);
    }
  };

  // Expand/collapse state for pending and approved items
  const [expandedPendingId, setExpandedPendingId] = useState(null);
  const [expandedApprovedId, setExpandedApprovedId] = useState(null);

  const togglePendingExpand = (id) => {
    setExpandedPendingId(prev => prev === id ? null : id);
  };

  const toggleApprovedExpand = (id) => {
    setExpandedApprovedId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-3.5 pb-12 animate-in fade-in duration-200">
      
      {/* 1. FLAT TAB BAR (Request, Pending, Approved - No Card Wrapper) */}
      <div className="flex items-center justify-around border-b border-slate-200 px-1">
        <button
          type="button"
          onClick={() => setView('request')}
          className={`pb-2 px-2 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            currentView === 'request'
              ? 'border-[#006B56] text-[#006B56]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Request</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            currentView === 'request' ? 'bg-emerald-100 text-[#006B56]' : 'bg-slate-100 text-slate-500'
          }`}>
            {tasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setView('pending')}
          className={`pb-2 px-2 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            currentView === 'pending'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Pending</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            currentView === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
          }`}>
            {pendingRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setView('approved')}
          className={`pb-2 px-2 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            currentView === 'approved'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Approved</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            currentView === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
          }`}>
            {approvedRequests.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: REQUEST FACILITATION (LIST OF ASSIGNED CASES)                     */}
      {/* ========================================================================= */}
      {currentView === 'request' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          
          {/* Subtle Compact Header */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
            <span>Select an assignment to request facilitation:</span>
            <span className="font-bold text-[#006B56] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {tasks.length} Assigned {tasks.length === 1 ? 'Case' : 'Cases'}
            </span>
          </div>

          {/* Search filter if more than 2 tasks */}
          {tasks.length > 2 && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assignments..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#006B56] outline-none shadow-2xs"
              />
            </div>
          )}

          {/* List of Assigned Cases */}
          {filteredTasks.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Assigned Cases Found</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                You currently have no active field cases assigned in your territory.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTasks.map(task => {
                const taskId = task.id || task.request_code;
                const isFormOpen = activeFormTaskId === taskId;

                // Find any funding requests already made for this specific task
                const taskRequests = requests.filter(r => 
                  (r.linked_task_id && r.linked_task_id === taskId) ||
                  (r.linked_request_code && r.linked_request_code === task.request_code)
                );

                return (
                  <div
                    key={taskId}
                    className={`bg-white rounded-2xl border transition-all duration-200 shadow-2xs overflow-hidden ${
                      isFormOpen ? 'border-[#006B56] ring-1 ring-[#006B56]' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* ASSIGNMENT CARD HEADER (COLLAPSIBLE / EXPANDABLE) */}
                    <div 
                      onClick={() => handleSelectTaskForForm(task)}
                      className="p-3.5 cursor-pointer hover:bg-slate-50/70 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-[#006B56] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              #{task.request_code}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {task.urgency || task.priority || 'Standard'}
                            </span>
                          </div>
                          <h3 className="text-sm font-black text-slate-900 mt-1 truncate">
                            {task.beneficiary_name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{task.payam || worker.payam || 'Kapoeta Town'}</span>
                            <span>•</span>
                            <span>{task.assistance_type || task.category || 'Vulnerability Audit'}</span>
                          </p>
                        </div>

                        {/* Action button & Chevron to open/collapse facilitation request form */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTaskForForm(task);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              isFormOpen
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                : 'bg-[#006B56] hover:bg-[#005a48] text-white shadow-xs active:scale-95'
                            }`}
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>{isFormOpen ? 'Collapse' : 'Request'}</span>
                          </button>
                          <div className="p-1 text-slate-400">
                            {isFormOpen ? <ChevronUp className="w-4 h-4 text-[#006B56]" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Existing Facilitation Status badges if already requested for this task */}
                      {taskRequests.length > 0 && !isFormOpen && (
                        <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold text-slate-500">
                            Facilitation Status:
                          </span>
                          <span className="text-[10px] font-black text-[#006B56] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            ● {taskRequests[0].status} ({Number(taskRequests[0].amount).toLocaleString()} SSP)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* INLINE FACILITATION REQUISITION FORM (CLEAN BREAKDOWN + JUSTIFICATION + TOTAL) */}
                    {isFormOpen && (
                      <div className="p-3.5 bg-slate-50/90 border-t border-slate-100 space-y-3 text-xs animate-in fade-in duration-150">
                        
                        {/* 1. Itemized Breakdown (SSP) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">
                              Itemized Breakdown (SSP)
                            </label>
                            <button
                              type="button"
                              onClick={handleAddBreakdownLine}
                              className="text-[11px] font-bold text-[#006B56] hover:text-[#005a48] flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Line</span>
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            {breakdown.map((line, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={line.item}
                                  onChange={(e) => handleUpdateBreakdownLine(idx, 'item', e.target.value)}
                                  placeholder="Expense description"
                                  className="flex-1 text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#006B56] focus:ring-1 focus:ring-[#006B56] outline-none shadow-2xs font-medium"
                                />
                                <div className="relative w-28 shrink-0">
                                  <input
                                    type="number"
                                    min="0"
                                    value={line.amount}
                                    onChange={(e) => handleUpdateBreakdownLine(idx, 'amount', e.target.value)}
                                    placeholder="0"
                                    className="w-full text-xs font-bold py-1.5 pl-2.5 pr-8 bg-white border border-slate-200 rounded-xl focus:border-[#006B56] focus:ring-1 focus:ring-[#006B56] outline-none shadow-2xs"
                                  />
                                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 pointer-events-none">SSP</span>
                                </div>
                                {breakdown.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBreakdownLine(idx)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                    title="Remove item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 2. Justification Note (After Breakdown) */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Justification Note
                          </label>
                          <textarea
                            rows={2}
                            value={justificationNote}
                            onChange={(e) => setJustificationNote(e.target.value)}
                            placeholder="Enter operational purpose & justification..."
                            className="w-full text-xs font-medium p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#006B56] focus:ring-1 focus:ring-[#006B56] outline-none shadow-2xs resize-none"
                          />
                        </div>

                        {/* 3. Total Amount Display */}
                        <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between shadow-2xs">
                          <span className="text-xs font-bold text-emerald-950">Total Requested Amount:</span>
                          <span className="text-sm font-black text-[#006B56]">
                            {totalAmount.toLocaleString()} SSP
                          </span>
                        </div>

                        {/* 4. Payout Channel */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 px-0.5">
                          <span>Payout Channel:</span>
                          <span className="font-bold text-slate-700">m-Gurush Mobile ({worker.phone || '+211-921-550101'})</span>
                        </div>

                        {/* 5. Action Buttons */}
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveFormTaskId(null)}
                            className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSubmitRequisition(task)}
                            disabled={submitting || totalAmount <= 0}
                            className="flex-1 py-2.5 px-4 bg-[#006B56] hover:bg-[#005a48] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer active:scale-95"
                          >
                            {submitting ? (
                              <span>Submitting...</span>
                            ) : (
                              <span>Submit Requisition ({totalAmount.toLocaleString()} SSP)</span>
                            )}
                          </button>
                        </div>

                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: PENDING FACILITATIONS                                            */}
      {/* ========================================================================= */}
      {currentView === 'pending' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Pending Facilitations</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Requisitions under review by Supervisor Emmanuel, PM Grace, or Finance.
              </p>
            </div>

            <span className="text-xs px-2.5 py-1 rounded-full font-black bg-amber-100 text-amber-900 shrink-0">
              {pendingRequests.length} Pending
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">No Pending Requisitions</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  All submitted facilitations have been processed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setView('request')}
                className="px-4 py-2 bg-[#006B56] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#005a48] transition cursor-pointer"
              >
                + Request Facilitation for Case
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map(req => {
                const isPendingSup = req.status === 'Pending Supervisor Approval';
                const isPendingPM = req.status === 'Pending Program Manager Approval';
                const isReadyFinance = req.status === 'Approved (Pending Finance Disbursement)';
                const isExpanded = expandedPendingId === req.id;

                return (
                  <div 
                    key={req.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                  >
                    {/* Collapsible Header */}
                    <div
                      onClick={() => togglePendingExpand(req.id)}
                      className="p-3.5 space-y-2 cursor-pointer hover:bg-slate-50/70 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-slate-900">
                              {req.request_code || 'REQ-FND-2026'}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                              isReadyFinance ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                              isPendingPM ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                              'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}>
                              ● {req.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mt-0.5">{req.category}</h4>
                          <p className="text-[10px] text-slate-500 font-medium">
                            Linked Case: <strong className="text-slate-800">{req.linked_beneficiary_name || req.linked_request_code}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right shrink-0">
                            <span className="text-base font-black text-slate-900 tracking-tight block">
                              {Number(req.amount).toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 block">{req.currency || 'SSP'}</span>
                          </div>
                          <div className="text-slate-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2.5 text-xs animate-in fade-in duration-150">
                        <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                          {req.purpose}
                        </p>

                        {/* 4-Step Progress Stepper */}
                        <div className="grid grid-cols-4 gap-1 text-center pt-1 border-t border-slate-200 bg-white p-2 rounded-xl border">
                          <div className="flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full bg-[#006B56] text-white flex items-center justify-center text-[9px] font-black mb-0.5">
                              ✓
                            </div>
                            <span className="text-[8px] font-bold text-slate-900">Submitted</span>
                          </div>

                          <div className="flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black mb-0.5 ${
                              req.stage >= 2 ? 'bg-[#006B56] text-white' : 'bg-amber-400 text-slate-900 animate-pulse'
                            }`}>
                              {req.stage >= 2 ? '✓' : '2'}
                            </div>
                            <span className="text-[8px] font-bold text-slate-900">Supervisor</span>
                          </div>

                          <div className="flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black mb-0.5 ${
                              req.stage >= 3 ? 'bg-[#006B56] text-white' : req.stage === 2 ? 'bg-purple-500 text-white animate-pulse' : 'bg-slate-200 text-slate-400'
                            }`}>
                              {req.stage >= 3 ? '✓' : '3'}
                            </div>
                            <span className="text-[8px] font-bold text-slate-900">PM Auth</span>
                          </div>

                          <div className="flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black mb-0.5 ${
                              req.stage === 4 ? 'bg-[#006B56] text-white' : req.stage === 3 ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-200 text-slate-400'
                            }`}>
                              {req.stage === 4 ? '✓' : '4'}
                            </div>
                            <span className="text-[8px] font-bold text-slate-900">Finance</span>
                          </div>
                        </div>

                        {/* Simulation Action Buttons */}
                        <div className="pt-2 flex items-center justify-end gap-1.5">
                          {isPendingSup && (
                            <button
                              type="button"
                              onClick={() => handleApproveAsSupervisor(req)}
                              disabled={processingId === req.id}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve as Supervisor</span>
                            </button>
                          )}

                          {isPendingPM && (
                            <button
                              type="button"
                              onClick={() => handleApproveAsPM(req)}
                              disabled={processingId === req.id}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Authorize as PM</span>
                            </button>
                          )}

                          {isReadyFinance && (
                            <button
                              type="button"
                              onClick={() => handleDisburseAsFinance(req)}
                              disabled={processingId === req.id}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Disburse Cash</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: APPROVED FACILITATIONS & VOUCHERS                                 */}
      {/* ========================================================================= */}
      {currentView === 'approved' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <Receipt className="w-5 h-5 text-[#006B56]" />
                <span>Approved Facilitations</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Disbursed operational funds and official payment receipts.
              </p>
            </div>

            <span className="text-xs px-2.5 py-1 rounded-full font-black bg-emerald-100 text-emerald-900 shrink-0">
              {approvedRequests.length} Disbursed
            </span>
          </div>

          {approvedRequests.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">No Approved Facilitations Yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  Once your supervisor, PM, and Finance disburse your requisitions, official vouchers will appear here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setView('request')}
                className="px-4 py-2 bg-[#006B56] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#005a48] transition cursor-pointer"
              >
                + Request Facilitation
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {approvedRequests.map(req => {
                const isExpanded = expandedApprovedId === req.id;

                return (
                  <div 
                    key={req.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                  >
                    {/* Collapsible Header */}
                    <div
                      onClick={() => toggleApprovedExpand(req.id)}
                      className="p-3.5 space-y-2 cursor-pointer hover:bg-slate-50/70 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-slate-900">
                              {req.request_code || 'REQ-FND-2026'}
                            </span>
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                              ● Disbursed
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mt-0.5">{req.category}</h4>
                          <p className="text-[10px] text-slate-500 font-medium">
                            For: <strong className="text-slate-800">{req.linked_beneficiary_name || req.linked_request_code}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right shrink-0">
                            <span className="text-base font-black text-emerald-800 tracking-tight block">
                              {Number(req.amount).toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 block">{req.currency || 'SSP'}</span>
                          </div>
                          <div className="text-slate-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2.5 text-xs animate-in fade-in duration-150">
                        <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                          {req.purpose}
                        </p>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-[11px] text-slate-500 font-medium">
                            Channel: <strong className="text-slate-800">{req.finance_disbursement?.payment_method || req.preferred_payout}</strong>
                          </span>

                          <button
                            type="button"
                            onClick={() => setSelectedVoucher(req)}
                            className="px-3 py-1.5 bg-[#006B56] hover:bg-[#005a48] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>View Payment Voucher</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. OFFICIAL PAYMENT VOUCHER MODAL                                         */}
      {/* ========================================================================= */}
      {selectedVoucher && (
        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3.5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[92%]">
            
            {/* Voucher Header */}
            <div className="bg-[#006B56] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="text-sm font-black">ADRA South Sudan</h3>
                  <p className="text-[10px] text-emerald-200">Official Field Payment Voucher</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Voucher Body */}
            <div className="p-4 space-y-3.5 text-xs overflow-y-auto">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-800">Total Amount Disbursed</span>
                <span className="text-2xl font-black text-emerald-950 block mt-0.5">
                  {Number(selectedVoucher.amount).toLocaleString()} {selectedVoucher.currency || 'SSP'}
                </span>
                <span className="text-[10px] font-medium text-emerald-700">
                  Channel: {selectedVoucher.finance_disbursement?.payment_method || selectedVoucher.preferred_payout}
                </span>
              </div>

              <div className="space-y-2 border-y border-slate-200 py-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Beneficiary Staff:</span>
                  <span className="font-bold text-slate-900">{selectedVoucher.field_worker_name}</span>
                </div>
                {selectedVoucher.linked_request_code && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Linked Assignment:</span>
                    <span className="font-bold text-[#006B56]">
                      #{selectedVoucher.linked_request_code} ({selectedVoucher.linked_beneficiary_name || 'Assigned Case'})
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Operational Territory:</span>
                  <span className="font-bold text-slate-900">{selectedVoucher.payam}, {selectedVoucher.county}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requisition Category:</span>
                  <span className="font-bold text-slate-900">{selectedVoucher.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Finance Disbursed By:</span>
                  <span className="font-bold text-slate-900">{selectedVoucher.finance_disbursement?.disbursed_by || 'Finance Department'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Disbursement Time:</span>
                  <span className="font-medium text-slate-700">{new Date(selectedVoucher.finance_disbursement?.disbursed_at || Date.now()).toLocaleString()}</span>
                </div>
              </div>

              {/* Itemized Table in Voucher */}
              {selectedVoucher.breakdown && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Itemized Lines</span>
                  <div className="bg-slate-50 rounded-xl p-2 space-y-1 border border-slate-200">
                    {selectedVoucher.breakdown.map((item, i) => (
                      <div key={i} className="flex justify-between text-[11px]">
                        <span className="text-slate-700">{item.item}</span>
                        <span className="font-black text-slate-900">{Number(item.amount).toLocaleString()} {selectedVoucher.currency || 'SSP'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sign-off Stamps */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-center">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block font-bold">Authorized PM</span>
                  <span className="text-slate-800 font-black block mt-0.5">Grace Ochieng</span>
                  <span className="text-emerald-600 font-bold">● Approved</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block font-bold">Disbursed Finance</span>
                  <span className="text-slate-800 font-black block mt-0.5">Mark Ladu</span>
                  <span className="text-emerald-600 font-bold">● Disbursed</span>
                </div>
              </div>
            </div>

            {/* Voucher Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold">Ref: {selectedVoucher.id}</span>
              <button
                type="button"
                onClick={() => {
                  toast.success('Payment Voucher receipt downloaded (PDF / Print view).');
                  setSelectedVoucher(null);
                }}
                className="px-3 py-1.5 bg-[#006B56] hover:bg-[#005a48] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Receipt</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
