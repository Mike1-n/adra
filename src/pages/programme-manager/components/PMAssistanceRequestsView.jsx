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
  ShieldCheck,
  Building,
  Check,
  AlertCircle,
  Share2,
  ListFilter,
  RefreshCw,
  X,
  Send,
  UserPlus
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
  onClearSelectedRequest
}) {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgramme, setFilterProgramme] = useState('ALL');
  const [filterState, setFilterState] = useState('ALL');
  const [filterCounty, setFilterCounty] = useState('ALL');
  const [filterPayam, setFilterPayam] = useState('ALL');
  const [filterBoma, setFilterBoma] = useState('ALL');
  const [filterVillage, setFilterVillage] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterAssistanceType, setFilterAssistanceType] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Mobile filters toggle
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Modals state
  const [activeModalRequest, setActiveModalRequest] = useState(selectedRequestToReview || null);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [supervisorNotes, setSupervisorNotes] = useState('');

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
        const matchesBenId = (r.beneficiary_id || '').toLowerCase().includes(query) || (r.beneficiary_code || '').toLowerCase().includes(query);
        const matchesName = (r.beneficiary_name || '').toLowerCase().includes(query);
        const matchesReason = (r.reason || r.description || '').toLowerCase().includes(query);
        const matchesType = (r.assistance_type || r.category || '').toLowerCase().includes(query);
        if (!matchesId && !matchesBenId && !matchesName && !matchesReason && !matchesType) return false;
      }

      // Filters
      if (filterProgramme !== 'ALL' && 
          r.program_name !== filterProgramme && 
          r.programme_name !== filterProgramme && 
          r.project_name !== filterProgramme && 
          r.program_id !== filterProgramme && 
          r.project_id !== filterProgramme) return false;
      if (filterState !== 'ALL' && r.state !== filterState) return false;
      if (filterCounty !== 'ALL' && r.county !== filterCounty) return false;
      if (filterPayam !== 'ALL' && r.payam !== filterPayam) return false;
      if (filterBoma !== 'ALL' && r.boma !== filterBoma) return false;
      if (filterVillage !== 'ALL' && r.village !== filterVillage) return false;
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'Submitted') {
          if (r.status !== 'Submitted' && r.status !== 'Pending' && r.status !== 'Pending Review') return false;
        } else if (r.status !== filterStatus) {
          return false;
        }
      }
      if (filterPriority !== 'ALL' && r.priority !== filterPriority && r.urgency !== filterPriority) return false;
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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

  // Handle Approve Action
  const handleApprove = async () => {
    if (!activeModalRequest) return;
    try {
      await onApproveRequest(activeModalRequest.id, {
        notes: 'Approved by Programme Manager. Ready for supervisor task allocation.',
        managerName: currentUser?.name || 'Grace Ochieng'
      });
      // Open supervisor assignment modal immediately
      setShowSupervisorModal(true);
    } catch (err) {
      console.error('Approval failed:', err);
    }
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
    if (!selectedSupervisorId) return;
    const sup = supervisors.find(s => s.id === selectedSupervisorId);
    try {
      await onAssignSupervisor(activeModalRequest.id, selectedSupervisorId, sup?.name || 'Supervisor', supervisorNotes);
      setShowSupervisorModal(false);
      setSelectedSupervisorId('');
      setSupervisorNotes('');
      setActiveModalRequest(null);
      if (onClearSelectedRequest) onClearSelectedRequest();
    } catch (err) {
      console.error('Assignment failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#006B56]" />
            Beneficiary Assistance Requests
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review, verify eligibility, authorize aid requests, and assign verified tasks to field supervisors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
          <span className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            Total: <strong className="text-slate-800">{filteredRequests.length}</strong> records
          </span>
        </div>
      </div>

      {/* 10 Filters Bar + Search */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search by Request ID, Beneficiary ID, or Beneficiary Name..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] focus:border-transparent outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Programme Filter */}
          <div>
            <select
              value={filterProgramme}
              onChange={(e) => { setFilterProgramme(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none bg-white text-slate-700"
            >
              <option value="ALL">All Programmes</option>
              {programmes.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none bg-white text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Assigned to Supervisor">Assigned to Supervisor</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
              <option value="Info Requested">Info Requested</option>
            </select>
          </div>
        </div>

        {/* Mobile toggle for detailed filters */}
        <div className="flex md:hidden items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
          >
            <Filter className="w-3.5 h-3.5 text-[#006B56]" />
            <span>{isMobileFiltersOpen ? 'Hide Location & Priority Filters' : 'More Filters (State, County, Priority...)'}</span>
          </button>
        </div>

        {/* Detailed Geographical & Type Filters */}
        <div className={`${isMobileFiltersOpen ? 'grid' : 'hidden md:grid'} grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2.5 pt-2 border-t border-slate-100 text-xs`}>
          {/* State */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">State</label>
            <select
              value={filterState}
              onChange={(e) => { setFilterState(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-md outline-none bg-white"
            >
              <option value="ALL">All States</option>
              {filterOptions.states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* County */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">County</label>
            <select
              value={filterCounty}
              onChange={(e) => { setFilterCounty(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-md outline-none bg-white"
            >
              <option value="ALL">All Counties</option>
              {filterOptions.counties.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Payam */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Payam</label>
            <select
              value={filterPayam}
              onChange={(e) => { setFilterPayam(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-md outline-none bg-white"
            >
              <option value="ALL">All Payams</option>
              {filterOptions.payams.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Boma */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Boma</label>
            <select
              value={filterBoma}
              onChange={(e) => { setFilterBoma(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-md outline-none bg-white"
            >
              <option value="ALL">All Bomas</option>
              {filterOptions.bomas.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Village */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Village</label>
            <select
              value={filterVillage}
              onChange={(e) => { setFilterVillage(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-md outline-none bg-white"
            >
              <option value="ALL">All Villages</option>
              {filterOptions.villages.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-md outline-none bg-white"
            >
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Assistance Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Aid Type</label>
            <select
              value={filterAssistanceType}
              onChange={(e) => { setFilterAssistanceType(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-md outline-none bg-white"
            >
              <option value="ALL">All Aid Types</option>
              {filterOptions.types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* MOBILE CARD LIST (<MD) */}
        <div className="md:hidden divide-y divide-slate-100">
          {paginatedRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No assistance requests found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your filters</p>
            </div>
          ) : (
            paginatedRequests.map((r) => {
              const ben = getBeneficiary(r.beneficiary_id);
              const isApprovedUnassigned = r.status === 'Approved' && !r.assigned_supervisor;

              return (
                <div key={r.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-[#006B56]">{r.request_code || r.id}</span>
                      <h4 className="font-bold text-sm text-slate-900 mt-0.5 leading-tight">
                        {r.beneficiary_name || ben?.full_name || 'Mary Nyambura'}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        ID: {r.beneficiary_code || r.beneficiary_id || ben?.beneficiary_code || ben?.id || 'ADRA-SS-000125'}
                      </span>
                    </div>

                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      (r.priority === 'Critical' || r.urgency === 'Critical') ? 'bg-rose-100 text-rose-800' :
                      (r.priority === 'High' || r.urgency === 'High') ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {r.priority || r.urgency || 'Medium'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Programme:</span>
                      <span className="font-bold text-[#006B56] truncate max-w-[180px]">{r.program_name || r.programme_name || r.project_name || 'Emergency Food Security'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Aid & Qty:</span>
                      <span className="font-semibold text-slate-800">{r.assistance_type || r.category || 'Food Assistance'} ({r.quantity_requested || (r.household_members ? `For ${r.household_members} members` : '1 Unit')})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Location:</span>
                      <span className="text-slate-700">{r.county ? (r.payam ? `${r.county}, ${r.payam}` : r.county) : (r.location || r.state || 'Kapoeta South')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Supervisor:</span>
                      <span className="font-medium text-slate-800">{r.assigned_supervisor || r.assigned_supervisor_name || <span className="text-slate-400 italic">Unassigned</span>}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      r.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                      r.status === 'Assigned to Supervisor' ? 'bg-teal-100 text-teal-800' :
                      r.status === 'In Progress' ? 'bg-indigo-100 text-indigo-800' :
                      r.status === 'Completed' ? 'bg-emerald-700 text-white' :
                      r.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                      r.status === 'Info Requested' ? 'bg-orange-100 text-orange-800' :
                      r.status === 'Under Review' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {r.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => setActiveModalRequest(r)}
                      className="px-3.5 py-1.5 bg-[#006B56] hover:bg-[#005242] text-white text-xs font-bold rounded-lg shadow-xs active:scale-95 transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Review Request
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE (>=MD) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th onClick={() => handleSort('id')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-1">
                    Request ID
                    {sortField === 'id' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="py-3.5 px-4">Beneficiary</th>
                <th onClick={() => handleSort('program_name')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-1">
                    Programme
                    {sortField === 'program_name' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="py-3.5 px-4">Aid Type & Qty</th>
                <th className="py-3.5 px-4">Location</th>
                <th onClick={() => handleSort('created_at')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-1">
                    Submitted
                    {sortField === 'created_at' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th onClick={() => handleSort('priority')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-1">
                    Priority
                    {sortField === 'priority' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="py-3.5 px-4">Eligibility</th>
                <th onClick={() => handleSort('status')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-1">
                    Status
                    {sortField === 'status' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="py-3.5 px-4">Assigned Sup.</th>
                <th className="py-3.5 px-4">Assigned FW</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan="12" className="py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">No assistance requests found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords</p>
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((r) => {
                  const ben = getBeneficiary(r.beneficiary_id);
                  const isPending = r.status === 'Submitted' || r.status === 'Under Review';
                  const isApprovedUnassigned = r.status === 'Approved' && !r.assigned_supervisor;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/75 transition-colors">
                      {/* Request ID */}
                      <td className="py-3 px-4 font-mono font-bold text-xs text-[#006B56] whitespace-nowrap">
                        {r.request_code || r.id}
                      </td>

                      {/* Beneficiary Name & ID */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 leading-tight">
                          {r.beneficiary_name || ben?.full_name || 'Mary Nyambura'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          ID: {r.beneficiary_code || r.beneficiary_id || ben?.beneficiary_code || ben?.id || 'ADRA-SS-000125'}
                        </div>
                      </td>

                      {/* Programme */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Layers className="w-3 h-3 text-emerald-600" />
                          {r.program_name || r.programme_name || r.project_name || 'Emergency Food Security'}
                        </span>
                      </td>

                      {/* Assistance Type */}
                      <td className="py-3 px-4 text-xs">
                        <div className="font-semibold text-slate-800">{r.assistance_type || r.category || 'Food Assistance'}</div>
                        <div className="text-slate-500">{r.quantity_requested || (r.household_members ? `For ${r.household_members} members` : '1 Unit')}</div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        <div>{r.county || 'Kapoeta South'}, {r.state || 'Eastern Equatoria'}</div>
                        <div className="text-[11px] text-slate-400">{r.payam || 'Kapoeta Town'}{r.boma ? `, ${r.boma}` : ''}</div>
                      </td>

                      {/* Date Submitted */}
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(r.created_at || new Date().toISOString())}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          r.priority === 'Critical' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          r.priority === 'High' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          r.priority === 'Medium' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {r.priority || 'Medium'}
                        </span>
                      </td>

                      {/* Eligibility / Verification */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          r.eligibility_status === 'Verified' || r.is_duplicate === false ? 'bg-emerald-100 text-emerald-800' :
                          r.eligibility_status === 'Flagged' || r.is_duplicate === true ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          {r.eligibility_status || (r.is_duplicate ? 'Duplicate Risk' : 'Verified')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          r.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          r.status === 'Assigned to Supervisor' ? 'bg-teal-100 text-teal-800' :
                          r.status === 'In Progress' ? 'bg-indigo-100 text-indigo-800' :
                          r.status === 'Completed' ? 'bg-emerald-700 text-white' :
                          r.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                          r.status === 'Info Requested' ? 'bg-orange-100 text-orange-800' :
                          r.status === 'Under Review' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>

                      {/* Assigned Supervisor */}
                      <td className="py-3 px-4 text-xs">
                        {r.assigned_supervisor ? (
                          <div className="flex items-center gap-1 text-slate-800 font-medium">
                            <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                            {r.assigned_supervisor}
                          </div>
                        ) : isApprovedUnassigned ? (
                          <button
                            onClick={() => { setActiveModalRequest(r); setShowSupervisorModal(true); }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-[11px] rounded border border-amber-200 transition-colors"
                          >
                            <UserPlus className="w-3 h-3" />
                            Assign Now
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Assigned Field Worker */}
                      <td className="py-3 px-4 text-xs">
                        {r.assigned_field_worker ? (
                          <span className="text-slate-700 font-medium">{r.assigned_field_worker}</span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Via Supervisor</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setActiveModalRequest(r)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006B56] hover:bg-[#005242] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50">
          <div>
            Showing <strong>{paginatedRequests.length}</strong> of <strong>{filteredRequests.length}</strong> requests
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded border border-slate-200 bg-white font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded font-medium ${
                  currentPage === page
                    ? 'bg-[#006B56] text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded border border-slate-200 bg-white font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* REQUEST REVIEW MODAL */}
      {activeModalRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                    {activeModalRequest.request_code || activeModalRequest.id}
                  </span>
                  <span className="text-xs text-slate-300">
                    Programme Manager Authorization File
                  </span>
                </div>
                <h3 className="text-lg font-bold mt-1 text-white flex items-center gap-2">
                  Request Review: {activeModalRequest.assistance_type || activeModalRequest.category || 'Humanitarian Aid'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveModalRequest(null);
                  setDecisionAction(null);
                  setDecisionError('');
                  if (onClearSelectedRequest) onClearSelectedRequest();
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-sm">
              {/* Top alert if duplicate detection or critical urgency */}
              {activeModalRequest.is_duplicate && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Potential Duplicate Flagged</h4>
                    <p className="text-xs mt-0.5 text-rose-700">
                      System detected another request from the same household or biometric identity within the last 30 days. Review previous assistance before approving.
                    </p>
                  </div>
                </div>
              )}

              {/* 2-Column Info: Beneficiary Information & Request Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Beneficiary Information Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider pb-2 border-b border-slate-200">
                    <User className="w-4 h-4 text-[#006B56]" />
                    Beneficiary Information
                  </h4>
                  {(() => {
                    const b = getBeneficiary(activeModalRequest.beneficiary_id);
                    return (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Beneficiary Code / ID:</span>
                          <span className="font-mono font-bold text-slate-900">{activeModalRequest.beneficiary_code || activeModalRequest.beneficiary_id || b?.beneficiary_code || b?.id || 'ADRA-SS-000125'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Full Name:</span>
                          <span className="font-bold text-slate-900">{activeModalRequest.beneficiary_name || b?.full_name || 'Mary Nyambura'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Gender & Age:</span>
                          <span className="font-medium text-slate-800">{b?.gender || 'Female'}, {b?.age ? `${b.age} yrs` : '34 yrs'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Phone Number:</span>
                          <span className="font-medium text-slate-800">{b?.phone || b?.phone_number || '+211 92 345 6789'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Household Size:</span>
                          <span className="font-medium text-slate-800">{activeModalRequest.household_members || b?.household_size || 7} members</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Registration Date:</span>
                          <span className="font-medium text-slate-800">{formatDate(b?.registration_date || b?.created_at || '2026-01-15')}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-start">
                          <span className="text-slate-500">Location:</span>
                          <span className="font-medium text-slate-800 text-right">
                            {activeModalRequest.village || 'jkkfg'}, {activeModalRequest.payam || 'Kapoeta Town'},<br />
                            {activeModalRequest.county || 'Kapoeta South'}, {activeModalRequest.state || 'Eastern Equatoria'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Request Information Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider pb-2 border-b border-slate-200">
                    <FileText className="w-4 h-4 text-[#006B56]" />
                    Request Information
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Programme:</span>
                      <span className="font-bold text-[#006B56]">{activeModalRequest.program_name || activeModalRequest.programme_name || activeModalRequest.project_name || 'Emergency Aid'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assistance Requested:</span>
                      <span className="font-bold text-slate-900">{activeModalRequest.assistance_type || activeModalRequest.category || 'General Support'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Quantity / Household:</span>
                      <span className="font-bold text-slate-900">
                        {activeModalRequest.household_size || activeModalRequest.household_members ? `${activeModalRequest.household_size || activeModalRequest.household_members} Members` : (activeModalRequest.quantity_requested || '1 Unit')}
                      </span>
                    </div>
                    {activeModalRequest.preferred_hub && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Distribution Hub:</span>
                        <span className="font-medium text-slate-800 text-right">{activeModalRequest.preferred_hub}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date Submitted:</span>
                      <span className="font-medium text-slate-800">{formatDate(activeModalRequest.created_at)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Priority:</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        (activeModalRequest.priority === 'Critical' || activeModalRequest.urgency === 'Critical') ? 'bg-rose-100 text-rose-800' :
                        (activeModalRequest.priority === 'High' || activeModalRequest.urgency === 'High') ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {activeModalRequest.priority || activeModalRequest.urgency || 'Medium'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Current Status:</span>
                      <span className="px-2 py-0.5 rounded font-bold bg-slate-200 text-slate-800">
                        {activeModalRequest.status}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 block mb-1 font-semibold">Reason for Request:</span>
                      <p className="bg-white p-2 rounded border border-slate-200 text-slate-700 italic">
                        "{activeModalRequest.reason || activeModalRequest.description || 'Household displaced due to recent seasonal flooding; food rations depleted and water source contaminated.'}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification & Duplicate Check Section */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verification & Biometric Audit
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
                    <span className="text-slate-500 block">Biometric ID Verification:</span>
                    <span className="font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      1:1 Fingerprint & Facial Match Verified
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block">Duplicate Registry Check:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      {activeModalRequest.is_duplicate ? (
                        <span className="text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Overlapping Active Claim Found
                        </span>
                      ) : (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 0 Duplicate Records Found
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block">Vulnerability Score:</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      84 / 100 (Tier 1 Priority - Female-Headed Household)
                    </span>
                  </div>
                </div>
              </div>

              {/* Previous Assistance Received Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-[#006B56]" />
                  Previous Humanitarian Assistance Received
                </h4>
                {(() => {
                  const history = getPreviousAssistance(activeModalRequest.beneficiary_id, activeModalRequest.id);
                  if (history.length === 0) {
                    return (
                      <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-200 italic">
                        No prior recorded aid distributions for this beneficiary in the current fiscal year.
                      </div>
                    );
                  }
                  return (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600">
                          <tr>
                            <th className="py-2 px-3 font-semibold">Programme</th>
                            <th className="py-2 px-3 font-semibold">Assistance Type</th>
                            <th className="py-2 px-3 font-semibold">Quantity</th>
                            <th className="py-2 px-3 font-semibold">Date</th>
                            <th className="py-2 px-3 font-semibold">Distribution Location</th>
                            <th className="py-2 px-3 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {history.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-medium text-slate-900">{item.program_name || 'Emergency Aid'}</td>
                              <td className="py-2 px-3 text-slate-700">{item.assistance_type}</td>
                              <td className="py-2 px-3 text-slate-700 font-semibold">{item.quantity_requested || '1 Unit'}</td>
                              <td className="py-2 px-3 text-slate-500">{formatDate(item.created_at)}</td>
                              <td className="py-2 px-3 text-slate-600">{item.county}, {item.payam}</td>
                              <td className="py-2 px-3">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Action Form If Rejecting or Requesting Info */}
              {decisionAction && (
                <div className="p-4 rounded-xl border border-slate-300 bg-amber-50/70 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      {decisionAction === 'reject' ? (
                        <>
                          <XCircle className="w-4 h-4 text-rose-600" />
                          Mandatory Rejection Justification
                        </>
                      ) : (
                        <>
                          <HelpCircle className="w-4 h-4 text-amber-600" />
                          Request Additional Field Information
                        </>
                      )}
                    </h4>
                    <button
                      onClick={() => { setDecisionAction(null); setDecisionError(''); }}
                      className="text-xs text-slate-500 hover:text-slate-800 underline"
                    >
                      Cancel
                    </button>
                  </div>

                  <p className="text-xs text-slate-600">
                    {decisionAction === 'reject'
                      ? 'The Programme Manager is required to record an explicit audit reason when rejecting a humanitarian assistance request.'
                      : 'Provide comments specifying the exact documents or field assessments required before authorization.'}
                  </p>

                  <textarea
                    rows="3"
                    value={decisionReason}
                    onChange={(e) => { setDecisionReason(e.target.value); setDecisionError(''); }}
                    placeholder={
                      decisionAction === 'reject'
                        ? 'e.g., Ineligible based on vulnerability assessment threshold; recent aid package received from partner agency in same zone...'
                        : 'e.g., Please verify household composition with local Boma chief and provide updated photo ID evidence...'
                    }
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#006B56] bg-white text-slate-800"
                  />

                  {decisionError && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {decisionError}
                    </p>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setDecisionAction(null); setDecisionError(''); }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg"
                    >
                      Dismiss
                    </button>
                    {decisionAction === 'reject' ? (
                      <button
                        onClick={handleConfirmReject}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
                      >
                        Confirm Rejection
                      </button>
                    ) : (
                      <button
                        onClick={handleConfirmRequestInfo}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                      >
                        Send Info Request
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Decision Buttons */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>Current Role:</span>
                <span className="font-semibold text-slate-800">Programme Manager ({currentUser?.name || 'Grace Ochieng'})</span>
              </div>

              <div className="flex items-center gap-2.5">
                {activeModalRequest.status !== 'Approved' && activeModalRequest.status !== 'Assigned to Supervisor' && activeModalRequest.status !== 'Completed' && (
                  <>
                    <button
                      onClick={() => {
                        setDecisionAction('request_info');
                        setDecisionReason('');
                        setDecisionError('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      Request More Info
                    </button>

                    <button
                      onClick={() => {
                        setDecisionAction('reject');
                        setDecisionReason('');
                        setDecisionError('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
                    >
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Reject Request
                    </button>

                    <button
                      onClick={handleApprove}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006B56] hover:bg-[#005242] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Assign Supervisor
                    </button>
                  </>
                )}

                {activeModalRequest.status === 'Approved' && !activeModalRequest.assigned_supervisor && (
                  <button
                    onClick={() => setShowSupervisorModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign Supervisor Now
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveModalRequest(null);
                    setDecisionAction(null);
                    if (onClearSelectedRequest) onClearSelectedRequest();
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUPERVISOR ASSIGNMENT MODAL */}
      {showSupervisorModal && activeModalRequest && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-[#006B56] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Assign Supervisor to Request #{activeModalRequest.id}
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Select an authorized field supervisor for {activeModalRequest.county || 'Kapoeta South'}, {activeModalRequest.program_name || 'Emergency Relief'}.
                </p>
              </div>
              <button
                onClick={() => setShowSupervisorModal(false)}
                className="p-1 text-emerald-100 hover:text-white rounded-lg hover:bg-emerald-700/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleAssignSupervisorSubmit} className="p-6 space-y-4 text-sm">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                <strong>Workflow Rule:</strong> The Programme Manager assigns the verified request to the Supervisor. The Supervisor will subsequently allocate the appropriate Field Worker for distribution.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Available Field Supervisors (Filtered by Programme & Area)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {supervisors.map(sup => {
                    const isSelected = selectedSupervisorId === sup.id;
                    const workload = sup.current_workload_pct || 40;
                    return (
                      <div
                        key={sup.id}
                        onClick={() => setSelectedSupervisorId(sup.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#006B56] bg-emerald-50/60 ring-2 ring-[#006B56]/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              {sup.name}
                              <span className="text-[11px] px-2 py-0.2 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {sup.status || 'Active'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {sup.program_name} • {sup.assigned_area}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold text-slate-700 block">
                              Workload: {workload}%
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {sup.active_tasks || 3} active tasks
                            </span>
                          </div>
                        </div>

                        {/* Workload Progress Bar */}
                        <div className="mt-2.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              workload > 80 ? 'bg-rose-500' : workload > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${workload}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manager Instructions / Task Allocation Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  value={supervisorNotes}
                  onChange={(e) => setSupervisorNotes(e.target.value)}
                  placeholder="e.g., Prioritize immediate dispatch; coordinate distribution with local community health volunteer..."
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#006B56]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupervisorModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedSupervisorId}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#006B56] hover:bg-[#005242] rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Confirm Supervisor Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
