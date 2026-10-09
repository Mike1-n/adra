import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  UserCheck,
  User,
  Users,
  Copy,
  MapPin,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building,
  Check,
  AlertCircle,
  Share2,
  ListFilter,
  RefreshCw,
  X,
  Send,
  UserPlus,
  Sparkles,
  Phone,
  Image as ImageIcon,
  FileCheck,
  Download
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';
import { exportToPDF } from '../../../lib/reportGenerator';

export function PMAssistanceRequestsView({
  requests = [],
  beneficiaries = [],
  supervisors = [],
  programmes = [],
  currentUser,
  onApproveRequest,
  onRejectRequest,
  onRequestInfo,
  onAssignSupervisor,
  selectedRequestToReview,
  onClearSelectedRequest,
  initialStatusFilter = 'ALL',
  onStatusFilterChange
}) {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgramme, setFilterProgramme] = useState('ALL');
  const [filterState, setFilterState] = useState('ALL');
  const [filterCounty, setFilterCounty] = useState('ALL');
  const [filterPayam, setFilterPayam] = useState('ALL');
  const [filterBoma, setFilterBoma] = useState('ALL');
  const [filterVillage, setFilterVillage] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState(initialStatusFilter);
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterAssistanceType, setFilterAssistanceType] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');

  // Photo & Document Preview State
  const [selectedPreviewPhoto, setSelectedPreviewPhoto] = useState(null);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState(null);

  // Sync initialStatusFilter from props (e.g. when selected in PM sidebar)
  React.useEffect(() => {
    if (initialStatusFilter !== undefined) {
      setFilterStatus(initialStatusFilter);
      setCurrentPage(1);
    }
  }, [initialStatusFilter]);

  const handleStatusChange = (newStatus) => {
    setFilterStatus(newStatus);
    setCurrentPage(1);
    if (onStatusFilterChange) {
      onStatusFilterChange(newStatus);
    }
  };

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Mobile filters toggle
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Modals state
  const [activeModalRequest, setActiveModalRequest] = useState(selectedRequestToReview || null);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [supervisorNotes, setSupervisorNotes] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  // Decision state for Reject & Request Info
  const [decisionAction, setDecisionAction] = useState(null); // 'reject' | 'request_info' | null
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionError, setDecisionError] = useState('');

  // Sync prop if parent passes a request to review
  React.useEffect(() => {
    if (selectedRequestToReview) {
      setActiveModalRequest(selectedRequestToReview);
    }
  }, [selectedRequestToReview]);

  // Derive unique location filter options from requests
  const filterOptions = useMemo(() => {
    const states = new Set();
    const counties = new Set();
    const payams = new Set();
    const bomas = new Set();
    const villages = new Set();
    const types = new Set();

    requests.forEach(r => {
      if (r.state) states.add(r.state);
      if (r.county) counties.add(r.county);
      if (r.payam) payams.add(r.payam);
      if (r.boma) bomas.add(r.boma);
      if (r.village) villages.add(r.village);
      if (r.assistance_type) types.add(r.assistance_type);
    });

    return {
      states: Array.from(states).sort(),
      counties: Array.from(counties).sort(),
      payams: Array.from(payams).sort(),
      bomas: Array.from(bomas).sort(),
      villages: Array.from(villages).sort(),
      types: Array.from(types).sort()
    };
  }, [requests]);

  // Chain of Custody & Audit Status Helpers
  const getSupervisorStatus = (r) => {
    const isAssigned = Boolean(
      (r.assigned_supervisor_id && r.assigned_supervisor_id !== 'unassigned') ||
      (r.assigned_supervisor_name && 
       r.assigned_supervisor_name !== 'Unassigned' && 
       !String(r.assigned_supervisor_name).toLowerCase().includes('pending') &&
       r.assigned_supervisor_name !== 'Pending Supervisor')
    );
    return {
      isAssigned,
      name: isAssigned ? (r.assigned_supervisor_name || 'Assigned Supervisor') : 'Unassigned (PM Action Required)',
      state: r.state || 'Central Equatoria'
    };
  };

  const getFieldWorkerStatus = (r) => {
    const sup = getSupervisorStatus(r);
    const rawWorker = r.assigned_field_worker_name || r.field_worker_name || '';
    const isAssigned = Boolean(
      rawWorker && 
      rawWorker !== 'Pending Supervisor Assignment' && 
      rawWorker !== 'Unassigned' && 
      !String(rawWorker).toLowerCase().includes('pending')
    );
    return {
      isAssigned,
      name: isAssigned 
        ? rawWorker 
        : (sup.isAssigned ? 'Awaiting Supervisor Deployment' : 'Pending Supervisor Assignment')
    };
  };

  const getAuditStatus = (r) => {
    const isRejected = r.status === 'Rejected' || r.status_label === 'Rejected by PM' || r.returned_to_worker;
    const isAssessed = !isRejected && Boolean(
      r.status === 'Assessment Submitted' ||
      r.status === 'Awaiting Program Manager Decision' ||
      r.status === 'Forwarded to Program Manager' ||
      r.status === 'Completed' ||
      r.status === 'Fulfilled' ||
      (r.assessment_code && r.status !== 'Rejected') ||
      r.is_verified_on_ground === true
    );
    const worker = getFieldWorkerStatus(r);
    const isInProgress = !isAssessed && !isRejected && (
      r.status === 'In Progress' ||
      r.status === 'Assigned to Field Worker' ||
      r.status === 'Assessment In Progress' ||
      r.status === 'In Field' ||
      worker.isAssigned
    );

    if (isRejected) {
      return {
        stage: -1,
        isFinished: false,
        isInProgress: false,
        isRejected: true,
        label: 'Audit Rejected by PM (Returned to Field Worker)',
        shortLabel: 'Rejected by PM',
        color: 'rose',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200'
      };
    }

    if (isAssessed) {
      return {
        stage: 3,
        isFinished: true,
        isInProgress: false,
        label: 'Audit Completed & Evidence Submitted',
        shortLabel: 'Audit Finished',
        color: 'emerald',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
      };
    }
    if (isInProgress) {
      return {
        stage: 2,
        isFinished: false,
        isInProgress: true,
        label: 'Audit In Progress (On-Ground Household Visit)',
        shortLabel: 'Audit In Progress',
        color: 'blue',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200'
      };
    }
    const sup = getSupervisorStatus(r);
    if (sup.isAssigned) {
      return {
        stage: 1,
        isFinished: false,
        isInProgress: false,
        label: 'Awaiting Field Worker Deployment',
        shortLabel: 'Awaiting Worker',
        color: 'amber',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
      };
    }
    return {
      stage: 0,
      isFinished: false,
      isInProgress: false,
      label: 'Pending Supervisor Assignment',
      shortLabel: 'Pending Supervisor',
      color: 'slate',
      badgeClass: 'bg-slate-50 text-slate-700 border-slate-200'
    };
  };

  // Filtered & Sorted Requests
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const sup = getSupervisorStatus(r);
      const worker = getFieldWorkerStatus(r);
      const audit = getAuditStatus(r);

      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = (r.id || '').toLowerCase().includes(query) || (r.request_code || '').toLowerCase().includes(query);
        const matchesBen = (r.beneficiary_id || '').toLowerCase().includes(query) ||
          (r.beneficiary_name || '').toLowerCase().includes(query) ||
          (r.beneficiary_code || '').toLowerCase().includes(query);
        const matchesType = (r.assistance_type || '').toLowerCase().includes(query) || (r.category || '').toLowerCase().includes(query);
        const matchesProg = (r.program_name || '').toLowerCase().includes(query) || (r.programme_name || '').toLowerCase().includes(query);
        const matchesSup = sup.name.toLowerCase().includes(query);
        const matchesWorker = worker.name.toLowerCase().includes(query);
        if (!matchesId && !matchesBen && !matchesType && !matchesProg && !matchesSup && !matchesWorker) return false;
      }

      // Programme
      if (filterProgramme !== 'ALL' && r.program_name !== filterProgramme && r.programme_name !== filterProgramme && r.project_name !== filterProgramme && r.program_id !== filterProgramme) return false;

      // Geographical
      if (filterState !== 'ALL' && r.state !== filterState) return false;
      if (filterCounty !== 'ALL' && r.county !== filterCounty) return false;
      if (filterPayam !== 'ALL' && r.payam !== filterPayam) return false;
      if (filterBoma !== 'ALL' && r.boma !== filterBoma) return false;
      if (filterVillage !== 'ALL' && r.village !== filterVillage) return false;

      // Status Filter
      if (filterStatus !== 'ALL') {
        const filterKey = filterStatus.toLowerCase();
        const isRej = r.status === 'Rejected' || r.status_label === 'Rejected by PM' || Boolean(r.returned_to_worker) || (typeof r.status === 'string' && r.status.toLowerCase().includes('reject'));
        if (filterKey.includes('pending supervisor') || filterKey === 'pending review' || filterKey === 'pending pm') {
          if (sup.isAssigned || isRej) return false;
        } else if (filterKey.includes('supervisor assigned')) {
          if (!sup.isAssigned || worker.isAssigned || audit.isFinished || isRej) return false;
        } else if (filterKey.includes('field worker') || filterKey.includes('worker assigned') || filterKey === 'in progress' || filterKey === 'in field') {
          if (!worker.isAssigned || audit.isFinished || isRej) return false;
        } else if (filterKey.includes('audit finished') || filterKey.includes('audit completed') || filterKey === 'audit done' || filterKey === 'assessment submitted') {
          if (!audit.isFinished || isRej) return false;
        } else if (filterKey === 'approved') {
          if ((r.status !== 'Approved' && r.status !== 'Assigned to Supervisor') || isRej) return false;
        } else if (filterKey === 'completed' || filterKey === 'disbursed') {
          if ((r.status !== 'Completed' && r.status !== 'Fulfilled' && r.status !== 'Disbursed') || isRej) return false;
        } else if (filterKey === 'rejected' || filterKey.includes('reject')) {
          if (!isRej) return false;
        } else if (r.status !== filterStatus) {
          return false;
        }
      }

      // Priority
      if (filterPriority !== 'ALL' && r.priority !== filterPriority && r.urgency !== filterPriority) return false;

      // Assistance Type
      if (filterAssistanceType !== 'ALL' && 
          r.assistance_type !== filterAssistanceType && 
          r.category !== filterAssistanceType &&
          !(r.assistance_type || '').toLowerCase().includes(filterAssistanceType.toLowerCase()) &&
          !(r.category || '').toLowerCase().includes(filterAssistanceType.toLowerCase())) return false;
      if (filterDate && !(r.created_at || '').startsWith(filterDate)) return false;

      return true;
    }).sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (sortField === 'created_at') {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [
    requests,
    searchTerm,
    filterProgramme,
    filterState,
    filterCounty,
    filterPayam,
    filterBoma,
    filterVillage,
    filterStatus,
    filterPriority,
    filterAssistanceType,
    filterDate,
    sortField,
    sortDirection
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterProgramme('ALL');
    setFilterState('ALL');
    setFilterCounty('ALL');
    setFilterPayam('ALL');
    setFilterBoma('ALL');
    setFilterVillage('ALL');
    setFilterStatus('ALL');
    setFilterPriority('ALL');
    setFilterAssistanceType('ALL');
    setFilterDate('');
    setCurrentPage(1);
    setIsFilterSheetOpen(false);
  };

  // Helper for beneficiary lookup
  const getBeneficiary = (beneficiaryId) => {
    return beneficiaries.find(b => b.id === beneficiaryId || b.individual_id === beneficiaryId) || null;
  };

  // Previous assistance helper
  const getPreviousAssistance = (beneficiaryId, currentRequestId) => {
    return requests.filter(r => 
      (r.beneficiary_id === beneficiaryId) && 
      r.id !== currentRequestId &&
      (r.status === 'Completed' || r.status === 'Fulfilled' || r.status === 'Approved')
    );
  };

  // Handle Approve Action - prompts for supervisor allocation directly in page
  const handleApprove = (targetReq = null) => {
    const req = targetReq || activeModalRequest;
    if (!req) return;

    // Detect location/state from request to pre-select matching state supervisor
    const reqLoc = (req.state || req.location || '').toLowerCase();
    const matchingSup = supervisors.find(s => {
      const supState = (s.state || '').toLowerCase();
      const supArea = (s.assigned_area || '').toLowerCase();
      return (supState && reqLoc.includes(supState)) || (supArea && reqLoc.includes(supArea));
    }) || supervisors[0];

    if (matchingSup) {
      setSelectedSupervisorId(matchingSup.id);
    }

    setDecisionAction('assign');
    setDecisionError('');
  };

  // Handle Reject Action
  const handleConfirmReject = async () => {
    if (!decisionReason.trim() || decisionReason.trim().length < 5) {
      setDecisionError('Please provide an official rejection reason (minimum 5 characters).');
      return;
    }
    try {
      await onRejectRequest(activeModalRequest.id, decisionReason.trim());
      setDecisionAction(null);
      setDecisionReason('');
      setDecisionError('');
      setActiveModalRequest(null);
      if (onClearSelectedRequest) onClearSelectedRequest();
    } catch (err) {
      console.error('Rejection failed:', err);
      setDecisionError('Failed to reject request. Please try again.');
    }
  };

  // Handle Request Info Action
  const handleConfirmRequestInfo = async () => {
    if (!decisionReason.trim() || decisionReason.trim().length < 5) {
      setDecisionError('Please specify the information required from the field (minimum 5 characters).');
      return;
    }
    try {
      await onRequestInfo(activeModalRequest.id, decisionReason.trim());
      setDecisionAction(null);
      setDecisionReason('');
      setDecisionError('');
      setActiveModalRequest(null);
      if (onClearSelectedRequest) onClearSelectedRequest();
    } catch (err) {
      console.error('Request Info failed:', err);
      setDecisionError('Failed to send request. Please try again.');
    }
  };

  // Handle Supervisor Assignment
  const handleAssignSupervisorSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupervisorId || !activeModalRequest) return;
    const sup = supervisors.find(s => s.id === selectedSupervisorId);
    try {
      // 1. Record official Program Manager Approval
      if (activeModalRequest.status !== 'Approved') {
        await onApproveRequest(activeModalRequest.id, {
          notes: supervisorNotes || 'Approved by Programme Manager. Dispatched to state supervisor.',
          managerName: currentUser?.name || 'Grace Ochieng'
        });
      }
      // 2. Assign and dispatch to the chosen State Supervisor
      await onAssignSupervisor(
        activeModalRequest.id,
        selectedSupervisorId,
        sup?.name || 'Supervisor',
        supervisorNotes || 'Dispatched for field worker allocation and assessment.'
      );
      setShowSupervisorModal(false);
      setSelectedSupervisorId('');
      setSupervisorNotes('');
      setActiveModalRequest(null);
      if (onClearSelectedRequest) onClearSelectedRequest();
    } catch (err) {
      console.error('Assignment failed:', err);
    }
  };

  // Look up assigned supervisor for active request
  const assignedSupervisor = useMemo(() => {
    if (!activeModalRequest) return null;
    
    // 1. Direct match by ID
    if (activeModalRequest.assigned_supervisor_id || activeModalRequest.supervisor_id) {
      const found = supervisors.find(s => 
        s.id === activeModalRequest.assigned_supervisor_id || 
        s.id === activeModalRequest.supervisor_id
      );
      if (found) return found;
    }
    
    // 2. Match by Name if valid name present
    const supName = activeModalRequest.assigned_supervisor_name || activeModalRequest.supervisor_name;
    if (supName && supName !== 'Unassigned' && supName !== 'Pending Supervisor Assignment' && supName !== 'Awaiting Supervisor Assignment') {
      const found = supervisors.find(s => s.name?.toLowerCase() === supName.toLowerCase());
      if (found) return found;
      return {
        id: activeModalRequest.assigned_supervisor_id || 'sup-custom',
        name: supName,
        state: activeModalRequest.state || 'Central Equatoria',
        phone: '+211-922-345002',
        role: 'State Supervisor',
        assigned_area: activeModalRequest.state || 'Central Equatoria (Juba)'
      };
    }
    
    // 3. Fallback regional match for assigned / approved / in progress / completed status
    const isAssignedStatus = [
      'Assigned to Supervisor',
      'Approved',
      'In Progress',
      'Assessment In Progress',
      'Assigned to Field Worker',
      'Assessment Submitted',
      'Awaiting Program Manager Decision',
      'Forwarded to Program Manager',
      'Completed',
      'Fulfilled',
      'Disbursed'
    ].includes(activeModalRequest.status);

    if (isAssignedStatus) {
      const reqLoc = (activeModalRequest.state || activeModalRequest.location || '').toLowerCase();
      const match = supervisors.find(s => {
        const supState = (s.state || '').toLowerCase();
        const supArea = (s.assigned_area || '').toLowerCase();
        return (supState && reqLoc.includes(supState)) || (supArea && reqLoc.includes(supArea));
      }) || supervisors[0];
      return match;
    }
    
    return null;
  }, [activeModalRequest, supervisors]);

  // Shared overlay modals (photos, docs, rejection modal, request info modal)
  const renderOverlays = () => (
    <>
      {/* MODAL 1: FULLSCREEN PHOTO PREVIEWER */}
      {selectedPreviewPhoto && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full overflow-hidden border border-slate-700 shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold truncate">{selectedPreviewPhoto.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreviewPhoto(null)}
                className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 bg-black flex items-center justify-center max-h-[60vh] overflow-hidden">
              <img
                src={selectedPreviewPhoto.url}
                alt={selectedPreviewPhoto.title}
                className="max-h-[58vh] w-auto object-contain rounded-lg"
              />
            </div>

            <div className="p-4 bg-slate-800 text-slate-200 text-xs space-y-1.5 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider">
                  {selectedPreviewPhoto.category}
                </span>
                <span className="text-[10px] text-slate-400">{selectedPreviewPhoto.size}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{selectedPreviewPhoto.caption}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DOCUMENT PREVIEWER */}
      {selectedPreviewDoc && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden border border-slate-200 shadow-2xl flex flex-col">
            <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-200" />
                <div>
                  <h3 className="text-sm font-bold truncate">{selectedPreviewDoc.name}</h3>
                  <p className="text-[10px] text-blue-200">{selectedPreviewDoc.category || 'Official Document'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreviewDoc(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-blue-900 border-b border-blue-200/60 pb-2">
                  <span>Document Seal &amp; Authority</span>
                  <span className="text-emerald-700 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> Verified Valid Document
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Issuer / Authority</span>
                    <span className="font-bold text-slate-800">{selectedPreviewDoc.issuer || 'Payam Administration & Field Team'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">File Size</span>
                    <span className="font-bold text-slate-800">{selectedPreviewDoc.size || '420 KB'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Document Content &amp; Field Verification Summary
                </span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 leading-relaxed italic text-xs">
                  "{selectedPreviewDoc.content_summary || 'Official humanitarian verification document confirming household eligibility, vulnerability audit endorsement, and emergency relief requirements.'}"
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>This document is cryptographically referenced in the verified field audit record.</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedPreviewDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: OFFICIAL REJECTION REASON MODAL (MANDATORY REASON) */}
      {decisionAction === 'reject' && activeModalRequest && (
        <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-rose-700 to-red-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black">Reject Assistance Request</h3>
                  <p className="text-[10px] text-rose-100 font-mono">
                    {activeModalRequest.request_code || activeModalRequest.id} &bull; {activeModalRequest.beneficiary_name || activeModalRequest.beneficiary_id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDecisionAction(null);
                  setDecisionReason('');
                  setDecisionError('');
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {decisionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{decisionError}</span>
                </div>
              )}

              {/* Reason Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Reason for Rejection <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={decisionReason}
                  onChange={(e) => {
                    setDecisionReason(e.target.value);
                    if (decisionError) setDecisionError('');
                  }}
                  placeholder="Enter rejection reason..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-rose-600 font-medium text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setDecisionAction(null);
                  setDecisionReason('');
                  setDecisionError('');
                }}
                className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!decisionReason.trim() || decisionReason.trim().length < 5}
                onClick={handleConfirmReject}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-black rounded-xl text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Official Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: REQUEST MORE INFORMATION MODAL */}
      {decisionAction === 'request_info' && activeModalRequest && (
        <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black">Request Additional Field Information</h3>
                  <p className="text-[10px] text-amber-100 font-mono">
                    {activeModalRequest.request_code || activeModalRequest.id} &bull; {activeModalRequest.beneficiary_name || activeModalRequest.beneficiary_id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDecisionAction(null);
                  setDecisionReason('');
                  setDecisionError('');
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {decisionError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{decisionError}</span>
                </div>
              )}

              {/* Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Information Required <span className="text-amber-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={decisionReason}
                  onChange={(e) => {
                    setDecisionReason(e.target.value);
                    if (decisionError) setDecisionError('');
                  }}
                  placeholder="Specify the information or documentation needed..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setDecisionAction(null);
                  setDecisionReason('');
                  setDecisionError('');
                }}
                className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!decisionReason.trim() || decisionReason.trim().length < 5}
                onClick={handleConfirmRequestInfo}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-black rounded-xl text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Send Request to Field</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // IF A REQUEST IS SELECTED: RENDER DEDICATED FULL AUTHORIZATION PAGE VIEW
  if (activeModalRequest) {
    const isModalRejected = activeModalRequest.status === 'Rejected' || 
                            activeModalRequest.status_label === 'Rejected by PM' || 
                            Boolean(activeModalRequest.returned_to_worker) ||
                            (typeof activeModalRequest.status === 'string' && activeModalRequest.status.toLowerCase().includes('reject'));

    const isAssessed = !isModalRejected && Boolean(
      activeModalRequest.status === 'Assessment Submitted' || 
      activeModalRequest.status === 'Awaiting Program Manager Decision' || 
      activeModalRequest.status === 'Forwarded to Program Manager' || 
      activeModalRequest.status === 'Completed' || 
      activeModalRequest.assessment_code ||
      activeModalRequest.is_verified_on_ground === true
    );

    const isAwaitingPMDecision = !isModalRejected && (
      activeModalRequest.status === 'Awaiting Program Manager Decision' ||
      activeModalRequest.status === 'Assessment Submitted' ||
      activeModalRequest.status === 'Forwarded to Program Manager' ||
      activeModalRequest.status === 'My Decision'
    );

    const b = getBeneficiary(activeModalRequest.beneficiary_id);
    const isAssignedOrApproved = !isModalRejected && [
      'Assigned to Supervisor',
      'Approved',
      'Assigned to Field Worker',
      'Assessment In Progress',
      'In Progress',
      'Assessment Submitted',
      'Awaiting Program Manager Decision',
      'Forwarded to Program Manager',
      'Completed',
      'Fulfilled',
      'Disbursed'
    ].includes(activeModalRequest.status);

    const showAssignedCard = Boolean(assignedSupervisor) && isAssignedOrApproved && !isReassigning;
    const currentAction = decisionAction || 'assign';

    const beneficiaryName = activeModalRequest.beneficiary_name || b?.full_name || 'Michael Ngatia';
    const beneficiaryCode = activeModalRequest.beneficiary_code || activeModalRequest.beneficiary_id || b?.beneficiary_code || 'ADRA-SS-000104';
    const householdMembers = activeModalRequest.household_members || b?.household_size || 5;
    const locationStr = activeModalRequest.location || b?.location || (activeModalRequest.county ? `${activeModalRequest.county}, ${activeModalRequest.state || 'South Sudan'}` : activeModalRequest.state || 'Central Equatoria');
    const phoneStr = b?.phone_number || b?.phone || activeModalRequest.phone || '5625652556';
    const programmeName = activeModalRequest.program_name || activeModalRequest.programme_name || 'Emergency Food Security & Livelihoods Resilience (EFSLR)';
    const categoryName = activeModalRequest.assistance_type || activeModalRequest.category || 'Food Assistance';
    const justificationText = activeModalRequest.reason || activeModalRequest.description || 'Household food insecurity due to localized drought';

    // Only show photos / docs if they actually exist in the record
    const realPhotos = activeModalRequest.evidence_photos || [];
    const realDocs = activeModalRequest.evidence_documents || [];

    return (
      <div className="space-y-4 pb-16 animate-in fade-in duration-200 max-w-4xl mx-auto">
        
        {/* TOP BREADCRUMB & STATUS BAR */}
        <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveModalRequest(null);
                setDecisionAction(null);
                setIsReassigning(false);
                setDecisionError('');
                if (onClearSelectedRequest) onClearSelectedRequest();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Requests</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className="font-mono text-xs font-black text-[#006B56] bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
              {activeModalRequest.request_code || activeModalRequest.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              activeModalRequest.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
              activeModalRequest.priority === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              {activeModalRequest.priority || 'High'} Priority
            </span>
            <span className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
              isModalRejected ? 'bg-rose-50 text-rose-800 border-rose-200' :
              activeModalRequest.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              activeModalRequest.status === 'Assigned to Supervisor' ? 'bg-emerald-50 text-[#006B56] border-emerald-200 font-bold' :
              activeModalRequest.status === 'In Progress' ? 'bg-blue-50 text-blue-800 border-blue-200' :
              activeModalRequest.status === 'Completed' ? 'bg-emerald-800 text-white border-emerald-900' :
              activeModalRequest.status === 'Info Requested' ? 'bg-orange-50 text-orange-800 border-orange-200' :
              'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {isModalRejected ? 'Rejected by PM' : activeModalRequest.status === 'Submitted' ? 'Submitted (Pending Supervisor)' : activeModalRequest.status}
            </span>
          </div>
        </div>

        {/* 1. BENEFICIARY PROFILE & ASSISTANCE NEED CARD */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-5">
          
          {/* Header with Name and Badge */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#006B56] to-teal-700 text-white font-black flex items-center justify-center text-base shadow-xs shrink-0">
                {beneficiaryName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {beneficiaryName}
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified Beneficiary
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs font-semibold text-slate-500">
                    {beneficiaryCode}
                  </span>
                  <span className="text-xs font-bold text-[#006B56] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                    {categoryName}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Programme</span>
              <span className="text-xs font-bold text-slate-800 block mt-0.5 max-w-xs truncate" title={programmeName}>
                {programmeName}
              </span>
            </div>
          </div>

          {/* 3 Core Vital Cards: Household, Location, Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-3.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl flex flex-col justify-between gap-1 shadow-2xs hover:bg-slate-50 transition">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-100/80 text-[#006B56] flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Household
                </span>
              </div>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                {householdMembers} Members
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl flex flex-col justify-between gap-1 shadow-2xs hover:bg-slate-50 transition min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Location
                </span>
              </div>
              <div className="text-sm font-black text-slate-900 mt-0.5 truncate" title={locationStr}>
                {locationStr}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl flex flex-col justify-between gap-1 shadow-2xs hover:bg-slate-50 transition min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Phone
                </span>
              </div>
              <div className="text-sm font-black text-slate-900 mt-0.5 font-mono truncate">
                {phoneStr}
              </div>
            </div>
          </div>

          {/* Stated Need */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#006B56]" />
              <span>Request Justification / Stated Need</span>
            </span>
            <div className="p-3.5 bg-emerald-50/40 rounded-2xl border-l-4 border-l-[#006B56] border border-emerald-100/80 text-slate-800 text-xs font-medium leading-relaxed italic">
              "{justificationText}"
            </div>
          </div>
        </div>

        {/* 2. ON-GROUND FIELD AUDIT & VERIFICATION EVIDENCE DOSSIER */}
        {isAssessed && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#006B56]" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    On-Ground Field Audit &amp; Verification Dossier
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeModalRequest.assessment_code ? `Assessment Reference: ${activeModalRequest.assessment_code}` : 'Verified by Assigned Field Worker'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-[#006B56] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Score: {activeModalRequest.vulnerability_score || 85}/100 ({activeModalRequest.urgency || activeModalRequest.priority || 'Critical Need'})
              </span>
            </div>

            {/* Field Worker Report / Ground Findings */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/70 space-y-1.5 text-xs">
              <span className="font-black text-[#006B56] text-[11px] uppercase tracking-wider block">
                Field Worker On-Ground Report &amp; Need Confirmation
              </span>
              <p className="text-slate-800 italic font-medium leading-relaxed">
                "{activeModalRequest.field_justification || activeModalRequest.ground_situation_report || activeModalRequest.audit_findings || 'Household verified in-person with acute need of emergency humanitarian assistance.'}"
              </p>
            </div>

            {/* Supervisor Endorsement Notes */}
            {activeModalRequest.review_notes && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-600 text-[11px] block">
                  Supervisor Endorsement &amp; Verification Remarks:
                </span>
                <p className="text-slate-800 leading-relaxed">
                  {activeModalRequest.review_notes}
                </p>
              </div>
            )}

            {/* Real Uploaded Photo Gallery */}
            {realPhotos.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#006B56]" />
                    <span>Attached Field Photos ({realPhotos.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Click to enlarge</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {realPhotos.map((photo, idx) => (
                    <div
                      key={photo.id || `photo-${idx}`}
                      onClick={() => setSelectedPreviewPhoto(photo)}
                      className="rounded-2xl overflow-hidden border border-slate-200 cursor-pointer hover:border-[#006B56] group bg-slate-100 shadow-2xs transition"
                    >
                      <div className="h-28 w-full bg-slate-900 overflow-hidden relative">
                        <img src={photo.url} alt={photo.name || photo.title || 'Evidence'} className="h-full w-full object-cover group-hover:scale-105 transition duration-200" />
                      </div>
                      <div className="p-2 bg-white text-[11px] font-bold text-slate-800 truncate">
                        {photo.name || photo.title || 'Field Evidence Photo'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real Uploaded Verification Documents */}
            {realDocs.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  <span>Attached Verification Documents ({realDocs.length})</span>
                </span>
                <div className="space-y-2">
                  {realDocs.map((doc, idx) => (
                    <div
                      key={doc.id || `doc-${idx}`}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                          {doc.name?.split('.').pop()?.toUpperCase() || 'PDF'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 truncate text-xs">{doc.name}</h4>
                          <p className="text-[10px] text-slate-500 truncate">{doc.category || 'Verification Document'} &bull; {doc.size || 'Attached'}</p>
                        </div>
                      </div>

                      {doc.url && (
                        <a
                          href={doc.url}
                          download={doc.name}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Doc</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. ASSIGNED SUPERVISOR & FIELD OPERATIONS TEAM */}
        {showAssignedCard && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#006B56]" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Field Operations Team
                  </h3>
                  <p className="text-[11px] text-slate-500">Supervisory state lead and deployed field officer</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#006B56] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#006B56]" />
                <span>Assigned</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#006B56] text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                  {(assignedSupervisor.name || 'Supervisor')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {assignedSupervisor.name}
                  </h4>
                  <p className="text-xs font-bold text-[#006B56]">
                    State Supervisor &bull; {assignedSupervisor.state || activeModalRequest.state || 'Eastern Equatoria'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{assignedSupervisor.phone || '+211-922-345002'}</span>
                </div>
                {!isAwaitingPMDecision && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsReassigning(true);
                      setSelectedSupervisorId(assignedSupervisor.id || '');
                      setSupervisorNotes(activeModalRequest.review_notes || '');
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
                  >
                    Change
                  </button>
                )}
              </div>
            </div>

            {/* Field Worker status if assigned by supervisor */}
            {activeModalRequest.assigned_field_worker_name && (
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-slate-800 flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-slate-700">
                  <User className="w-3.5 h-3.5 text-[#006B56]" />
                  Field Officer: <strong>{activeModalRequest.assigned_field_worker_name}</strong>
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {isAssessed ? 'Audit Complete & Forwarded' : 'Conducting Field Audit'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 4. PROGRAMME MANAGER DECISION & AUTHORIZATION CARD */}
        {isAwaitingPMDecision ? (
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-6 rounded-3xl border-2 border-[#006B56]/40 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#006B56]" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Programme Manager Final Authorization &amp; Aid Allocation
                  </h3>
                  <p className="text-xs text-slate-600">
                    Field audit verified on ground. Authorize assistance package and release for depot dispatch.
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-purple-900 bg-purple-100 border border-purple-200 px-3 py-1 rounded-full">
                Final Sign-off
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-emerald-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">Recommended Aid Package:</span>
                <span className="font-black text-slate-900 text-right">
                  {activeModalRequest.recommended_aid || activeModalRequest.assistance_type || activeModalRequest.category || 'Emergency Food Security Package'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">Beneficiary:</span>
                <span className="font-bold text-slate-800">
                  {beneficiaryName} ({beneficiaryCode})
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await onApproveRequest(activeModalRequest.id, {
                      notes: 'Approved and authorized for dispatch by Programme Manager Grace Ochieng.'
                    });
                    setActiveModalRequest(null);
                  } catch (e) {}
                }}
                className="w-full sm:flex-1 py-3.5 bg-[#006B56] hover:bg-[#005544] text-white font-black rounded-2xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve &amp; Authorize Aid Dispatch</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecisionAction('request_info');
                  setDecisionReason('');
                  setDecisionError('');
                }}
                className="w-full sm:w-auto px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-2xl text-xs transition cursor-pointer"
              >
                Request More Info
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecisionAction('reject');
                  setDecisionReason('');
                  setDecisionError('');
                }}
                className="w-full sm:w-auto px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-2xl text-xs transition cursor-pointer"
              >
                Reject
              </button>
            </div>
          </div>
        ) : activeModalRequest.status === 'Approved' || activeModalRequest.status === 'Completed' ? (
          <div className="bg-emerald-50/80 p-5 rounded-3xl border border-emerald-300 flex items-center gap-3.5 text-xs text-emerald-950">
            <CheckCircle2 className="w-6 h-6 text-[#006B56] shrink-0" />
            <div>
              <p className="font-black text-sm text-[#006B56]">Assistance Officially Approved &amp; Authorized</p>
              <p className="text-emerald-800/90 text-xs mt-0.5">
                This case has received Programme Manager authorization and is queued for warehouse dispatch and depot distribution.
              </p>
            </div>
          </div>
        ) : isModalRejected ? (
          <div className="bg-rose-50/90 p-5 rounded-3xl border border-rose-200 space-y-3 text-xs text-rose-950">
            <div className="flex items-center gap-2.5">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-black text-sm text-rose-800">Request Officially Rejected</span>
            </div>
            <div className="p-3.5 bg-white/90 rounded-2xl border border-rose-200 text-rose-900 font-medium text-xs leading-relaxed space-y-1 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-rose-500 block tracking-wider">Recorded Rejection Reason</span>
              <p className="italic">"{activeModalRequest.rejection_reason || activeModalRequest.review_notes || 'No specific rejection reason recorded.'}"</p>
            </div>
            <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-rose-700/90 font-medium">
              <span>Decision by: <strong className="text-rose-900">{activeModalRequest.reviewed_by || 'Grace Ochieng (Programme Manager)'}</strong></span>
              {activeModalRequest.reviewed_at && (
                <>
                  <span>&bull;</span>
                  <span>Date: {new Date(activeModalRequest.reviewed_at).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        ) : !isAssignedOrApproved || isReassigning ? (
          /* ASSIGN SUPERVISOR FORM (When not yet assigned) */
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {isReassigning ? 'Reassign State Supervisor' : 'Assign State Supervisor'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Designate a supervisor for {activeModalRequest.state || b?.state || 'Central Equatoria'} to deploy a field worker to conduct the household audit.
                </p>
              </div>
              {(activeModalRequest.state || b?.state) && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {activeModalRequest.state || b?.state}
                </span>
              )}
            </div>

            {decisionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{decisionError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select State Supervisor:
                </label>
                <select
                  required
                  value={selectedSupervisorId}
                  onChange={(e) => setSelectedSupervisorId(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-2xl bg-slate-50 font-bold text-xs outline-none focus:ring-2 focus:ring-[#006B56] cursor-pointer"
                >
                  <option value="">-- Choose State Supervisor --</option>
                  {supervisors.map(s => {
                    const reqState = (activeModalRequest.state || b?.state || '').toLowerCase();
                    const isMatch = reqState && (
                      s.state?.toLowerCase() === reqState ||
                      s.assigned_area?.toLowerCase().includes(reqState)
                    );
                    return (
                      <option key={s.id} value={s.id}>
                        {isMatch ? '⭐ Regional Match: ' : ''}{s.name} ({s.state || 'South Sudan'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Instructions for Supervisor (Optional):
                </label>
                <textarea
                  rows={2}
                  value={supervisorNotes}
                  onChange={(e) => setSupervisorNotes(e.target.value)}
                  placeholder={`e.g., Deploy field worker for household vulnerability audit in ${activeModalRequest.county || activeModalRequest.payam || 'Juba Central'}...`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-[#006B56]"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                {isReassigning && (
                  <button
                    type="button"
                    onClick={() => setIsReassigning(false)}
                    className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  disabled={!selectedSupervisorId}
                  onClick={handleAssignSupervisorSubmit}
                  className={`${isReassigning ? 'w-2/3' : 'w-full'} py-3.5 bg-[#006B56] hover:bg-emerald-800 disabled:opacity-40 text-white font-black rounded-2xl text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-2 active:scale-98`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isReassigning ? 'Update Supervisor' : 'Assign Supervisor for Field Audit'}</span>
                </button>
              </div>

              {/* Secondary Actions: Reject / Request Info */}
              {!isReassigning && (
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setDecisionAction('request_info');
                      setDecisionReason('');
                      setDecisionError('');
                    }}
                    className="text-amber-700 hover:text-amber-800 font-bold cursor-pointer hover:underline"
                  >
                    Request More Info
                  </button>
                  <span className="text-slate-300">&bull;</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDecisionAction('reject');
                      setDecisionReason('');
                      setDecisionError('');
                    }}
                    className="text-rose-600 hover:text-rose-700 font-bold cursor-pointer hover:underline"
                  >
                    Reject Request
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* SHARED OVERLAYS (PHOTO, DOC, REJECTION & REQUEST INFO MODALS) */}
        {renderOverlays()}

      </div>
    );
  }

  // Export Assistance Requests to PDF
  const handleExportPDF = () => {
    if (!filteredRequests || filteredRequests.length === 0) {
      alert('No requests available to export.');
      return;
    }

    const columns = [
      { header: 'Request Code', key: 'display_code' },
      { header: 'Beneficiary Name', key: 'display_name' },
      { header: 'Category / Assistance', key: 'display_category' },
      { header: 'Location / State', key: 'display_loc' },
      { header: 'Status', key: 'display_status' }
    ];

    const data = filteredRequests.map(r => {
      const isRejected = r.status === 'Rejected' || r.status_label === 'Rejected by PM' || Boolean(r.returned_to_worker);
      const statusText = isRejected ? 'Rejected' : r.status === 'Submitted' ? 'Submitted (Pending Supervisor)' : (r.status || 'Submitted');
      const b = getBeneficiary(r.beneficiary_id);

      return {
        display_code: r.request_code || r.id || 'ADR-REQ',
        display_name: r.beneficiary_name || b?.full_name || 'Beneficiary',
        display_category: r.assistance_type || r.category || 'Food Assistance',
        display_loc: r.state || b?.state || 'Eastern Equatoria',
        display_status: statusText
      };
    });

    exportToPDF({
      title: 'ADRA SOUTH SUDAN - ASSISTANCE REQUESTS DOSSIER',
      subtitle: `Filter: ${filterStatus} • Total Count: ${filteredRequests.length} records • Generated: ${new Date().toLocaleString()}`,
      columns,
      data,
      fileName: `ADRA_SS_assistance_requests_${new Date().toISOString().slice(0, 10)}.pdf`,
      summary: [
        { label: 'Total Requests', value: String(filteredRequests.length) },
        { label: 'Filter Scope', value: filterStatus === 'ALL' ? 'All Requests' : filterStatus },
        { label: 'Report Date', value: new Date().toLocaleDateString() }
      ]
    });
  };

  // Export Assistance Requests to CSV
  const handleExportCSV = () => {
    if (!filteredRequests || filteredRequests.length === 0) {
      alert('No requests available to export.');
      return;
    }
    const rows = [
      ['Request Code', 'Beneficiary Name', 'Category', 'Location', 'Status', 'Date']
    ];
    filteredRequests.forEach(r => {
      const b = getBeneficiary(r.beneficiary_id);
      rows.push([
        r.request_code || r.id,
        r.beneficiary_name || b?.full_name || 'Beneficiary',
        r.assistance_type || r.category || 'Food Assistance',
        r.state || b?.state || 'Eastern Equatoria',
        r.status || 'Submitted',
        new Date(r.created_at || Date.now()).toLocaleDateString()
      ]);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(x => `"${(x || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `ADRA_SS_assistance_requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3.5">
      {/* 1. SEARCH BAR & QUICK FILTERS & PDF/CSV EXPORT */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search request code, beneficiary, location..."
            className="w-full pl-9 pr-8 py-2.5 text-xs bg-white border border-slate-200/90 rounded-2xl focus:ring-2 focus:ring-[#006B56] outline-none shadow-xs font-semibold"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsFilterSheetOpen(!isFilterSheetOpen)}
          className={`p-2.5 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            (filterState !== 'ALL' || filterCounty !== 'ALL' || filterPriority !== 'ALL' || filterProgramme !== 'ALL' || isFilterSheetOpen)
              ? 'bg-[#006B56] text-white border-[#006B56]'
              : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-100'
          }`}
          title="Filters"
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
        </button>

        {/* Visible PDF & CSV Download Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer active:scale-95"
            title="Download Official PDF Report"
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

      {/* 2. ACTIVE QUEUE STATUS INDICATOR */}
      <div className="flex items-center justify-between px-1 py-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-800 tracking-tight">
            {filterStatus === 'ALL' ? 'All Assistance Requests' : `${filterStatus} Requests`}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
            {filteredRequests.length} {filteredRequests.length === 1 ? 'record' : 'records'}
          </span>
        </div>
        {filterStatus !== 'ALL' && (
          <button
            type="button"
            onClick={() => handleStatusChange('ALL')}
            className="text-[11px] font-bold text-[#006B56] hover:underline cursor-pointer"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* 3. EXPANDABLE ADVANCED FILTER SHEET / DRAWER */}
      {isFilterSheetOpen && (
        <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-md space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Advanced Filter Options</span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-[#006B56] hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">State</label>
              <select
                value={filterState}
                onChange={(e) => { setFilterState(e.target.value); setCurrentPage(1); }}
                className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none"
              >
                <option value="ALL">All States</option>
                {filterOptions.states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}
                className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Programme</label>
              <select
                value={filterProgramme}
                onChange={(e) => { setFilterProgramme(e.target.value); setCurrentPage(1); }}
                className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none"
              >
                <option value="ALL">All Programmes</option>
                {programmes.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 4. CLEAN & SIMPLE REQUESTS TABLE */}
      {paginatedRequests.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200/90 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No assistance requests found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Try adjusting your search query, status tabs, or region filters.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden max-w-5xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2 px-3 w-36">Request Code</th>
                  <th className="py-2 px-3">Beneficiary</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3 w-28">Status</th>
                  <th className="py-2 px-3 w-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRequests.map((r) => {
                  const isRejected = r.status === 'Rejected' || r.status_label === 'Rejected by PM' || Boolean(r.returned_to_worker) || (typeof r.status === 'string' && r.status.toLowerCase().includes('reject'));
                  const categoryText = (r.assistance_type || r.category || 'Food Assistance').split(',')[0].trim();

                  return (
                    <tr
                      key={r.id || r.request_code}
                      onClick={() => {
                        setActiveModalRequest(r);
                        setDecisionAction(null);
                        setDecisionError('');
                      }}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      {/* 1. Request Code */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-[#006B56]">
                          {r.request_code || r.id}
                        </span>
                      </td>

                      {/* 2. Beneficiary */}
                      <td className="py-2 px-3 font-bold text-slate-900 text-xs whitespace-nowrap">
                        {r.beneficiary_name}
                      </td>

                      {/* 3. Category */}
                      <td className="py-2 px-3 text-xs text-slate-600 font-medium whitespace-nowrap">
                        {categoryText}
                      </td>

                      {/* 4. Status */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                          isRejected ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          r.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          r.status === 'In Progress' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          r.status === 'Completed' ? 'bg-emerald-800 text-white border-emerald-900' :
                          r.status === 'Info Requested' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                          'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {isRejected ? 'Rejected' : r.status}
                        </span>
                      </td>

                      {/* 5. Action */}
                      <td className="py-2 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveModalRequest(r);
                            setDecisionAction(null);
                            setDecisionError('');
                          }}
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

      {/* 5. MOBILE PAGINATION BAR */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs text-xs font-bold">
          <span className="text-slate-500 text-[11px]">
            Page {currentPage} of {totalPages} ({filteredRequests.length} records)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 transition cursor-pointer"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1.5 rounded-xl bg-[#006B56] text-white disabled:opacity-40 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* SHARED OVERLAYS (PHOTO, DOC, REJECTION & REQUEST INFO MODALS) */}
      {renderOverlays()}
    </div>
  );
}

export default PMAssistanceRequestsView;
