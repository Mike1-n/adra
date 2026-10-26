import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  RefreshCw,
  UserPlus,
  ChevronDown,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { db } from '../../../lib/supabase';

export function SupervisorAssignmentDetailsView({
  assignment,
  fieldWorkers,
  assessments = [],
  onBack,
  onAssignWorker,
  onReassignWorker,
  onOpenReport,
  onForwardToPM,
  onRejectAssessment,
  onRefresh
}) {
  const toast = useToast();
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedNewWorkerId, setSelectedNewWorkerId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [isSubmittingReassign, setIsSubmittingReassign] = useState(false);

  // Field Audit Review & Approval State
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectAuditModal, setShowRejectAuditModal] = useState(false);
  const [endorsementNotes, setEndorsementNotes] = useState(
    'Ground assessment verified and endorsed by State Supervisor. Household vulnerability confirmed. Forwarded to Program Manager Grace Ochieng for final assistance approval.'
  );
  const [rejectAuditReason, setRejectAuditReason] = useState('');
  const [isSubmittingAuditAction, setIsSubmittingAuditAction] = useState(false);

  if (!assignment) return null;

  const rawWorkerName = assignment.assigned_field_worker_name || assignment.field_worker_name || '';
  const hasAssignedWorker = Boolean(
    rawWorkerName &&
    rawWorkerName !== 'Unassigned' &&
    rawWorkerName !== 'Pending Supervisor Assignment' &&
    rawWorkerName !== 'Awaiting Field Worker Allocation' &&
    rawWorkerName !== 'Pending Field Officer Allocation' &&
    rawWorkerName !== 'Pending' &&
    !rawWorkerName.toLowerCase().includes('pending')
  );

  const assignedWorker = hasAssignedWorker ? (
    fieldWorkers?.find(
      w => w.id === assignment.assigned_field_worker_id || 
           w.id === assignment.field_worker_id ||
           w.name?.toLowerCase() === rawWorkerName.toLowerCase()
    ) || {
      name: rawWorkerName,
      phone: assignment.assigned_field_worker_phone || '',
      role: 'Field Officer',
      current_status: 'Active',
      programme: assignment.programme_name || assignment.program_name || 'Emergency Food Security'
    }
  ) : null;

  const selectedWorkerDetails = fieldWorkers?.find(w => String(w.id) === String(selectedNewWorkerId));

  const handleExecuteReassign = async () => {
    if (!selectedNewWorkerId) {
      toast.warning(hasAssignedWorker ? 'Please select a new Field Worker.' : 'Please select a Field Worker to assign.');
      return;
    }
    const finalReason = reassignReason.trim() || (hasAssignedWorker ? 'Supervisor reassignment' : 'Initial field assessment allocation');
    const newWorker = fieldWorkers?.find(w => String(w.id) === String(selectedNewWorkerId)) || { name: 'Field Worker' };
    
    setIsSubmittingReassign(true);
    try {
      const assignFn = onAssignWorker || onReassignWorker;
      if (assignFn) {
        await assignFn(assignment.id || assignment.request_code, selectedNewWorkerId, newWorker.name, finalReason);
      }
      toast.success(
        hasAssignedWorker
          ? `Case successfully reassigned to ${newWorker.name}.`
          : `Case successfully assigned to ${newWorker.name}.`
      );
      setShowReassignModal(false);
      setReassignReason('');
      setSelectedNewWorkerId('');
    } catch (err) {
      toast.error(err.message || 'Failed to assign worker.');
    } finally {
      setIsSubmittingReassign(false);
    }
  };

  // Linked Assessment Detection
  const linkedAssessment = assessments?.find(a => 
    (assignment.id && (a.request_id === assignment.id || a.request_code === assignment.id)) ||
    (assignment.request_code && (a.request_code === assignment.request_code || a.request_id === assignment.request_code)) ||
    (assignment.assessment_code && (a.assessment_code === assignment.assessment_code || a.id === assignment.assessment_code)) ||
    (assignment.beneficiary_name && a.beneficiary_name?.toLowerCase() === assignment.beneficiary_name?.toLowerCase())
  );

  const hasAssessmentSubmitted =
    assignment.status === 'Assessment Submitted' ||
    assignment.status === 'Under Supervisor Review' ||
    assignment.status === 'Field Assessment Completed' ||
    assignment.status === 'Awaiting Program Manager Decision' ||
    assignment.status === 'Forwarded to Program Manager' ||
    assignment.status === 'Approved' ||
    Boolean(assignment.assessment_code) ||
    Boolean(assignment.vulnerability_score) ||
    Boolean(assignment.ground_situation_report) ||
    Boolean(linkedAssessment);

  const isAlreadyForwarded =
    assignment.status === 'Forwarded to Program Manager' ||
    assignment.status === 'Awaiting Program Manager Decision' ||
    assignment.status === 'Approved' ||
    assignment.status === 'Approved by Program Manager' ||
    linkedAssessment?.status === 'Forwarded to Program Manager' ||
    Boolean(assignment.forwarded_to_pm || linkedAssessment?.forwarded_to_pm);

  // Approve & Forward to PM Handler
  const handleExecuteApproveAndForward = async () => {
    setIsSubmittingAuditAction(true);
    try {
      const assId = linkedAssessment?.id || linkedAssessment?.assessment_code || assignment.assessment_code || `ass-${assignment.id}`;
      const reqId = assignment.id || assignment.request_code;
      const notes = endorsementNotes.trim() || 'Ground assessment verified and endorsed by State Supervisor. Household vulnerability confirmed. Forwarded to Program Manager Grace Ochieng for final assistance approval.';

      if (onForwardToPM) {
        await onForwardToPM(assId, reqId, notes);
      } else {
        await db.forwardAssessmentToPM(assId, reqId, notes);
        if (onRefresh) await onRefresh();
      }

      toast.success(`Assessment for ${assignment.beneficiary_name} approved and forwarded to Program Manager Grace Ochieng!`);
      setShowApproveModal(false);
      if (onBack) onBack();
    } catch (err) {
      console.error('Error forwarding assessment:', err);
      toast.error(err.message || 'Failed to approve and forward assessment.');
    } finally {
      setIsSubmittingAuditAction(false);
    }
  };

  // Reject / Return Audit to Worker Handler
  const handleExecuteRejectAudit = async () => {
    if (!rejectAuditReason.trim() || rejectAuditReason.trim().length < 5) {
      toast.warning('Please enter a specific reason for returning the audit.');
      return;
    }

    setIsSubmittingAuditAction(true);
    try {
      const assId = linkedAssessment?.id || linkedAssessment?.assessment_code || assignment.assessment_code || `ass-${assignment.id}`;
      const reqId = assignment.id || assignment.request_code;
      const reason = rejectAuditReason.trim();

      if (onRejectAssessment) {
        await onRejectAssessment(assId, reqId, reason);
      } else {
        await db.rejectAssessmentBySupervisor(assId, reqId, reason);
        if (onRefresh) await onRefresh();
      }

      toast.info(`Assessment for ${assignment.beneficiary_name} returned to field officer for re-audit.`);
      setShowRejectAuditModal(false);
      if (onBack) onBack();
    } catch (err) {
      console.error('Error returning assessment:', err);
      toast.error(err.message || 'Failed to return assessment.');
    } finally {
      setIsSubmittingAuditAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col animate-in fade-in duration-200">
      
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-[#006B56] to-[#004D3D] text-white sticky top-0 z-30 shadow-md pt-safe">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold leading-tight">Assignment Case Details</h1>
              <p className="text-xs text-emerald-200/90 font-mono">
                {assignment.request_code || assignment.id}
              </p>
            </div>
          </div>

          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
            assignment.status === 'Rejected by Supervisor' || assignment.status_label === 'Rejected by Supervisor' || assignment.status === 'Rejected' || assignment.returned_to_worker
              ? 'bg-rose-500/30 text-rose-100 border-rose-300 font-extrabold'
              : 'bg-white/15 text-white border border-white/20'
          }`}>
            {assignment.status_label || assignment.status}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-3 flex-1 pb-16 max-w-xl mx-auto w-full">
        
        {/* REJECTION / RETURNED BANNER IF APPLICABLE */}
        {(assignment.status === 'Rejected' || assignment.status === 'Rejected by Supervisor' || assignment.status_label?.includes('Rejected') || assignment.returned_to_worker) && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <h3 className="text-xs font-black text-rose-900 leading-tight">
                Audit Returned / Rejected
              </h3>
            </div>
            {(assignment.rejection_reason || assignment.review_notes) && (
              <p className="text-xs text-rose-950 font-medium italic">
                "{assignment.rejection_reason || assignment.review_notes}"
              </p>
            )}
          </div>
        )}

        {/* 1. BENEFICIARY & CASE DETAILS CARD */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#006B56] border border-emerald-200/80 flex items-center justify-center font-bold text-sm shrink-0">
                <User className="w-5 h-5 text-[#006B56]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-slate-900 truncate">
                  {assignment.beneficiary_name}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {assignment.beneficiary_code || assignment.beneficiary_id || 'ADRA-SS-000125'}
                </p>
              </div>
            </div>
            
            <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl border shrink-0 ${
              assignment.priority === 'Critical' || assignment.urgency === 'Critical'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : assignment.priority === 'High' || assignment.urgency === 'High'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {assignment.priority || assignment.urgency || 'High'} Priority
            </span>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Aid Category</span>
              <span className="font-extrabold text-slate-800 truncate block mt-0.5">
                {assignment.assistance_type || assignment.category || 'Food, Water'}
              </span>
            </div>
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Household</span>
              <span className="font-extrabold text-slate-800 block mt-0.5">
                {assignment.household_members || 8} Members
              </span>
            </div>
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Assessment Window</span>
              <span className="font-extrabold text-amber-700 block mt-0.5 font-mono">
                {assignment.due_date || '48h Standard Window'}
              </span>
            </div>
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Programme</span>
              <span className="font-extrabold text-slate-800 truncate block mt-0.5">
                {assignment.programme_name || assignment.program_name || 'Emergency Relief & Humanitarian Response'}
              </span>
            </div>
          </div>

          {/* Administrative Location */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#006B56]" />
              <span>Administrative Location</span>
            </span>
            <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 font-medium flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-900">{assignment.state || 'Central Equatoria'}</span>
              <span className="text-slate-400">&rsaquo;</span>
              <span className="font-bold text-slate-900">{assignment.county || 'Juba'}</span>
              <span className="text-slate-400">&rsaquo;</span>
              <span className="font-semibold text-slate-800">{assignment.payam || 'Juba Na Bari'}</span>
              {(assignment.boma || assignment.boma_name) && (
                <>
                  <span className="text-slate-400">&rsaquo;</span>
                  <span>Boma: <strong>{assignment.boma || assignment.boma_name}</strong></span>
                </>
              )}
              {(assignment.village || assignment.zone) && (
                <>
                  <span className="text-slate-400">&rsaquo;</span>
                  <span>Zone: <strong>{assignment.village || assignment.zone}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 2. FIELD AUDIT & SUPERVISOR VERIFICATION CARD */}
        {hasAssessmentSubmitted && (
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-emerald-300/80 space-y-3.5 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#006B56] flex items-center justify-center font-bold">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                    Field Audit &amp; Verification Report
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Conducted by {assignedWorker?.name || assignment.assigned_field_worker_name || 'Simon Kiden'}
                  </span>
                </div>
              </div>

              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                isAlreadyForwarded
                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300 animate-pulse'
              }`}>
                {isAlreadyForwarded ? '✓ Forwarded to PM' : '● Ready for Review & Approval'}
              </span>
            </div>

            {/* Findings Preview */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white/90 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Vulnerability Score</span>
                <span className="text-sm font-black text-emerald-800">
                  {linkedAssessment?.vulnerability_score || assignment.vulnerability_score || 85} / 100
                </span>
              </div>
              <div className="p-2.5 bg-white/90 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Urgency Finding</span>
                <span className="text-xs font-black text-rose-700">
                  {linkedAssessment?.urgency_level || assignment.urgency || 'Critical Emergency'}
                </span>
              </div>
            </div>

            {/* Ground Situation Summary */}
            {(linkedAssessment?.ground_situation_report || assignment.ground_situation_report || linkedAssessment?.field_justification || assignment.field_justification) && (
              <div className="p-3 bg-white/90 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  On-Ground Verification Findings
                </span>
                <p className="text-slate-800 italic leading-relaxed font-medium line-clamp-3">
                  "{linkedAssessment?.ground_situation_report || assignment.ground_situation_report || linkedAssessment?.field_justification || assignment.field_justification}"
                </p>
              </div>
            )}

            {/* Supervisor Action Buttons */}
            <div className="space-y-2 pt-1">
              {isAlreadyForwarded ? (
                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-blue-950 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Audit Endorsed &amp; Forwarded to Programme Manager</span>
                  </div>
                  {onOpenReport && (
                    <button
                      type="button"
                      onClick={onOpenReport}
                      className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg text-[11px] font-bold transition cursor-pointer"
                    >
                      View Dossier
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {onOpenReport && (
                      <button
                        type="button"
                        onClick={onOpenReport}
                        className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                        <span>Review Full Audit</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowApproveModal(true)}
                      className="flex-1 py-2.5 px-3 bg-[#006B56] hover:bg-[#005a48] text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>Approve &amp; Forward to PM</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRejectAuditModal(true)}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Reject / Request Re-Audit</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. FIELD WORKER ASSIGNMENT CARD */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#006B56]" />
              <span>Field Worker Assignment</span>
            </span>
            {hasAssignedWorker ? (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                Assigned
              </span>
            ) : (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                Unassigned
              </span>
            )}
          </div>

          {hasAssignedWorker && assignedWorker ? (
            <div className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-[#006B56] shrink-0 font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{assignedWorker.name}</p>
                    {assignedWorker.phone && (
                      <p className="text-xs text-slate-500 font-mono">{assignedWorker.phone}</p>
                    )}
                    <p className="text-[11px] text-[#006B56] font-semibold">{assignedWorker.role || 'Field Officer'}</p>
                  </div>
                </div>

                {assignedWorker.phone && (
                  <a
                    href={`tel:${assignedWorker.phone}`}
                    className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006B56] hover:bg-emerald-100 flex items-center justify-center transition border border-emerald-200/60"
                    title="Call Field Worker"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowReassignModal(true)}
                className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 border border-slate-200 shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>Reassign Field Worker</span>
              </button>
            </div>
          ) : (
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <UserPlus className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">No Field Worker Assigned</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select and dispatch a field officer to conduct the physical household assessment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReassignModal(true)}
                className="w-full py-2.5 bg-[#006B56] hover:bg-[#005544] text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
              >
                <UserPlus className="w-4 h-4" />
                <span>Assign Field Worker</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Assign / Reassign Worker Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                {hasAssignedWorker ? (
                  <RefreshCw className="w-4 h-4 text-[#006B56]" />
                ) : (
                  <UserPlus className="w-4 h-4 text-[#006B56]" />
                )}
                <span>{hasAssignedWorker ? 'Reassign Field Worker' : 'Assign Field Worker'}</span>
              </h3>
              <button onClick={() => setShowReassignModal(false)} className="text-slate-400 hover:text-slate-600 text-lg p-1">
                &times;
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {hasAssignedWorker ? 'Select New Field Worker' : 'Select Field Worker'}
              </label>
              <div className="relative">
                <select
                  value={selectedNewWorkerId}
                  onChange={(e) => setSelectedNewWorkerId(e.target.value)}
                  className="w-full p-2.5 pr-10 text-xs font-medium border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#006B56] appearance-none text-slate-900 cursor-pointer shadow-xs"
                >
                  <option value="">-- Choose Field Worker --</option>
                  {fieldWorkers?.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} — {w.assigned_area || 'Central Equatoria'} ({w.current_status || 'Available'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {selectedWorkerDetails && (
                <div className="mt-2 p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                  <div>
                    <p className="font-bold text-slate-900">{selectedWorkerDetails.name}</p>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {selectedWorkerDetails.assigned_area || 'Central Equatoria'} &bull; {selectedWorkerDetails.phone || 'Field Team'}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800">
                    {selectedWorkerDetails.current_status || 'Available'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Assignment Notes / Directives (Optional)
              </label>
              <textarea
                rows={2}
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="e.g., Priority household verification for emergency food ration..."
                className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B56]"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReassign}
                disabled={isSubmittingReassign}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#006B56] rounded-xl hover:bg-[#005544] flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                <span>
                  {isSubmittingReassign
                    ? 'Assigning...'
                    : hasAssignedWorker
                    ? 'Confirm Reassignment'
                    : 'Assign Field Worker'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve & Forward to PM Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#006B56] flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Approve Audit &amp; Forward to PM</h3>
                  <p className="text-[10px] text-slate-500">{assignment.request_code || assignment.id} &bull; {assignment.beneficiary_name}</p>
                </div>
              </div>
              <button onClick={() => setShowApproveModal(false)} className="text-slate-400 hover:text-slate-600 text-lg p-1 cursor-pointer">
                &times;
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#006B56]" />
                <span>Supervisor Official Endorsement</span>
              </p>
              <p className="text-[11px] text-emerald-900">
                By approving this audit, you formally certify that the household verification conducted by <strong>{assignedWorker?.name || assignment.assigned_field_worker_name || 'Simon Kiden'}</strong> is accurate and warrants emergency relief.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Supervisor Endorsement Notes for Programme Manager
              </label>
              <textarea
                rows={3}
                value={endorsementNotes}
                onChange={(e) => setEndorsementNotes(e.target.value)}
                placeholder="Enter endorsement notes..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B56]"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteApproveAndForward}
                disabled={isSubmittingAuditAction}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#006B56] rounded-xl hover:bg-[#005544] flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingAuditAction ? 'Forwarding...' : 'Approve & Forward to PM'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject / Request Re-Audit Modal */}
      {showRejectAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Reject Audit / Return to Officer</h3>
                  <p className="text-[10px] text-slate-500">{assignment.request_code || assignment.id} &bull; {assignment.beneficiary_name}</p>
                </div>
              </div>
              <button onClick={() => setShowRejectAuditModal(false)} className="text-slate-400 hover:text-slate-600 text-lg p-1 cursor-pointer">
                &times;
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1.5">
                Mandatory Rejection / Re-Audit Reason *
              </label>
              <textarea
                rows={3}
                value={rejectAuditReason}
                onChange={(e) => setRejectAuditReason(e.target.value)}
                placeholder="Explain clearly why this audit is being returned to the field officer (e.g., incomplete household verification, missing biometric/photo evidence)..."
                className="w-full p-2.5 text-xs border border-rose-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectAuditModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRejectAudit}
                disabled={isSubmittingAuditAction}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{isSubmittingAuditAction ? 'Returning...' : 'Confirm Return to Officer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
