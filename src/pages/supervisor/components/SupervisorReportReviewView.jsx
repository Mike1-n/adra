import React, { useState } from 'react';
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
  ExternalLink
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
  const [selectedAssessment, setSelectedAssessment] = useState(activeAssessment || assessments[0] || null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all'
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [supervisorNotes, setSupervisorNotes] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // If viewing a single report in detail mode
  const current = selectedAssessment || activeAssessment;

  const handleExecuteForward = async () => {
    if (!current) return;
    setIsSubmitting(true);
    try {
      await onForwardToPM(current.id || current.assessment_code, current.request_id || current.request_code, supervisorNotes);
      toast.success(`Assessment ${current.assessment_code} forwarded to Program Manager Grace Ochieng.`);
      setShowForwardModal(false);
      setSupervisorNotes('');
    } catch (err) {
      toast.error(err.message || 'Failed to forward assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteCorrection = async () => {
    if (!current) return;
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
    } catch (err) {
      toast.error(err.message || 'Failed to return assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteComment = async () => {
    if (!current || !supervisorNotes.trim()) return;
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
    'Submitted': 'bg-blue-100 text-blue-800 border-blue-300',
    'Correction Required': 'bg-red-100 text-red-800 border-red-300',
    'Forwarded to Program Manager': 'bg-purple-100 text-purple-800 border-purple-300',
    'Approved': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Rejected': 'bg-slate-100 text-slate-700 border-slate-300'
  };

  // If no report is chosen, show the list of assessments pending review
  if (!current) {
    return (
      <div className="space-y-3 pb-24">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <h2 className="text-base font-bold text-slate-900">Assessments Quality Review</h2>
          <p className="text-xs text-slate-500">Examine field verifications before submitting to Program Manager</p>
        </div>

        <div className="space-y-3">
          {assessments.map(item => (
            <div
              key={item.id || item.assessment_code}
              onClick={() => setSelectedAssessment(item)}
              className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#006B56] font-mono">{item.assessment_code}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyles[item.status] || 'bg-slate-100 text-slate-700'}`}>
                  {item.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{item.beneficiary_name}</h3>
                <p className="text-xs text-slate-500">Field Worker: <strong>{item.field_worker_name}</strong> &bull; {item.date_conducted}</p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
                <p><strong className="text-slate-700">Need:</strong> {item.assistance_requested}</p>
                <p className="truncate"><strong className="text-slate-700">Location:</strong> {item.location}</p>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-[#006B56] font-bold">
                <span>Open Assessment Report</span>
                <Eye className="w-4 h-4" />
              </div>
            </div>
          ))}
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
              if (activeAssessment && onBack) {
                onBack();
              } else {
                setSelectedAssessment(null);
              }
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
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

        {/* Assessment Findings Section */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <FileCheck className="w-4 h-4 text-[#006B56]" />
              <span>Field Verification Findings</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-[#006B56] rounded-md">
              {current.vulnerability_level || 'High Vulnerability'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="font-bold text-slate-800 block">1. Household Composition & Demographics</span>
              <p className="text-slate-600 leading-relaxed">{current.assessment_findings?.household_composition || `${current.household_members || 6} household residents verified on-site.`}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="font-bold text-slate-800 block">2. Acute Food Security & Livelihood Status</span>
              <p className="text-slate-600 leading-relaxed">{current.assessment_findings?.food_security_status || 'Severe food gap verified. Food stocks depleted.'}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="font-bold text-slate-800 block">3. Water & Sanitation (WASH)</span>
              <p className="text-slate-600 leading-relaxed">{current.assessment_findings?.water_sanitation || 'Water collection point > 3km away with severe hygiene vulnerability.'}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="font-bold text-slate-800 block">4. Shelter & Living Condition</span>
              <p className="text-slate-600 leading-relaxed">{current.assessment_findings?.shelter_condition || 'Semi-permanent thatched tukul in need of emergency non-food items.'}</p>
            </div>
          </div>
        </div>

        {/* Photo Evidence Gallery */}
        {current.evidence_photos && current.evidence_photos.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <ImageIcon className="w-4 h-4 text-[#006B56]" />
              <span>Photographic Field Evidence ({current.evidence_photos.length})</span>
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {current.evidence_photos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="rounded-xl overflow-hidden border border-slate-200 cursor-pointer group relative bg-slate-100"
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="p-2 bg-white text-[11px]">
                    <p className="font-bold text-slate-900 truncate">{photo.title}</p>
                    <p className="text-slate-400 text-[10px] truncate">{photo.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Field Worker's Official Recommendation */}
        <div className="bg-emerald-50/80 border-2 border-[#006B56]/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#006B56]" />
            <div>
              <h3 className="text-xs font-black text-[#006B56] uppercase tracking-wider">
                Field Worker's Official Recommendation
              </h3>
              <p className="text-[11px] text-emerald-800/80">Separate from final Programme Manager decision</p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2 text-xs">
            <div className="flex items-start justify-between">
              <span className="text-slate-500 font-medium">Recommended Aid Type:</span>
              <span className="font-bold text-slate-900 text-right max-w-[200px]">
                {current.recommendations?.assistance_type || current.assistance_requested}
              </span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-slate-500 font-medium">Quantity / Package:</span>
              <span className="font-bold text-[#006B56] text-right max-w-[200px]">
                {current.recommendations?.recommended_quantity || 'Standard Household Relief Ration'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Urgency Level:</span>
              <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                {current.recommendations?.urgency_rating || 'Critical / Immediate'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 text-slate-600">
              <span className="font-bold text-slate-700 block mb-0.5">Field Officer Notes:</span>
              <p className="italic">{current.field_worker_notes || 'Beneficiary verified in field.'}</p>
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
        <div className="max-w-xl mx-auto flex items-center space-x-2">
          
          <button
            type="button"
            onClick={() => setShowCorrectionModal(true)}
            className="flex-1 py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-amber-700" />
            <span>Request Correction</span>
          </button>

          <button
            type="button"
            onClick={() => setShowForwardModal(true)}
            className="flex-1 py-3 bg-[#006B56] hover:bg-[#005544] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Forward to PM</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCommentModal(true)}
            className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            title="Add Supervisor Comment"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
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
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in"
        >
          <div className="relative max-w-lg w-full">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              className="w-full max-h-[75vh] object-contain rounded-xl"
            />
            <div className="p-3 bg-white/10 text-white rounded-xl mt-3 text-xs">
              <p className="font-bold">{selectedPhoto.title}</p>
              <p className="text-slate-300 text-[11px] mt-0.5">{selectedPhoto.caption}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
