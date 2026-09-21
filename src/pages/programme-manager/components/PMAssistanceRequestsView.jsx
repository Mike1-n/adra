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
  Phone
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

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
  const itemsPerPage = 6;
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

  // Filtered & Sorted Requests
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = (r.id || '').toLowerCase().includes(query) || (r.request_code || '').toLowerCase().includes(query);
        const matchesBen = (r.beneficiary_id || '').toLowerCase().includes(query) ||
          (r.beneficiary_name || '').toLowerCase().includes(query) ||
          (r.beneficiary_code || '').toLowerCase().includes(query);
        const matchesType = (r.assistance_type || '').toLowerCase().includes(query) || (r.category || '').toLowerCase().includes(query);
        const matchesProg = (r.program_name || '').toLowerCase().includes(query) || (r.programme_name || '').toLowerCase().includes(query);
        if (!matchesId && !matchesBen && !matchesType && !matchesProg) return false;
      }

      // Programme
      if (filterProgramme !== 'ALL' && r.program_name !== filterProgramme && r.programme_name !== filterProgramme && r.project_name !== filterProgramme && r.program_id !== filterProgramme) return false;

      // Geographical
      if (filterState !== 'ALL' && r.state !== filterState) return false;
      if (filterCounty !== 'ALL' && r.county !== filterCounty) return false;
      if (filterPayam !== 'ALL' && r.payam !== filterPayam) return false;
      if (filterBoma !== 'ALL' && r.boma !== filterBoma) return false;
      if (filterVillage !== 'ALL' && r.village !== filterVillage) return false;

      // Status
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'Pending Review' || filterStatus === 'Pending') {
          if (r.status !== 'Submitted' && r.status !== 'Under Review' && r.status !== 'Pending' && r.status !== 'Pending Review' && r.status !== 'My Decision') return false;
        } else if (filterStatus === 'Approved') {
          if (r.status !== 'Approved' && r.status !== 'Assigned to Supervisor') return false;
        } else if (filterStatus === 'In Field' || filterStatus === 'In Progress') {
          if (r.status !== 'In Progress' && r.status !== 'In Field') return false;
        } else if (filterStatus === 'Completed') {
          if (r.status !== 'Completed' && r.status !== 'Fulfilled') return false;
        } else if (filterStatus === 'Rejected') {
          if (r.status !== 'Rejected') return false;
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
    if (!decisionReason.trim()) {
      setDecisionError('Please provide an official rejection reason before proceeding.');
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
    if (!decisionReason.trim()) {
      setDecisionError('Please specify the additional information required from field/beneficiary.');
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
    const isAssignedStatus = activeModalRequest.status === 'Assigned to Supervisor' || 
                             activeModalRequest.status === 'Approved' || 
                             activeModalRequest.status === 'In Progress' || 
                             activeModalRequest.status === 'Completed';
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

  // IF A REQUEST IS SELECTED: RENDER DEDICATED FULL AUTHORIZATION PAGE VIEW
  if (activeModalRequest) {
    const b = getBeneficiary(activeModalRequest.beneficiary_id);
    const isAssignedOrApproved = activeModalRequest.status === 'Assigned to Supervisor' || 
                                 activeModalRequest.status === 'Approved' || 
                                 activeModalRequest.status === 'In Progress' || 
                                 activeModalRequest.status === 'Completed';
    const showAssignedCard = Boolean(assignedSupervisor) && isAssignedOrApproved && !isReassigning;
    const currentAction = decisionAction || 'assign';

    return (
      <div className="space-y-4 pb-12 animate-in fade-in duration-150">
        {/* Top Header Navigation Strip */}
        <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
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
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
              <span>Back to Requests</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className="font-mono text-xs font-black text-[#006B56] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              {activeModalRequest.request_code || activeModalRequest.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              activeModalRequest.priority === 'Critical' ? 'bg-red-100 text-red-800 border-red-200' :
              activeModalRequest.priority === 'High' ? 'bg-amber-100 text-amber-800 border-amber-200' :
              'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {activeModalRequest.priority || 'Standard'} Priority
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              activeModalRequest.status === 'Approved' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
              activeModalRequest.status === 'Assigned to Supervisor' ? 'bg-emerald-100 text-[#006B56] border-emerald-300 font-black' :
              activeModalRequest.status === 'In Progress' ? 'bg-blue-100 text-blue-900 border-blue-300' :
              activeModalRequest.status === 'Completed' ? 'bg-emerald-800 text-white border-emerald-900' :
              activeModalRequest.status === 'Rejected' ? 'bg-rose-100 text-rose-900 border-rose-300' :
              activeModalRequest.status === 'Info Requested' ? 'bg-orange-100 text-orange-900 border-orange-300' :
              'bg-amber-100 text-amber-900 border-amber-300'
            }`}>
              {activeModalRequest.status}
            </span>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT COLUMN: Cohesive Request & Beneficiary Profile (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              {/* Program & Category Title */}
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006B56] block mb-1">
                  {activeModalRequest.program_name || activeModalRequest.programme_name || 'Emergency Relief & Humanitarian Response'}
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {activeModalRequest.assistance_type || activeModalRequest.category || 'Humanitarian Assistance'}
                </h2>
              </div>

              {/* Beneficiary Core Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Beneficiary Name</span>
                    <span className="text-sm font-black text-slate-900">
                      {activeModalRequest.beneficiary_name || b?.full_name || 'Beneficiary'}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {activeModalRequest.beneficiary_code || activeModalRequest.beneficiary_id || b?.beneficiary_code || 'ADRA-SS-001'}
                  </span>
                </div>

                {/* 4 Metric Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Household</span>
                    <span className="text-xs font-black text-slate-800">
                      {activeModalRequest.household_members || b?.household_size || 5} Members
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Location</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {activeModalRequest.county || 'Juba'}, {activeModalRequest.state || 'Central Equatoria'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
                    <span className="text-xs font-bold text-slate-800">
                      {b?.phone_number || b?.phone || activeModalRequest.phone || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Submitted</span>
                    <span className="text-xs font-bold text-slate-800">
                      {formatDate(activeModalRequest.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Justification Box */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#006B56]" />
                  <span>Request Justification</span>
                </span>
                <p className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800 text-xs italic leading-relaxed">
                  "{activeModalRequest.reason || activeModalRequest.description || 'Household urgently requiring emergency assistance.'}"
                </p>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: Assigned Supervisor Card OR Review & Dispatch Decision Center (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {showAssignedCard ? (
              /* VIEW A: ASSIGNED SUPERVISOR & FIELD PROGRESS CARD */
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#006B56]" />
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Assigned State Supervisor
                      </h3>
                      <p className="text-[10px] text-slate-500 font-semibold">Active Humanitarian Dispatch</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#006B56] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#006B56]" />
                    <span>Dispatched</span>
                  </span>
                </div>

                {/* Supervisor Profile Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/50 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#006B56] text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                      {(assignedSupervisor.name || 'Supervisor')
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black text-slate-900 leading-tight truncate">
                        {assignedSupervisor.name}
                      </h4>
                      <p className="text-[11px] font-bold text-[#006B56] mt-0.5">
                        State Supervisor &bull; {assignedSupervisor.state || activeModalRequest.state || 'Central Equatoria'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#006B56] shrink-0" />
                      <span className="font-bold">{assignedSupervisor.phone || '+211-922-345002'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#006B56] shrink-0" />
                      <span className="truncate">{assignedSupervisor.assigned_area || assignedSupervisor.state || 'Central Equatoria (Juba)'}</span>
                    </div>
                  </div>
                </div>

                {/* Field Worker Execution Status */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Field Officer Assigned</span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      In Field Execution
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="font-black text-slate-900">
                      {activeModalRequest.assigned_field_worker_name || activeModalRequest.field_worker_name || 'Pending Field Officer Allocation'}
                    </span>
                  </div>
                </div>

                {/* Manager Instructions Directives */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Manager Dispatch Directive</span>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-800 italic">
                    "{activeModalRequest.review_notes || 'Deliver emergency assistance basket and verify beneficiary identity at distribution point.'}"
                  </div>
                </div>

                {/* Reassign / Change Supervisor Option */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReassigning(true);
                      setDecisionAction('assign');
                      setSelectedSupervisorId(assignedSupervisor.id || '');
                      setSupervisorNotes(activeModalRequest.review_notes || '');
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                    <span>Reassign / Update Supervisor</span>
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW B: REVIEW & DISPATCH DECISION CONTROLS (For Pending or Reassigning) */
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#006B56]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      {isReassigning ? 'Reassign Supervisor' : 'Review & Dispatch'}
                    </h3>
                  </div>
                  {activeModalRequest.state && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {activeModalRequest.state}
                    </span>
                  )}
                </div>

                {/* 3-Way Segmented Decision Selector (Shown when not reassigning) */}
                {!isReassigning && (
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => { setDecisionAction('assign'); setDecisionError(''); }}
                      className={`py-2 px-1 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                        currentAction === 'assign'
                          ? 'bg-[#006B56] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDecisionAction('request_info'); setDecisionError(''); }}
                      className={`py-2 px-1 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                        currentAction === 'request_info'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Ask Info
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDecisionAction('reject'); setDecisionError(''); }}
                      className={`py-2 px-1 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                        currentAction === 'reject'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                )}

                {/* Error Notice */}
                {decisionError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{decisionError}</span>
                  </div>
                )}

                {/* ACTION MODE 1: APPROVE & ASSIGN SUPERVISOR */}
                {(currentAction === 'assign' || isReassigning) && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Designate State Supervisor:
                      </label>
                      <select
                        required
                        value={selectedSupervisorId}
                        onChange={(e) => setSelectedSupervisorId(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-bold text-xs outline-none focus:ring-2 focus:ring-[#006B56]"
                      >
                        <option value="">-- Select State Supervisor --</option>
                        {supervisors.map(s => {
                          const isMatch = activeModalRequest.state && (
                            s.state?.toLowerCase() === activeModalRequest.state.toLowerCase() ||
                            s.assigned_area?.toLowerCase().includes(activeModalRequest.state.toLowerCase())
                          );
                          return (
                            <option key={s.id} value={s.id}>
                              {isMatch ? '⭐ Regional Match: ' : ''}{s.name} — {s.state || 'South Sudan'}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Field Instructions / Delivery Notes (Optional):
                      </label>
                      <textarea
                        rows={3}
                        value={supervisorNotes}
                        onChange={(e) => setSupervisorNotes(e.target.value)}
                        placeholder="e.g., Deliver emergency food basket and verify household head."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#006B56]"
                      />
                    </div>

                    <div className="flex gap-2">
                      {isReassigning && (
                        <button
                          type="button"
                          onClick={() => setIsReassigning(false)}
                          className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer text-center"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={!selectedSupervisorId}
                        onClick={handleAssignSupervisorSubmit}
                        className={`${isReassigning ? 'w-2/3' : 'w-full'} py-3 bg-[#006B56] hover:bg-emerald-800 disabled:opacity-40 text-white font-black rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-98`}
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>{isReassigning ? 'Update Assignment' : 'Confirm Approval & Dispatch Task'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ACTION MODE 2: REQUEST ADDITIONAL INFO */}
                {!isReassigning && currentAction === 'request_info' && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Information Required from Field / Beneficiary:
                      </label>
                      <textarea
                        rows={4}
                        value={decisionReason}
                        onChange={(e) => setDecisionReason(e.target.value)}
                        placeholder="Specify what additional documentation or household clarification is needed..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmRequestInfo}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Field Inquiry</span>
                    </button>
                  </div>
                )}

                {/* ACTION MODE 3: REJECT REQUEST */}
                {!isReassigning && currentAction === 'reject' && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Official Rejection Justification (Audit Record):
                      </label>
                      <textarea
                        rows={4}
                        value={decisionReason}
                        onChange={(e) => setDecisionReason(e.target.value)}
                        placeholder="State reason why request cannot be fulfilled under current programme criteria..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmReject}
                      className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Confirm Rejection</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* 1. SEARCH BAR & QUICK FILTERS BUTTON */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
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
      </div>

      {/* 2. ACTIVE QUEUE STATUS INDICATOR */}
      <div className="flex items-center justify-between px-1 py-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-800 tracking-tight">
            {filterStatus === 'ALL' ? 'All Requests' : `${filterStatus} Requests`}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
            {filteredRequests.length} {filteredRequests.length === 1 ? 'record' : 'records'}
          </span>
        </div>
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

      {/* 4. REQUESTS CARD LIST */}
      {paginatedRequests.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/90 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-xs font-bold text-slate-800">No assistance requests found</h3>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            Try adjusting your search query, status filters, or region filters.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {paginatedRequests.map((r) => {
            const isPending = r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'Pending';

            return (
              <div
                key={r.id || r.request_code}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-[#006B56]">{r.request_code || r.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    r.priority === 'Critical' ? 'bg-red-100 text-red-800 border-red-200' :
                    r.priority === 'High' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {r.priority || 'Standard'} Priority
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900">{r.beneficiary_name} &bull; {r.assistance_type || r.category}</h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{r.county || 'Kapoeta South'}, {r.state || 'Eastern Equatoria'}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.status === 'Approved' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                    r.status === 'In Progress' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                    r.status === 'Completed' ? 'bg-emerald-800 text-white' :
                    r.status === 'Rejected' ? 'bg-rose-100 text-rose-900 border border-rose-200' :
                    r.status === 'Info Requested' ? 'bg-orange-100 text-orange-900 border border-orange-200' :
                    'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}>
                    {r.status}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModalRequest(r);
                          handleApprove(r);
                        }}
                        className="px-3.5 py-1.5 bg-[#006B56] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs active:scale-95 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Authorize</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setActiveModalRequest(r);
                        setDecisionAction(null);
                        setDecisionError('');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition active:scale-95 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
    </div>
  );
}

export default PMAssistanceRequestsView;
