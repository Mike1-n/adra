import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  FileCheck,
  User,
  MapPin,
  Calendar,
  Clock,
  Send,
  RotateCcw,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Eye,
  Shield,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Info,
  ExternalLink,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  FileText,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function SupervisorReportReviewView({
  assessments = [],
  activeAssessment = null,
  onBack,
  onForwardToPM,
  onRequestCorrection,
  onAddComment,
  onSelectAssessment
}) {
  const toast = useToast();
  const [selectedAssessment, setSelectedAssessment] = useState(activeAssessment || null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'forwarded' | 'correction' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [supervisorNotes, setSupervisorNotes] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Sync when activeAssessment prop changes
  useEffect(() => {
    if (activeAssessment) {
      setSelectedAssessment(activeAssessment);
    }
  }, [activeAssessment]);

  // If viewing a single report in detail mode
  const current = selectedAssessment;

  const isForwardedToPM = current ? (
    [
      'Forwarded to Program Manager',
      'Forwarded',
      'Awaiting Program Manager Decision',
      'Approved',
      'Dispatched',
      'Completed',
      'Delivered',
      'Closed'
    ].includes(current.status) || Boolean(current.forwarded_to_pm || current.forwarded_to_pm_at || current.forwarded_at)
  ) : false;

  const handleExecuteForward = async () => {
    if (!current) return;
    if (isForwardedToPM) {
      toast.info('This audit has already been forwarded to Programme Manager and cannot be modified.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onForwardToPM(current.id || current.assessment_code, current.request_id || current.request_code, supervisorNotes);
      toast.success(`Assessment ${current.assessment_code} forwarded to Program Manager Grace Ochieng.`);
      setShowForwardModal(false);
      setSupervisorNotes('');
      setSelectedAssessment(null);
    } catch (err) {
      toast.error(err.message || 'Failed to forward assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteCorrection = async () => {
    if (!current) return;
    if (isForwardedToPM) {
      toast.info('This audit has already been forwarded to Programme Manager and is locked.');
      return;
    }
    if (!correctionReason.trim()) {
      toast.warning('Please enter a specific reason for requesting correction.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRequestCorrection(current.id || current.assessment_code, current.request_id || current.request_code, correctionReason);
      toast.info(`Assessment ${current.assessment_code} returned to ${current.field_worker_name} for field correction.`);
      setShowCorrectionModal(false);
      setCorrectionReason('');
      setSelectedAssessment(null);
    } catch (err) {
      toast.error(err.message || 'Failed to return assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteComment = async () => {
    if (!current || !supervisorNotes.trim()) return;
    if (isForwardedToPM) {
      toast.info('This audit is locked under Programme Manager review.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onAddComment(current.id || current.assessment_code, supervisorNotes);
      toast.success('Supervisor comment appended.');
      setShowCommentModal(false);
      setSupervisorNotes('');
    } catch (err) {
      toast.error(err.message || 'Failed to add comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status badges
  const statusStyles = {
    'Under Supervisor Review': 'bg-amber-100 text-amber-800 border-amber-300',
    'Submitted': 'bg-amber-100 text-amber-800 border-amber-300',
    'Correction Required': 'bg-rose-100 text-rose-800 border-rose-300',
    'Forwarded to Program Manager': 'bg-purple-100 text-purple-800 border-purple-300',
    'Awaiting Program Manager Decision': 'bg-purple-100 text-purple-800 border-purple-300',
    'Approved': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Rejected': 'bg-rose-100 text-rose-800 border-rose-300'
  };

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter(item => {
      const status = item.status || 'Under Supervisor Review';
      if (activeTab === 'pending') {
        const isPending = (status === 'Under Supervisor Review' || status === 'Submitted' || status === 'Assessment Submitted' || status === 'Pending' || !item.status) && status !== 'Rejected';
        if (!isPending) return false;
      } else if (activeTab === 'forwarded') {
        const isForwarded = (status === 'Forwarded to Program Manager' || status === 'Approved' || status === 'Awaiting Program Manager Decision') && status !== 'Rejected';
        if (!isForwarded) return false;
      } else if (activeTab === 'correction') {
        const isCorr = status === 'Correction Required';
        if (!isCorr) return false;
      } else if (activeTab === 'rejected') {
        const isRej = status === 'Rejected' || status?.includes('Rejected') || item.returned_to_worker;
        if (!isRej) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = (item.assessment_code || item.id || '').toLowerCase();
        const reqCode = (item.request_code || item.request_id || '').toLowerCase();
        const ben = (item.beneficiary_name || '').toLowerCase();
        const worker = (item.field_worker_name || '').toLowerCase();
        const loc = (item.location || '').toLowerCase();
        const need = (item.assistance_requested || item.recommended_aid || '').toLowerCase();
        if (!code.includes(q) && !reqCode.includes(q) && !ben.includes(q) && !worker.includes(q) && !loc.includes(q) && !need.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [assessments, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: assessments.length,
      pending: assessments.filter(a => (a.status === 'Under Supervisor Review' || a.status === 'Submitted' || a.status === 'Assessment Submitted' || a.status === 'Pending' || !a.status) && a.status !== 'Rejected').length,
      forwarded: assessments.filter(a => (a.status === 'Forwarded to Program Manager' || a.status === 'Approved' || a.status === 'Awaiting Program Manager Decision') && a.status !== 'Rejected').length,
      correction: assessments.filter(a => a.status === 'Correction Required').length,
      rejected: assessments.filter(a => a.status === 'Rejected' || a.status?.includes('Rejected') || a.returned_to_worker).length
    };
  }, [assessments]);

  // If no report is chosen, show the list of assessments pending review
  if (!current) {
    return (
      <div className="space-y-3.5 pb-24 animate-in fade-in duration-200">
        {/* Header Banner */}
        <div className="bg-white p-4 rounded-2xl shadow-2xs border border-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">Field Assessments</h2>
                <p className="text-[11px] font-medium text-slate-500">Quality review &amp; verification audits from field workers</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-purple-100 text-purple-900 rounded-full text-xs font-black">
              {counts.pending} Pending
            </span>
          </div>

          {/* Search bar */}
          <div className="relative mt-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by beneficiary, case code, worker, or location..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006B56] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 p-0.5"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'pending', label: 'Pending Review', count: counts.pending, color: 'bg-amber-500' },
            { id: 'forwarded', label: 'Forwarded to PM', count: counts.forwarded, color: 'bg-purple-600' },
            { id: 'rejected', label: 'Rejected by PM', count: counts.rejected, color: 'bg-rose-600' },
            { id: 'correction', label: 'Needs Correction', count: counts.correction, color: 'bg-rose-500' },
            { id: 'all', label: 'All Audits', count: counts.all, color: 'bg-slate-700' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
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

        {/* Assessments List */}
        <div className="space-y-3">
          {filteredAssessments.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-2 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {searchQuery ? 'No matching assessments found' : 'No Field Assessments in this category'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {searchQuery 
                  ? `No assessments match "${searchQuery}". Try clearing your search.`
                  : activeTab === 'pending'
                    ? 'All submitted field audits have been processed or none have arrived yet. When field workers submit truth reports, they will appear here.'
                    : 'No assessment records recorded under this view.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs font-bold text-[#006B56] hover:underline"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            filteredAssessments.map(item => {
              const finding = item.verification_finding || 'VERIFIED_TRUE';
              const findingConfig = {
                'VERIFIED_TRUE': { label: 'Verified True', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
                'DISCREPANCY': { label: 'Discrepancy Noted', bg: 'bg-amber-100 text-amber-900 border-amber-300' },
                'NOT_ELIGIBLE': { label: 'Not Eligible / Relocated', bg: 'bg-rose-100 text-rose-900 border-rose-300' }
              }[finding] || { label: 'Field Audited', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };

              return (
                <div
                  key={item.id || item.assessment_code}
                  onClick={() => setSelectedAssessment(item)}
                  className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 hover:border-purple-300 hover:shadow-xs transition-all cursor-pointer space-y-3 group"
                >
                  {/* Top Bar: Code, Status & Ground Finding */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-[#006B56] font-mono">
                        {item.assessment_code}
                      </span>
                      {item.request_code && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.request_code}
                        </span>
                      )}
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${findingConfig.bg}`}>
                        {findingConfig.label}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusStyles[item.status] || 'bg-slate-100 text-slate-700'}`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Beneficiary & Field Worker */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-[#006B56] transition-colors">
                      {item.beneficiary_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Audited by <strong>{item.field_worker_name || 'Field Officer'}</strong></span>
                      <span>&bull;</span>
                      <span className="font-mono text-[11px]">{item.date_conducted || (item.submission_date ? new Date(item.submission_date).toLocaleDateString('en-GB') : 'Recent')}</span>
                    </p>
                  </div>

                  {/* Findings Snippet */}
                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">Recommended Aid:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[180px]">
                        {item.recommended_aid || item.assistance_requested || 'Emergency Relief Package'}
                      </span>
                    </div>
                    <div className="flex items-start gap-1 pt-1 text-slate-600 border-t border-slate-200/60">
                      <MapPin className="w-3.5 h-3.5 text-[#006B56] shrink-0 mt-0.5" />
                      <span className="truncate">{item.location || 'Kapoeta South, Eastern Equatoria'}</span>
                    </div>
                    {item.ground_situation_report && (
                      <p className="pt-1 text-[11px] text-slate-700 italic line-clamp-2 border-t border-slate-200/50">
                        "{item.ground_situation_report}"
                      </p>
                    )}
                  </div>

                  {/* Evidence Thumbnails / Documents count */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                      {item.evidence_photos && item.evidence_photos.length > 0 && (
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                          <ImageIcon className="w-3 h-3 text-emerald-700" />
                          <span>{item.evidence_photos.length} Photos</span>
                        </span>
                      )}
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                        Score: {item.vulnerability_score || 85}/100
                      </span>
                    </div>

                    {(() => {
                      const isItemForwarded = [
                        'Forwarded to Program Manager',
                        'Forwarded',
                        'Awaiting Program Manager Decision',
                        'Approved',
                        'Dispatched',
                        'Completed',
                        'Delivered',
                        'Closed'
                      ].includes(item.status) || Boolean(item.forwarded_to_pm || item.forwarded_to_pm_at || item.forwarded_at);

                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAssessment(item);
                          }}
                          className={`inline-flex items-center gap-1 text-xs font-black transition ${
                            isItemForwarded
                              ? 'text-purple-700 hover:text-purple-900 group-hover:underline'
                              : 'text-[#006B56] hover:text-[#005544] group-hover:underline'
                          }`}
                        >
                          <span>{isItemForwarded ? 'View Dossier' : 'Review Dossier'}</span>
                          {isItemForwarded ? <Lock className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col animate-in fade-in duration-200">
      
      {/* Top Navigation Header */}
      <div className="bg-gradient-to-r from-[#006B56] to-[#004D3D] text-white p-4 sticky top-0 z-30 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (onBack) {
                onBack();
              }
              setSelectedAssessment(null);
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Back to Field Assessments List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold leading-tight">Assessment Report</h1>
            <p className="text-xs text-emerald-200/90 font-mono">
              {current.assessment_code} &bull; {current.request_code}
            </p>
          </div>
        </div>

        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusStyles[current.status] || 'bg-white/20 text-white'}`}>
          {current.status}
        </span>
      </div>

      {/* Main Review Form & Findings */}
      <div className="p-4 space-y-4 flex-1 pb-28 max-w-xl mx-auto w-full">

        {/* Rejection Notification Banner when rejected by PM */}
        {current.status === 'Rejected' && (
          <div className="p-4 bg-gradient-to-r from-rose-50 to-red-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 text-xs text-rose-950 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-rose-900 uppercase tracking-wider text-[11px]">
                  Audit Rejected by Programme Manager
                </span>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-rose-200 text-rose-900">
                  Returned to Field
                </span>
              </div>
              <p className="text-[11px] text-rose-950 font-medium leading-relaxed">
                Reason: <span className="font-bold italic">"{current.rejection_reason || current.review_notes || 'Outside eligibility criteria.'}"</span>
              </p>
              <p className="text-[10px] text-rose-800/80">
                This case has been returned directly to Field Officer <strong>{current.field_worker_name || 'assigned officer'}</strong>. The supervisor is notified for visibility and oversight.
              </p>
            </div>
          </div>
        )}

        {/* Read-only notification banner when forwarded to PM */}
        {isForwardedToPM && current.status !== 'Rejected' && (
          <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-2xl flex items-start gap-3 text-xs text-purple-950 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-purple-900 uppercase tracking-wider text-[11px]">
                  Audit Forwarded to Programme Manager
                </span>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-purple-200/80 text-purple-900">
                  Read-Only Mode
                </span>
              </div>
              <p className="text-[11px] text-purple-900/90 leading-relaxed">
                This field audit has been officially submitted to Programme Manager <strong>Grace Ochieng</strong> for final allocation and dispatch decision. The record is locked; supervisors can view findings and evidence but cannot edit, modify, or return the audit.
              </p>
            </div>
          </div>
        )}
        
        {/* Core Beneficiary & Request Overview */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assessed Household</span>
              <h2 className="text-lg font-bold text-slate-900">{current.beneficiary_name}</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Beneficiary ID: {current.beneficiary_code || 'ADRA-SS-000125'}</p>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Field Officer</span>
              <span className="text-xs font-bold text-slate-800">{current.field_worker_name}</span>
              <span className="text-[11px] text-slate-400 block font-mono">{current.date_conducted}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Assistance Requested:</span>
              <span className="font-bold text-slate-900">{current.assistance_requested}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Programme Pillar:</span>
              <span className="font-medium text-slate-800 truncate max-w-[200px]">{current.programme}</span>
            </div>
            <div className="flex items-start space-x-1.5 pt-1 text-slate-600 border-t border-slate-200/60">
              <MapPin className="w-3.5 h-3.5 text-[#006B56] shrink-0 mt-0.5" />
              <span>{current.location || `${current.village || ''}, ${current.payam || ''}, ${current.county || ''}, ${current.state || ''}`}</span>
            </div>
          </div>
        </div>

        {/* Field Worker's Ground Situation & Verification Report */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <FileCheck className="w-4 h-4 text-[#006B56]" />
              <span>Ground Situation Report & Verification ("How it is")</span>
            </h3>
            <span className="text-[10px] font-black px-2.5 py-0.5 bg-emerald-100 text-[#006B56] rounded-md border border-emerald-200">
              Score: {current.vulnerability_score || 85}/100 ({current.urgency_level || 'Critical Need'})
            </span>
          </div>

          {/* HIGHLIGHT: FIELD WORKER JUSTIFICATION TO SUPERIORS */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 space-y-1.5">
            <span className="text-[10px] font-black uppercase text-[#006B56] tracking-wider block">
              Field Officer Official Justification &amp; Need Confirmation
            </span>
            <p className="text-xs text-slate-800 font-medium italic leading-relaxed">
              "{current.field_justification || current.ground_situation_report || current.audit_findings || 'Field Officer confirms household in critical vulnerability. Immediate assistance recommended.'}"
            </p>
          </div>

          {/* Ground Narrative */}
          <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
            <span className="font-bold text-slate-800 block">Detailed Field Observations &amp; Living Conditions:</span>
            <p className="text-slate-600 leading-relaxed">
              {current.ground_situation_report || current.audit_findings || 'Household verified in-person by field team. Severe food deficit and precarious living conditions noted on-site.'}
            </p>
          </div>

          {/* Key Metric Breakdowns */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Food Security Status</span>
              <span className="font-bold text-slate-800 text-[11px] block mt-0.5">
                {current.food_security_status || 'Severe Hunger (1 meal/day)'}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Shelter Condition</span>
              <span className="font-bold text-slate-800 text-[11px] block mt-0.5">
                {current.shelter_condition || 'Makeshift Tukul (Leaking)'}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Water &amp; Sanitation</span>
              <span className="font-bold text-slate-800 text-[11px] block mt-0.5">
                {current.water_access || 'Unprotected River > 2km'}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Household Size</span>
              <span className="font-bold text-slate-800 text-[11px] block mt-0.5">
                {current.family_size || current.household_members || 6} Members ({current.children_under_5 || 2} infants)
              </span>
            </div>
          </div>
        </div>

        {/* Photo Evidence Gallery */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <ImageIcon className="w-4 h-4 text-[#006B56]" />
              <span>Photographic Field Evidence ({current.evidence_photos?.length || 0})</span>
            </h3>
            {current.evidence_photos && current.evidence_photos.length > 0 && (
              <span className="text-[10px] text-slate-400 font-semibold">Click photo to enlarge</span>
            )}
          </div>

          {current.evidence_photos && current.evidence_photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {current.evidence_photos.map((photo, idx) => (
                <div
                  key={photo.id || `photo-${idx}`}
                  onClick={() => setSelectedPhoto(photo)}
                  className="rounded-xl overflow-hidden border border-slate-200 cursor-pointer group relative bg-slate-100 shadow-2xs hover:border-[#006B56] transition"
                >
                  <div className="relative h-28 overflow-hidden bg-slate-900">
                    <img
                      src={photo.url}
                      alt={photo.name || photo.title || 'Field Photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-900/70 text-white backdrop-blur-xs">
                      {photo.category || 'Evidence'}
                    </span>
                  </div>
                  <div className="p-2 bg-white text-[11px] space-y-0.5">
                    <p className="font-bold text-slate-900 truncate">{photo.name || photo.title || 'Field Photo'}</p>
                    <p className="text-slate-400 text-[10px] truncate">{photo.caption || photo.timestamp || 'Attached Field Photo'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs">
              <ImageIcon className="w-6 h-6 mx-auto mb-1 text-slate-300" />
              <span>No photographic evidence was attached to this assessment.</span>
            </div>
          )}
        </div>

        {/* Attached Verification Documents */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>Attached Verification Documents ({current.evidence_documents?.length || 0})</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">Signed forms, IDs &amp; letters</span>
          </div>

          {current.evidence_documents && current.evidence_documents.length > 0 ? (
            <div className="space-y-2">
              {current.evidence_documents.map((doc, idx) => (
                <div
                  key={doc.id || `doc-${idx}`}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                      {doc.name?.split('.').pop()?.toUpperCase() || 'DOC'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 truncate text-xs">{doc.name}</h4>
                      <p className="text-[10px] text-slate-500 truncate">{doc.category || 'Verification Document'} &bull; {doc.size || 'Attached'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {doc.url && (
                      <a
                        href={doc.url}
                        download={doc.name}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-blue-700 font-bold rounded-lg text-[11px] flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>View</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs">
              <FileCheck className="w-6 h-6 mx-auto mb-1 text-slate-300" />
              <span>No verification documents were attached to this assessment.</span>
            </div>
          )}
        </div>

        {/* Field Worker's Official Recommendation */}
        <div className="bg-emerald-50/80 border-2 border-[#006B56]/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#006B56]" />
            <div>
              <h3 className="text-xs font-black text-[#006B56] uppercase tracking-wider">
                Field Worker's Official Recommended Package
              </h3>
              <p className="text-[11px] text-emerald-800/80">Endorsed for Programme Manager final decision</p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2 text-xs">
            <div className="flex items-start justify-between">
              <span className="text-slate-500 font-medium">Recommended Aid Type:</span>
              <span className="font-bold text-slate-900 text-right max-w-[200px]">
                {current.recommended_aid || current.recommendations?.assistance_type || current.assistance_requested || 'Immediate Food & Non-Food Relief Package'}
              </span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-slate-500 font-medium">Urgency Level:</span>
              <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                {current.urgency_rating || current.urgency_level || 'Critical / Immediate'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 text-slate-600">
              <span className="font-bold text-slate-700 block mb-0.5">Field Officer Notes:</span>
              <p className="italic">{current.field_justification || current.field_worker_notes || 'Beneficiary verified in field with genuine urgent need.'}</p>
            </div>
          </div>
        </div>

        {/* Supervisor Existing Review Notes */}
        {current.supervisor_notes && (
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-2 text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider block">Supervisor Logged Remarks</span>
            <div className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed">
              {current.supervisor_notes}
            </div>
          </div>
        )}

      </div>

      {/* Floating Bottom Supervisor Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl z-40">
        <div className="max-w-xl mx-auto">
          {isForwardedToPM ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
                <div className="w-2 h-2 rounded-full bg-purple-600 shrink-0 animate-pulse" />
                <span className="truncate font-semibold text-slate-700 text-xs">
                  Forwarded to PM &bull; <strong className="text-purple-900">Read-Only (Locked)</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onBack) onBack();
                  setSelectedAssessment(null);
                }}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer shrink-0"
              >
                Back to Audits List
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowCorrectionModal(true)}
                className="flex-1 py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-700" />
                <span>Request Correction</span>
              </button>

              <button
                type="button"
                onClick={() => setShowForwardModal(true)}
                className="flex-1 py-3 bg-[#006B56] hover:bg-[#005544] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Forward to PM</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCommentModal(true)}
                className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                title="Add Supervisor Comment"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Forward to Program Manager Modal */}
      {showForwardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Send className="w-4 h-4 text-[#006B56]" />
                <span>Forward to Program Manager</span>
              </h3>
              <button onClick={() => setShowForwardModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600">
              This will update case status to <strong>"Awaiting Program Manager Decision"</strong> and notify Program Manager <strong>Grace Ochieng</strong> for final assistance approval.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Supervisor Endorsement Note (Optional)
              </label>
              <textarea
                rows={3}
                value={supervisorNotes}
                onChange={(e) => setSupervisorNotes(e.target.value)}
                placeholder="e.g., I have verified the household documentation and endorse the field worker's recommendation for urgent food allocation..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B56]"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForwardModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteForward}
                disabled={isSubmitting}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#006B56] rounded-xl hover:bg-[#005544] flex items-center justify-center space-x-1.5 shadow-md"
              >
                <span>{isSubmitting ? 'Forwarding...' : 'Confirm & Forward'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-red-700 flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-red-600" />
                <span>Request Assessment Correction</span>
              </h3>
              <button onClick={() => setShowCorrectionModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600">
              The report will return to Field Worker <strong>{current.field_worker_name}</strong> for field revision. Please state the required correction clearly.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Correction <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="e.g., Please provide clearer evidence of household verification and re-verify water source distance..."
                className="w-full p-2.5 text-xs border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCorrectionModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCorrection}
                disabled={isSubmitting}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 flex items-center justify-center space-x-1.5 shadow-md"
              >
                <span>{isSubmitting ? 'Returning...' : 'Return for Correction'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Supervisor Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-[#006B56]" />
                <span>Add Supervisory Case Comment</span>
              </h3>
              <button onClick={() => setShowCommentModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <div>
              <textarea
                rows={3}
                value={supervisorNotes}
                onChange={(e) => setSupervisorNotes(e.target.value)}
                placeholder="Add confidential supervision note..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B56]"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCommentModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteComment}
                disabled={isSubmitting}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#006B56] rounded-xl hover:bg-[#005544]"
              >
                <span>Save Note</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Fullscreen Viewer */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in cursor-pointer"
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/20">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.name || selectedPhoto.title || 'Field Photo'}
                className="w-full max-h-[75vh] object-contain"
              />
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              >
                ✕
              </button>
            </div>
            <div className="p-3 bg-white/10 text-white rounded-xl mt-3 text-xs flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{selectedPhoto.name || selectedPhoto.title || 'Field Photo Evidence'}</p>
                <p className="text-slate-300 text-[11px] mt-0.5">{selectedPhoto.caption || selectedPhoto.category || selectedPhoto.timestamp || ''}</p>
              </div>
              {selectedPhoto.url && (
                <a
                  href={selectedPhoto.url}
                  download={selectedPhoto.name || 'field-photo.jpg'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-white text-slate-900 font-bold rounded-lg text-[11px] shrink-0"
                >
                  Open Original
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
