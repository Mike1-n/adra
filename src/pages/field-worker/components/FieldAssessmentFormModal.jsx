import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  FileCheck,
  Camera,
  Upload,
  Image as ImageIcon,
  FileText,
  Trash2,
  AlertCircle,
  Check,
  CheckCircle2,
  MapPin,
  User,
  ShieldCheck,
  Sparkles,
  Loader2,
  Plus,
  ClipboardList,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  CheckSquare,
  Square
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function FieldAssessmentFormModal({
  isOpen,
  onClose,
  task = null,
  tasks = [],
  assessments = [],
  readOnly = false,
  project = null,
  worker = {},
  onSubmitAssessment
}) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Wizard Step State (1: Finding & Case, 2: Report & Justification, 3: Evidence & Oath)
  const [currentStep, setCurrentStep] = useState(1);

  // Selected task state for task picker
  const [selectedTaskId, setSelectedTaskId] = useState(() => task?.id || task?.request_code || '');

  // Detect whether an assessment has already been submitted for the target task/case
  const existingAssessment = useMemo(() => {
    const currentTask = task || (tasks || []).find(t => (t.id && t.id.toString() === selectedTaskId?.toString()) || (t.request_code && t.request_code.toString() === selectedTaskId?.toString()));
    
    // Check in assessments array
    if (Array.isArray(assessments) && assessments.length > 0) {
      const found = assessments.find(a => 
        (currentTask?.id && (a.request_id === currentTask.id || a.request_code === currentTask.id)) ||
        (currentTask?.request_code && (a.request_code === currentTask.request_code || a.request_id === currentTask.request_code)) ||
        (currentTask?.beneficiary_name && a.beneficiary_name === currentTask.beneficiary_name) ||
        (currentTask?.beneficiary_code && a.beneficiary_code === currentTask.beneficiary_code) ||
        (selectedTaskId && (a.request_id === selectedTaskId || a.request_code === selectedTaskId || a.id === selectedTaskId))
      );
      if (found) return found;
    }

    // Check if currentTask status indicates already submitted
    if (
      currentTask?.status === 'Assessment Submitted' ||
      currentTask?.status === 'Awaiting Program Manager Decision' ||
      currentTask?.status === 'Completed' ||
      currentTask?.status === 'Approved' ||
      currentTask?.status === 'Distributed' ||
      Boolean(currentTask?.assessment_code)
    ) {
      return {
        assessment_code: currentTask.assessment_code || 'FA-89500',
        beneficiary_name: currentTask.beneficiary_name,
        beneficiary_code: currentTask.beneficiary_code,
        request_code: currentTask.request_code,
        payam: currentTask.payam || worker?.payam,
        county: currentTask.county || worker?.county,
        state: currentTask.state || worker?.state,
        village: currentTask.village || currentTask.village_area,
        vulnerability_score: currentTask.vulnerability_score || 85,
        urgency_level: currentTask.urgency_level || 'High',
        status: currentTask.status || 'Assessment Submitted',
        date_conducted: currentTask.date_conducted || new Date(currentTask.updated_at || currentTask.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        submission_date: currentTask.submission_date || currentTask.updated_at || new Date().toISOString(),
        ground_situation_report: currentTask.ground_situation_report || currentTask.audit_findings || 'On-ground physical field assessment conducted and verified in-person. Severe vulnerability and acute food insecurity verified on site.',
        field_justification: currentTask.field_justification || 'Verified genuine need for immediate humanitarian assistance. Dispatched for Supervisor & PM review.',
        audit_findings: currentTask.audit_findings || currentTask.ground_situation_report || 'On-ground verification completed.',
        recommended_aid: currentTask.recommended_aid || `${currentTask.category || 'Humanitarian'} Relief Kit`,
        assessed_by: currentTask.assessed_by || currentTask.field_worker_name || worker?.name || 'Field Officer',
        assignment_verified_true: currentTask.assignment_verified_true !== false,
        verification_finding: currentTask.verification_finding || 'VERIFIED_TRUE',
        verification_finding_label: currentTask.verification_finding_label || 'Assignment Verified True on Ground',
        truth_statement: currentTask.truth_statement || `I, ${worker?.name || 'Field Officer'}, certify under official humanitarian duty that I conducted an in-person field visit to ${currentTask.beneficiary_name}. The assignment given concerning this beneficiary is TRUE, genuine, and in acute need of aid.`,
        evidence_photos: currentTask.evidence_photos || [],
        evidence_documents: currentTask.evidence_documents || []
      };
    }

    return null;
  }, [task, selectedTaskId, tasks, assessments, worker]);

  const currentTaskObj = task || (tasks || []).find(t => (t.id && t.id.toString() === selectedTaskId?.toString()) || (t.request_code && t.request_code.toString() === selectedTaskId?.toString()));
  const isRejectedCase = Boolean(
    currentTaskObj?.status === 'Rejected' ||
    currentTaskObj?.status_label === 'Rejected by PM' ||
    currentTaskObj?.returned_to_worker ||
    task?.status === 'Rejected' ||
    task?.status_label === 'Rejected by PM' ||
    task?.returned_to_worker
  );

  // If case was rejected/returned to fieldworker, do not lock into submitted read-only mode unless readOnly is explicitly true
  const isSubmittedMode = Boolean((readOnly || existingAssessment) && !isRejectedCase);

  // Form Data State
  const [formData, setFormData] = useState(() => ({
    beneficiary_name: task?.beneficiary_name || '',
    beneficiary_code: task?.beneficiary_code || '',
    request_code: task?.request_code || '',
    request_id: task?.id || '',
    project_id: project?.id || project?.project_code || task?.project_id || '',
    project_name: project?.project_name || task?.project_name || task?.program_name || '',
    project_code: project?.project_code || task?.project_code || '',
    phone: task?.phone || task?.phone_number || '',
    state: task?.state || worker?.state || 'Eastern Equatoria',
    county: task?.county || worker?.county || 'Kapoeta South',
    payam: task?.payam || worker?.payam || 'Kapoeta Town',
    village: task?.village || task?.village_area || 'Longeleya',
    urgency_level: task?.urgency_level || 'Critical Emergency',
    recommended_aid: task?.category ? `${task.category} & Emergency Relief Kit` : (project?.sector ? `${project.sector} Relief Kit` : 'Emergency Food Basket & WASH Kit'),
    ground_situation_report: task
      ? `On-ground physical field assessment conducted for ${task.beneficiary_name}. Household visited in-person in ${task.payam || 'the payam'}. Living in severely compromised makeshift conditions with acute food insecurity and zero reserves remaining.`
      : (project ? `On-ground household vulnerability audit conducted under project ${project.project_code} (${project.project_name}). Urgent humanitarian intervention required.` : 'Household visited in-person. Severe economic and nutritional distress observed on-site with urgent need for humanitarian intervention.'),
    field_justification: task
      ? `I hereby verify to the Supervisor and Program Manager that ${task.beneficiary_name} (${task.request_code || 'Case'}) genuinely requires the requested assistance (${task.category || project?.sector || 'Humanitarian Relief'}). Immediate approval and dispatch is strongly recommended.`
      : `I hereby certify that the beneficiary household urgently requires immediate humanitarian assistance under ${project?.project_name || 'humanitarian relief'} to avert acute distress.`
  }));

  // Truth Verification & Assessment Protocol State
  const [verificationFinding, setVerificationFinding] = useState('VERIFIED_TRUE'); // 'VERIFIED_TRUE' | 'DISCREPANCY_FOUND' | 'INELIGIBLE_OR_RELOCATED'
  const [truthCertifiedAgreed, setTruthCertifiedAgreed] = useState(true);
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');
  const [checklist, setChecklist] = useState({
    visitedInPerson: true,
    idHeadVerified: true,
    vulnerabilityConfirmed: true,
    photoEvidenceTaken: true
  });

  // Evidence Photos State (empty by default - uploaded by field worker)
  const [evidencePhotos, setEvidencePhotos] = useState([]);

  // Evidence Documents State (empty by default - uploaded by field worker)
  const [evidenceDocs, setEvidenceDocs] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to autofill when a task is picked
  const applyTaskToForm = (t) => {
    if (!t) return;
    setSelectedTaskId(t.id || t.request_code || '');
    setFormData(prev => ({
      ...prev,
      beneficiary_name: t.beneficiary_name || prev.beneficiary_name,
      beneficiary_code: t.beneficiary_code || prev.beneficiary_code,
      request_code: t.request_code || prev.request_code,
      request_id: t.id || prev.request_id,
      phone: t.phone || t.phone_number || prev.phone,
      state: t.state || worker?.state || prev.state,
      county: t.county || worker?.county || prev.county,
      payam: t.payam || worker?.payam || prev.payam,
      village: t.village || t.village_area || prev.village,
      recommended_aid: t.category ? `${t.category} & Emergency Relief Kit` : prev.recommended_aid,
      ground_situation_report: t.ground_situation_report || t.audit_findings || `On-ground physical field assessment conducted for ${t.beneficiary_name}. Household visited in-person in ${t.payam || 'the payam'}. Living in severely compromised makeshift conditions with acute food insecurity and zero reserves remaining.`,
      field_justification: t.field_justification || `I hereby verify to the Supervisor and Program Manager that ${t.beneficiary_name} (${t.request_code || 'Case'}) genuinely requires the requested assistance (${t.category || 'Humanitarian Relief'}). Immediate approval and dispatch is strongly recommended.`
    }));
    setEvidencePhotos(t.evidence_photos || []);
    setEvidenceDocs(t.evidence_documents || []);
  };

  // Sync state if existingAssessment or task changes from props
  useEffect(() => {
    if (existingAssessment) {
      setFormData(prev => ({
        ...prev,
        beneficiary_name: existingAssessment.beneficiary_name || prev.beneficiary_name,
        beneficiary_code: existingAssessment.beneficiary_code || prev.beneficiary_code,
        request_code: existingAssessment.request_code || prev.request_code,
        request_id: existingAssessment.request_id || prev.request_id,
        phone: existingAssessment.phone || prev.phone,
        state: existingAssessment.state || prev.state,
        county: existingAssessment.county || prev.county,
        payam: existingAssessment.payam || prev.payam,
        village: existingAssessment.village || prev.village,
        urgency_level: existingAssessment.urgency_level || prev.urgency_level,
        recommended_aid: existingAssessment.recommended_aid || prev.recommended_aid,
        ground_situation_report: existingAssessment.ground_situation_report || existingAssessment.audit_findings || prev.ground_situation_report,
        field_justification: existingAssessment.field_justification || prev.field_justification
      }));
      setVerificationFinding(existingAssessment.verification_finding || (existingAssessment.assignment_verified_true ? 'VERIFIED_TRUE' : 'DISCREPANCY_FOUND'));
      setDiscrepancyNotes(existingAssessment.discrepancy_notes || '');
      setEvidencePhotos(existingAssessment.evidence_photos || []);
      setEvidenceDocs(existingAssessment.evidence_documents || []);
      if (existingAssessment.verification_checklist) {
        setChecklist(existingAssessment.verification_checklist);
      }
      setTruthCertifiedAgreed(true);
    } else if (task) {
      applyTaskToForm(task);
    } else if (tasks && tasks.length > 0 && !selectedTaskId) {
      const firstPending = tasks.find(t => t.status === 'Assessment In Progress' || t.status?.includes('Pending') || t.status === 'Assigned to Field Worker') || tasks[0];
      if (firstPending) {
        applyTaskToForm(firstPending);
      }
    }
  }, [existingAssessment, task, tasks]);

  if (!isOpen) return null;

  // Handle Task Select dropdown change
  const handleTaskSelectionChange = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      setSelectedTaskId('custom');
      setFormData(prev => ({
        ...prev,
        beneficiary_name: '',
        request_code: `REQ-${Math.floor(10000 + Math.random() * 90000)}`,
        request_id: '',
        ground_situation_report: '',
        field_justification: ''
      }));
      return;
    }

    const foundTask = tasks.find(t => (t.id && t.id.toString() === val) || (t.request_code && t.request_code.toString() === val));
    if (foundTask) {
      applyTaskToForm(foundTask);
      toast?.showToast?.(`Loaded ${foundTask.beneficiary_name} details`, 'info');
    }
  };

  // Helper to compress uploaded images via canvas to ensure small footprint in localStorage
  const compressImage = (file) => {
    return new Promise((resolve) => {
      if (!file.type || !file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(e.target?.result || '');
        img.src = e.target?.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Handle Photo Upload with compression
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      try {
        const compressedUrl = await compressImage(file);
        if (compressedUrl) {
          const newPhoto = {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: file.name,
            title: file.name,
            url: compressedUrl,
            category: 'Field Evidence',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setEvidencePhotos(prev => [...prev, newPhoto]);
        }
      } catch (err) {
        console.error('Error reading photo:', err);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    toast?.showToast?.(`${files.length} photo(s) added & processed`, 'success');
  };

  // Remove Photo
  const handleRemovePhoto = (id) => {
    setEvidencePhotos(prev => prev.filter(p => p.id !== id));
  };

  // Handle Document Upload (convert to base64 URL for storage and viewing)
  const handleDocUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      try {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const sizeStr = sizeMB >= 1 ? `${sizeMB} MB` : `${Math.round(file.size / 1024)} KB`;

        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });

        if (dataUrl) {
          const newDoc = {
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: file.name,
            size: sizeStr,
            type: file.type || 'Document',
            url: dataUrl,
            data_url: dataUrl,
            date: new Date().toLocaleDateString()
          };
          setEvidenceDocs(prev => [...prev, newDoc]);
        }
      } catch (err) {
        console.error('Error reading document:', err);
      }
    }

    if (docInputRef.current) docInputRef.current.value = '';
    toast?.showToast?.(`${files.length} document(s) attached`, 'success');
  };

  // Remove Document
  const handleRemoveDoc = (id) => {
    setEvidenceDocs(prev => prev.filter(d => d.id !== id));
  };

  const toggleChecklistItem = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Validate step before moving forward
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.beneficiary_name.trim()) {
        toast?.showToast?.('Please enter or select the beneficiary name', 'error');
        return;
      }
      if (verificationFinding !== 'VERIFIED_TRUE' && !discrepancyNotes.trim()) {
        toast?.showToast?.('Please provide an explanation for the discrepancy / ineligibility', 'error');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.ground_situation_report.trim()) {
        toast?.showToast?.('Please describe the on-ground situation findings', 'error');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.beneficiary_name.trim()) {
      toast?.showToast?.('Please enter or select the beneficiary name', 'error');
      setCurrentStep(1);
      return;
    }

    if (!formData.ground_situation_report.trim()) {
      toast?.showToast?.('Please provide the on-ground situation report', 'error');
      setCurrentStep(2);
      return;
    }

    if (!truthCertifiedAgreed) {
      toast?.showToast?.('You must certify the on-ground assessment declaration before submitting.', 'warning');
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);

    try {
      const isVerifiedTrue = verificationFinding === 'VERIFIED_TRUE';

      const payload = {
        beneficiary_name: formData.beneficiary_name,
        beneficiary_code: formData.beneficiary_code || `BEN-${Math.floor(1000 + Math.random() * 9000)}`,
        request_code: formData.request_code || `REQ-${Math.floor(10000 + Math.random() * 90000)}`,
        request_id: formData.request_id || task?.id,
        project_id: formData.project_id || project?.id || project?.project_code || 'PRJ-SS-2025-01',
        project_name: formData.project_name || project?.project_name || 'Emergency Humanitarian Relief',
        project_code: formData.project_code || project?.project_code || 'PRJ-SS-2025-01',
        phone: formData.phone,
        state: formData.state,
        county: formData.county,
        payam: formData.payam,
        village: formData.village,
        urgency_level: formData.urgency_level,
        recommended_aid: formData.recommended_aid,
        ground_situation_report: formData.ground_situation_report,
        field_justification: formData.field_justification,
        audit_findings: formData.ground_situation_report,
        evidence_photos: evidencePhotos,
        evidence_documents: evidenceDocs,
        assessed_by: worker?.name || 'John Deng',
        worker_id: worker?.id || 'fw-1',
        field_worker_name: worker?.name || 'John Deng',
        field_worker_id: worker?.id || 'fw-1',
        supervisor_id: worker?.supervisor_id || task?.assigned_supervisor_id || 'sup-1',
        supervisor_name: worker?.supervisor_name || task?.assigned_supervisor_name || 'Emmanuel Adeyemi',
        assessment_date: new Date().toISOString(),
        
        // Post-Disbursement Truth & Verification Report Fields
        assignment_verified_true: isVerifiedTrue,
        verification_finding: verificationFinding,
        verification_finding_label: isVerifiedTrue ? 'Assignment Verified True on Ground' : (verificationFinding === 'DISCREPANCY_FOUND' ? 'Discrepancy Detected' : 'Beneficiary Ineligible / Relocated'),
        truth_certified_agreed: truthCertifiedAgreed,
        truth_statement: `I, ${worker?.name || 'Field Officer'}, certify under official humanitarian duty that I conducted an in-person field visit to ${formData.beneficiary_name} in ${formData.payam}. The assignment given concerning this beneficiary is ${isVerifiedTrue ? 'TRUE, genuine, and in acute need of aid' : 'FLAGGED with discrepancies'}.`,
        discrepancy_notes: isVerifiedTrue ? '' : discrepancyNotes,
        verification_checklist: checklist
      };

      if (onSubmitAssessment) {
        await onSubmitAssessment(payload);
      }

      toast?.showToast?.(`Assessment submitted: ${formData.beneficiary_name} confirmed ${isVerifiedTrue ? 'TRUE' : 'evaluated'}.`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      toast?.showToast?.('Failed to submit report. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, label: '1. Finding' },
    { id: 2, label: '2. Report' },
    { id: 3, label: '3. Evidence' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full h-[92vh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg md:max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* MOBILE TOP DRAG HANDLE / HEADER */}
        <div className="px-3.5 py-2.5 bg-gradient-to-r from-[#006B56] to-[#005544] text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <FileCheck className="w-3.5 h-3.5 text-emerald-100" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-black leading-tight truncate">
                  {isSubmittedMode ? 'Field Verification Dossier (Submitted)' : 'Field Verification Report'}
                </h2>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                  isSubmittedMode
                    ? 'bg-purple-300/30 border border-purple-200/50 text-purple-100'
                    : 'bg-emerald-400/25 border border-emerald-300/30 text-emerald-100'
                }`}>
                  {isSubmittedMode ? 'SUBMITTED' : `${currentStep}/3`}
                </span>
              </div>
              <p className="text-[10px] text-emerald-100/80 font-medium truncate">
                {formData.beneficiary_name ? `${formData.beneficiary_name} • ${formData.payam || 'Payam'}` : 'Verify authenticity & submit'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MOBILE STEP SWITCHER TABS */}
        <div className="bg-slate-100/80 border-b border-slate-200 p-1.5 shrink-0 flex items-center justify-between gap-1">
          {steps.map((s) => {
            const isActive = currentStep === s.id;
            const isDone = currentStep > s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(s.id)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition flex items-center justify-center gap-1 cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#006B56] text-white shadow-xs'
                    : isDone
                    ? 'bg-emerald-100/80 text-[#006B56]'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {isDone ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  <span className={`w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center font-black ${
                    isActive ? 'bg-white text-[#006B56]' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {s.id}
                  </span>
                )}
                <span className="truncate">{s.label.split(' ')[1]}</span>
              </button>
            );
          })}
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          
          {/* SUBMITTED BANNER WARNING */}
          {isSubmittedMode && (
            <div className="p-3 bg-purple-50/90 border border-purple-200/90 rounded-2xl flex items-start gap-2.5 text-xs text-purple-950 animate-in fade-in duration-150 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-purple-950">Audit Dossier Already Submitted</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900 border border-purple-300">
                    {existingAssessment?.assessment_code || 'FA-RECORDED'} • {existingAssessment?.status || 'Under Review'}
                  </span>
                </div>
                <p className="text-[11px] text-purple-900/90 leading-relaxed">
                  The on-ground field audit for <strong>{formData.beneficiary_name}</strong> was already filed on {existingAssessment?.date_conducted || 'record'}. You cannot submit a duplicate audit; you can view and review the submitted findings, verification, and evidence below.
                </p>
              </div>
            </div>
          )}

          {/* REJECTED / RETURNED CALLOUT BANNER */}
          {isRejectedCase && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-950 animate-in fade-in duration-150 shadow-2xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-rose-950">Audit Returned by Programme Manager</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                    Re-Audit Required
                  </span>
                </div>
                {Boolean(currentTaskObj?.rejection_reason || task?.rejection_reason) && (
                  <div className="text-[11px] text-rose-900 bg-white/80 p-2 rounded-lg border border-rose-200 font-medium">
                    <span className="text-[9px] uppercase font-bold text-rose-500 block mb-0.5">PM Rejection Reason</span>
                    "{currentTaskObj?.rejection_reason || task?.rejection_reason}"
                  </div>
                )}
                <p className="text-[10px] text-rose-800 font-medium">
                  Please review the requested corrections, verify the household findings on ground, and resubmit.
                </p>
              </div>
            </div>
          )}

          {/* ================= STEP 1: FINDING & BENEFICIARY ================= */}
          {currentStep === 1 && (
            <div className="space-y-3 animate-in fade-in duration-100 text-xs">
              {/* Task Selector */}
              <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-[#006B56] flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5" />
                    Assigned Case *
                  </label>
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                    {tasks.length} task{tasks.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={selectedTaskId}
                    onChange={handleTaskSelectionChange}
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-[11px] font-bold text-slate-900 focus:outline-none focus:border-[#006B56] appearance-none pr-7 cursor-pointer"
                  >
                    {tasks.length === 0 ? (
                      <option value="">No assigned tasks found (Fill below)</option>
                    ) : (
                      tasks.map(t => (
                        <option key={t.id || t.request_code} value={t.id || t.request_code}>
                          {t.beneficiary_name} • {t.request_code || 'REQ'}
                        </option>
                      ))
                    )}
                    <option value="custom">✍️ Manual Walk-in Entry</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* On-Ground Finding 3-Choice Radio Cards */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#006B56]" />
                    Verification Finding *
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Select on-ground outcome</span>
                </label>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    disabled={isSubmittedMode}
                    onClick={() => !isSubmittedMode && setVerificationFinding('VERIFIED_TRUE')}
                    className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${isSubmittedMode ? 'cursor-default' : 'cursor-pointer'} ${
                      verificationFinding === 'VERIFIED_TRUE'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-black'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold opacity-60'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 mb-0.5 ${verificationFinding === 'VERIFIED_TRUE' ? 'text-[#006B56]' : 'text-slate-300'}`} />
                    <span className="text-[10px] leading-tight">Verified True</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmittedMode}
                    onClick={() => !isSubmittedMode && setVerificationFinding('DISCREPANCY_FOUND')}
                    className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${isSubmittedMode ? 'cursor-default' : 'cursor-pointer'} ${
                      verificationFinding === 'DISCREPANCY_FOUND'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-black'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold opacity-60'
                    }`}
                  >
                    <AlertCircle className={`w-4 h-4 mb-0.5 ${verificationFinding === 'DISCREPANCY_FOUND' ? 'text-amber-600' : 'text-slate-300'}`} />
                    <span className="text-[10px] leading-tight">Discrepancy</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmittedMode}
                    onClick={() => !isSubmittedMode && setVerificationFinding('INELIGIBLE_OR_RELOCATED')}
                    className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${isSubmittedMode ? 'cursor-default' : 'cursor-pointer'} ${
                      verificationFinding === 'INELIGIBLE_OR_RELOCATED'
                        ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-950 font-black'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold opacity-60'
                    }`}
                  >
                    <X className={`w-4 h-4 mb-0.5 ${verificationFinding === 'INELIGIBLE_OR_RELOCATED' ? 'text-rose-600' : 'text-slate-300'}`} />
                    <span className="text-[10px] leading-tight">Not Eligible</span>
                  </button>
                </div>

                {verificationFinding !== 'VERIFIED_TRUE' && (
                  <div className="pt-1">
                    <textarea
                      required
                      readOnly={isSubmittedMode}
                      rows={2}
                      value={discrepancyNotes}
                      onChange={(e) => setDiscrepancyNotes(e.target.value)}
                      placeholder="Explain reason for discrepancy or ineligibility observed on ground..."
                      className={`w-full p-2 bg-white border border-amber-300 rounded-lg text-[11px] font-medium text-slate-900 focus:outline-none focus:border-amber-500 resize-none ${
                        isSubmittedMode ? 'bg-slate-50 cursor-default' : ''
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Beneficiary Details Form */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3 text-[#006B56]" />
                    Beneficiary & Location
                  </span>
                  <span className="text-[9px] font-bold text-[#006B56] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                    {formData.payam || 'Payam'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Beneficiary Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      readOnly={isSubmittedMode}
                      value={formData.beneficiary_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, beneficiary_name: e.target.value }))}
                      placeholder="Full Name"
                      className={`w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-[#006B56] ${
                        isSubmittedMode ? 'bg-slate-100 text-slate-800 cursor-default' : ''
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                        Case / Request Code
                      </label>
                      <input
                        type="text"
                        readOnly={isSubmittedMode}
                        value={formData.request_code}
                        onChange={(e) => setFormData(prev => ({ ...prev, request_code: e.target.value }))}
                        placeholder="ADR-REQ-..."
                        className={`w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-900 focus:outline-none focus:border-[#006B56] ${
                          isSubmittedMode ? 'bg-slate-100 text-slate-800 cursor-default' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                        Urgency Level
                      </label>
                      <select
                        disabled={isSubmittedMode}
                        value={formData.urgency_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, urgency_level: e.target.value }))}
                        className={`w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-800 focus:outline-none focus:border-[#006B56] ${
                          isSubmittedMode ? 'bg-slate-100 cursor-default' : ''
                        }`}
                      >
                        <option value="Critical Emergency">🚨 Critical Emergency</option>
                        <option value="High Priority">⚠️ High Priority</option>
                        <option value="Moderate">🟡 Moderate</option>
                        <option value="Routine">🟢 Routine</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Recommended Aid Package
                    </label>
                    <input
                      type="text"
                      readOnly={isSubmittedMode}
                      value={formData.recommended_aid}
                      onChange={(e) => setFormData(prev => ({ ...prev, recommended_aid: e.target.value }))}
                      placeholder="e.g. Food & WASH Kit"
                      className={`w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#006B56] ${
                        isSubmittedMode ? 'bg-slate-100 text-slate-800 cursor-default' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: REPORT & JUSTIFICATION ================= */}
          {currentStep === 2 && (
            <div className="space-y-3 animate-in fade-in duration-100 text-xs">
              {/* Situation Findings */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-[#006B56]" />
                    Ground Situation & Vulnerability *
                  </span>
                </label>
                <textarea
                  required
                  readOnly={isSubmittedMode}
                  rows={3}
                  value={formData.ground_situation_report}
                  onChange={(e) => setFormData(prev => ({ ...prev, ground_situation_report: e.target.value }))}
                  placeholder="State living conditions, shelter state, hunger level observed..."
                  className={`w-full p-2.5 bg-white border border-slate-300 rounded-xl text-[11px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B56] resize-none leading-relaxed ${
                    isSubmittedMode ? 'bg-slate-50 cursor-default text-slate-800' : ''
                  }`}
                />
              </div>

              {/* Justification for superiors */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-900 flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-[#006B56]" />
                  Officer Justification to Superiors *
                </label>
                <textarea
                  required
                  readOnly={isSubmittedMode}
                  rows={3}
                  value={formData.field_justification}
                  onChange={(e) => setFormData(prev => ({ ...prev, field_justification: e.target.value }))}
                  placeholder="Explain why immediate relief approval & dispatch is essential..."
                  className={`w-full p-2.5 bg-white border border-slate-300 rounded-xl text-[11px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B56] resize-none leading-relaxed ${
                    isSubmittedMode ? 'bg-slate-50 cursor-default text-slate-800' : ''
                  }`}
                />
              </div>

              {/* Verification Checklist (Vertical with Larger Checkbox) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Field Protocol Checklist
                </span>
                <div className="flex flex-col space-y-2">
                  <button
                    type="button"
                    disabled={isSubmittedMode}
                    onClick={() => !isSubmittedMode && toggleChecklistItem('visitedInPerson')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                      isSubmittedMode ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      checklist.visitedInPerson
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {checklist.visitedInPerson ? (
                        <CheckSquare className="w-5 h-5 text-[#006B56] shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                      <span className="text-xs font-bold truncate">In-Person Physical Visit</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-[#006B56] shrink-0 ml-2">
                      {checklist.visitedInPerson ? '✓ Confirmed' : 'Tap to confirm'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmittedMode}
                    onClick={() => !isSubmittedMode && toggleChecklistItem('idHeadVerified')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                      isSubmittedMode ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      checklist.idHeadVerified
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {checklist.idHeadVerified ? (
                        <CheckSquare className="w-5 h-5 text-[#006B56] shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                      <span className="text-xs font-bold truncate">ID & Head of Household Verified</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-[#006B56] shrink-0 ml-2">
                      {checklist.idHeadVerified ? '✓ Confirmed' : 'Tap to confirm'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmittedMode}
                    onClick={() => !isSubmittedMode && toggleChecklistItem('vulnerabilityConfirmed')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                      isSubmittedMode ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      checklist.vulnerabilityConfirmed
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {checklist.vulnerabilityConfirmed ? (
                        <CheckSquare className="w-5 h-5 text-[#006B56] shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                      <span className="text-xs font-bold truncate">Acute Vulnerability & Need Confirmed</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-[#006B56] shrink-0 ml-2">
                      {checklist.vulnerabilityConfirmed ? '✓ Confirmed' : 'Tap to confirm'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: EVIDENCE & OATH ================= */}
          {currentStep === 3 && (
            <div className="space-y-3 animate-in fade-in duration-100 text-xs">
              {/* Photo Evidence Gallery */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-900 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-[#006B56]" />
                    Photos ({evidencePhotos.length})
                  </label>
                  {!isSubmittedMode && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-[#006B56] hover:bg-emerald-200 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Add Photo
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                {evidencePhotos.length === 0 ? (
                  <div
                    onClick={() => !isSubmittedMode && fileInputRef.current?.click()}
                    className={`p-3 text-center rounded-xl border border-dashed border-slate-300 bg-white ${
                      isSubmittedMode ? 'cursor-default' : 'hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <Camera className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                    <p className="text-[10px] text-slate-500 font-medium">
                      {isSubmittedMode ? 'No photo evidence was attached to this audit.' : 'Tap to upload field photos from camera or gallery'}
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {evidencePhotos.map(photo => (
                      <div key={photo.id} className="relative group shrink-0 w-24 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-200 shadow-2xs">
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition duration-150"
                          onClick={() => photo.url && window.open(photo.url, '_blank')}
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1 pointer-events-none">
                          <span className="text-[8px] text-white font-bold block truncate">{photo.name}</span>
                        </div>
                        {!isSubmittedMode && (
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="absolute top-0.5 right-0.5 p-0.5 rounded-md bg-rose-600/90 text-white hover:bg-rose-700 transition cursor-pointer shadow-xs"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {!isSubmittedMode && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-white cursor-pointer transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-[8px] font-bold">Add</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Document Attachments */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-900 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#006B56]" />
                    Attached Docs ({evidenceDocs.length})
                  </label>
                  {!isSubmittedMode && (
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 hover:bg-blue-200 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Attach Doc
                    </button>
                  )}
                  <input
                    ref={docInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.txt"
                    multiple
                    onChange={handleDocUpload}
                    className="hidden"
                  />
                </div>

                {evidenceDocs.length === 0 ? (
                  <div
                    onClick={() => !isSubmittedMode && docInputRef.current?.click()}
                    className={`p-3 text-center rounded-xl border border-dashed border-slate-300 bg-white ${
                      isSubmittedMode ? 'cursor-default' : 'hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <FileText className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                    <p className="text-[10px] text-slate-500 font-medium">
                      {isSubmittedMode ? 'No verification documents attached to this audit.' : 'Tap to attach recommendation letters, National ID copies, or PDFs'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[100px] overflow-y-auto">
                    {evidenceDocs.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200 text-[10px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 truncate block max-w-[190px]">{doc.name}</span>
                            <span className="text-[9px] text-slate-400">{doc.size || 'Document'} • {doc.date || 'Attached'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {doc.url && (
                            <a
                              href={doc.url}
                              download={doc.name}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[9px] transition"
                            >
                              View
                            </a>
                          )}
                          {!isSubmittedMode && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc(doc.id)}
                              className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sworn Officer Oath */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="truthCert"
                    disabled={isSubmittedMode}
                    checked={truthCertifiedAgreed}
                    onChange={(e) => setTruthCertifiedAgreed(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded-md text-[#006B56] focus:ring-[#006B56] cursor-pointer shrink-0 accent-[#006B56]"
                  />
                  <label htmlFor="truthCert" className={`text-xs font-black text-emerald-950 leading-tight ${isSubmittedMode ? 'cursor-default' : 'cursor-pointer'} select-none`}>
                    Field Officer Sworn Declaration of Truth *
                  </label>
                </div>
                
                <p className="text-[10px] text-emerald-900 leading-normal pl-6 italic bg-white/70 p-2 rounded-lg border border-emerald-200/70">
                  "I, <strong>{worker?.name || 'Field Officer'}</strong>, certify that I conducted an in-person visit to <strong>{formData.beneficiary_name || 'beneficiary'}</strong> at <strong>{formData.payam || 'payam'}</strong>. The assignment is <strong>{verificationFinding === 'VERIFIED_TRUE' ? 'TRUE' : 'evaluated as reported'}</strong>."
                </p>

                <div className="pl-6 flex flex-wrap items-center gap-x-2 text-[9px] text-emerald-800 font-bold">
                  <span className="flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5 text-[#006B56]" />
                    In-Person Visit
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5 text-[#006B56]" />
                    Conditions & Need Verified
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MOBILE STICKY BOTTOM CONTROLS */}
        <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            {isSubmittedMode ? 'Close' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-4 py-1.5 rounded-xl text-xs font-black bg-[#006B56] hover:bg-[#005544] text-white shadow-xs transition flex items-center gap-1 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : isSubmittedMode ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 text-purple-900 border border-purple-300 text-xs font-black">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
                  <span>Audit Submitted (Verified)</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-xl text-xs font-black bg-[#006B56] hover:bg-[#005544] text-white shadow-xs transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !truthCertifiedAgreed}
                className="px-4 py-1.5 rounded-xl text-xs font-black bg-[#006B56] hover:bg-[#005544] text-white shadow-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default FieldAssessmentFormModal;
