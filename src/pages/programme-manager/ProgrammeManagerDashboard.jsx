import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Home,
  Briefcase,
  HeartHandshake,
  MapPin,
  Package,
  BarChart3,
  Bell,
  HelpCircle,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  Search,
  CheckCircle2,
  RefreshCw,
  Menu,
  X,
  Layers,
  FileText,
  Users,
  Activity,
  Truck,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Banknote,
  ArrowLeft,
  ArrowRightLeft,
  FolderKanban,
  Building2,
  Boxes
} from 'lucide-react';
import { db, normalizeAssistanceRequest } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { PMOverviewView } from './components/PMOverviewView';
import { PMAssistanceRequestsView } from './components/PMAssistanceRequestsView';
import { PMBeneficiariesView } from './components/PMBeneficiariesView';
import { PMProgrammesView } from './components/PMProgrammesView';
import { PMFieldActivitiesView } from './components/PMFieldActivitiesView';
import { PMAidDistributionsView } from './components/PMAidDistributionsView';
import { PMSupervisorsView } from './components/PMSupervisorsView';
import { PMResourcesView } from './components/PMResourcesView';
import { PMReportsView } from './components/PMReportsView';
import { PMFeedbackView } from './components/PMFeedbackView';
import { PMNotificationsView } from './components/PMNotificationsView';
import { PMProfileView } from './components/PMProfileView';
import { PMFacilitationsView } from './components/PMFacilitationsView';

export function ProgrammeManagerDashboard({
  currentUser,
  onLogout,
  onSwitchRole,
  onBackToFieldApp
}) {
  const { logout: authLogout, quickSwitchRole } = useAuth();
  const handleLogout = onLogout || authLogout;

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Scope filter: Programme Manager can filter all views by specific programme or 'ALL'
  const [selectedProgrammeScope, setSelectedProgrammeScope] = useState('ALL');

  // Request Status Filter: Synchronized with Assistance module sidebar tabs
  const [requestStatusFilter, setRequestStatusFilter] = useState('ALL');

  // Facilitation Status Filter: Synchronized with Facilitation sidebar sub-tabs
  const [facilitationStatusFilter, setFacilitationStatusFilter] = useState('pending_pm');

  // Collapsible Accordion States for Sidebar Drawer Sub-menus
  const [isRequestsExpanded, setIsRequestsExpanded] = useState(true);
  const [isFacilitationsExpanded, setIsFacilitationsExpanded] = useState(false);

  // Direct Review State (if navigated from Dashboard Recent Requests)
  const [selectedRequestToReview, setSelectedRequestToReview] = useState(null);

  // Core Data States
  const [requests, setRequests] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [resources, setResources] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [facilitations, setFacilitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Toast alerts
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch all data from database
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const unpack = (res) => (Array.isArray(res) ? res : (res?.data || []));

      const [
        reqsRes,
        bensRes,
        progsRes,
        distsRes,
        actsRes,
        supsRes,
        resRes,
        fbRes,
        facsRes
      ] = await Promise.all([
        db.getAssistanceRequests(),
        db.getBeneficiaries(),
        db.getPrograms(),
        db.getDistributions ? db.getDistributions() : (db.getInterventions ? db.getInterventions() : []),
        db.getFieldActivities ? db.getFieldActivities() : [],
        db.getSupervisors ? db.getSupervisors() : [],
        db.getProgramResources ? db.getProgramResources() : [],
        db.getComplaints ? db.getComplaints() : [],
        db.getFieldFundingRequests ? db.getFieldFundingRequests() : []
      ]);

      const rawRequests = unpack(reqsRes);
      const normalizedRequests = rawRequests.map(r => normalizeAssistanceRequest ? normalizeAssistanceRequest(r) : r);

      setRequests(normalizedRequests);
      setBeneficiaries(unpack(bensRes));
      setProgrammes(unpack(progsRes));
      setDistributions(unpack(distsRes));
      setActivities(unpack(actsRes));
      setSupervisors(unpack(supsRes));
      setResources(unpack(resRes));
      setFeedback(unpack(fbRes));
      setFacilitations(unpack(facsRes));

      const pendingReqCount = normalizedRequests.filter(r => r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'Pending' || r.status === 'Pending Review' || r.status === 'My Decision').length;
      const lowStockCount = unpack(resRes).filter(r => r.is_low_stock || r.status === 'Low Stock' || r.status === 'Critical').length;
      const recentActs = unpack(actsRes);
      const pendingFacsCount = unpack(facsRes).filter(f => f.status === 'Pending Program Manager Approval' || f.stage === 2).length;

      const dynamicNotifs = [];
      if (pendingFacsCount > 0) {
        dynamicNotifs.push({
          id: 'notif-fac-1',
          title: 'Field Facilitations Awaiting PM Sign-Off',
          message: `${pendingFacsCount} supervisor-endorsed field facilitation request${pendingFacsCount > 1 ? 's' : ''} awaiting your authorization for finance disbursement.`,
          type: 'facilitation',
          created_at: new Date().toISOString(),
          read: false
        });
      }
      if (pendingReqCount > 0) {
        dynamicNotifs.push({
          id: 'notif-1',
          title: 'Pending Assistance Requests Require Review',
          message: `${pendingReqCount} aid request${pendingReqCount > 1 ? 's are' : ' is'} awaiting official Programme Manager decision and supervisor allocation.`,
          type: 'request',
          created_at: new Date().toISOString(),
          read: false
        });
      }
      if (lowStockCount > 0) {
        dynamicNotifs.push({
          id: 'notif-2',
          title: 'Warehouse Low-Stock Alert',
          message: `${lowStockCount} humanitarian commodit${lowStockCount > 1 ? 'ies are' : 'y is'} near depletion threshold in depot inventory.`,
          type: 'resource',
          created_at: new Date().toISOString(),
          read: false
        });
      }
      if (recentActs.length > 0) {
        const topAct = recentActs[0];
        dynamicNotifs.push({
          id: 'notif-3',
          title: 'Recent Field Operation Milestone',
          message: `${topAct.title || topAct.activity || 'Field verification activity'} recorded in ${topAct.location || 'field'}.`,
          type: 'activity',
          created_at: topAct.created_at || new Date().toISOString(),
          read: true
        });
      }

      setNotifications(dynamicNotifs);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      showToast('Failed to sync live records with database', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Scope filter applied to records
  const scopedRequests = useMemo(() => {
    if (selectedProgrammeScope === 'ALL') return requests;
    return requests.filter(r => 
      r.program_name === selectedProgrammeScope || 
      r.programme_name === selectedProgrammeScope ||
      r.project_name === selectedProgrammeScope ||
      r.program_id === selectedProgrammeScope ||
      r.project_id === selectedProgrammeScope
    );
  }, [requests, selectedProgrammeScope]);

  const scopedDistributions = useMemo(() => {
    if (selectedProgrammeScope === 'ALL') return distributions;
    return distributions.filter(d => 
      d.program_name === selectedProgrammeScope || 
      d.programme_name === selectedProgrammeScope ||
      d.project_name === selectedProgrammeScope ||
      d.program_id === selectedProgrammeScope ||
      d.project_id === selectedProgrammeScope
    );
  }, [distributions, selectedProgrammeScope]);

  const scopedActivities = useMemo(() => {
    if (selectedProgrammeScope === 'ALL') return activities;
    return activities.filter(a => a.program_name === selectedProgrammeScope || a.programme === selectedProgrammeScope);
  }, [activities, selectedProgrammeScope]);

  const scopedResources = useMemo(() => {
    if (selectedProgrammeScope === 'ALL') return resources;
    return resources.filter(r => r.program_name === selectedProgrammeScope || r.programme === selectedProgrammeScope);
  }, [resources, selectedProgrammeScope]);

  // Request Decision Actions
  const handleApproveRequest = async (requestId, metadata) => {
    try {
      const res = await db.approveAssistanceRequest(requestId, metadata);
      if (res.error) throw res.error;
      showToast(`Request #${requestId} officially approved. Please allocate an available field supervisor.`, 'success');
      loadDashboardData();
    } catch (err) {
      console.error('Approval failed:', err);
      showToast('Error recording approval.', 'error');
      throw err;
    }
  };

  const handleRejectRequest = async (requestId, reason) => {
    try {
      const res = await db.rejectAssistanceRequest(requestId, reason);
      if (res.error) throw res.error;
      showToast(`Request #${requestId} rejected with recorded audit justification.`, 'info');
      loadDashboardData();
    } catch (err) {
      console.error('Rejection failed:', err);
      showToast('Error recording rejection.', 'error');
      throw err;
    }
  };

  const handleRequestInfo = async (requestId, comment) => {
    try {
      const res = await db.requestInfoAssistanceRequest(requestId, comment);
      if (res.error) throw res.error;
      showToast(`Request #${requestId} returned for additional field information.`, 'info');
      loadDashboardData();
    } catch (err) {
      console.error('Request info failed:', err);
      showToast('Error requesting info.', 'error');
      throw err;
    }
  };

  const handleAssignSupervisor = async (requestId, supervisorId, supervisorName, notes) => {
    try {
      const res = await db.assignSupervisorToRequest(requestId, supervisorId, supervisorName, notes);
      if (res.error) throw res.error;
      showToast(`Request #${requestId} assigned to Supervisor ${supervisorName}. Field task created.`, 'success');
      loadDashboardData();
    } catch (err) {
      console.error('Supervisor assignment failed:', err);
      showToast('Error assigning supervisor.', 'error');
      throw err;
    }
  };

  const handleSelectRequestFromOverview = (req) => {
    setSelectedRequestToReview(req);
    setActiveTab('requests');
  };

  const getSupervisorStatus = (r) => {
    return Boolean(
      (r.assigned_supervisor_id && r.assigned_supervisor_id !== 'unassigned') ||
      (r.assigned_supervisor_name && 
       r.assigned_supervisor_name !== 'Unassigned' && 
       !String(r.assigned_supervisor_name).toLowerCase().includes('pending') &&
       r.assigned_supervisor_name !== 'Pending Supervisor')
    );
  };

  const getFieldWorkerStatus = (r) => {
    const rawWorker = r.assigned_field_worker_name || r.field_worker_name || '';
    return Boolean(
      rawWorker && 
      rawWorker !== 'Pending Supervisor Assignment' && 
      rawWorker !== 'Unassigned' && 
      !String(rawWorker).toLowerCase().includes('pending')
    );
  };

  const getAuditFinishedStatus = (r) => {
    if (r.status === 'Rejected' || r.status_label === 'Rejected by PM' || r.returned_to_worker) {
      return false;
    }
    return Boolean(
      r.status === 'Assessment Submitted' ||
      r.status === 'Awaiting Program Manager Decision' ||
      r.status === 'Forwarded to Program Manager' ||
      r.status === 'Completed' ||
      r.status === 'Fulfilled' ||
      (r.assessment_code && r.status !== 'Rejected') ||
      r.is_verified_on_ground === true
    );
  };

  const requestPipelineCounts = useMemo(() => {
    const all = scopedRequests.length;
    const isRejected = (r) => r.status === 'Rejected' || r.status_label === 'Rejected by PM' || r.returned_to_worker;
    const pendingSupervisor = scopedRequests.filter(r => !getSupervisorStatus(r) && !isRejected(r)).length;
    const supervisorAssigned = scopedRequests.filter(r => getSupervisorStatus(r) && !getFieldWorkerStatus(r) && !getAuditFinishedStatus(r) && !isRejected(r)).length;
    const workerInField = scopedRequests.filter(r => getFieldWorkerStatus(r) && !getAuditFinishedStatus(r) && !isRejected(r)).length;
    const auditFinished = scopedRequests.filter(r => getAuditFinishedStatus(r)).length;
    const rejected = scopedRequests.filter(r => isRejected(r)).length;
    const disbursed = scopedRequests.filter(r => (r.status === 'Completed' || r.status === 'Fulfilled' || r.status === 'Disbursed') && !isRejected(r)).length;

    return {
      all,
      pendingSupervisor,
      supervisorAssigned,
      workerInField,
      auditFinished,
      rejected,
      disbursed
    };
  }, [scopedRequests]);

  const facilitationCounts = useMemo(() => {
    const isRej = r => r.status === 'Rejected by Program Manager' || 
                       r.status === 'Rejected' || 
                       r.stage === -1 || 
                       Boolean(r.returned_to_worker) || 
                       (typeof r.status === 'string' && r.status.toLowerCase().includes('reject'));

    const pendingPM = facilitations.filter(
      r => !isRej(r) && (r.status === 'Pending Program Manager Approval' || r.stage === 2 || r.status === 'Endorsed by Supervisor')
    ).length;
    const pendingFinance = facilitations.filter(
      r => !isRej(r) && (r.status === 'Approved (Pending Finance Disbursement)' || r.stage === 3 || r.status === 'Approved by Program Manager')
    ).length;
    const disbursed = facilitations.filter(
      r => !isRej(r) && (r.status === 'Disbursed' || r.stage === 4 || r.status === 'Disbursed / Paid')
    ).length;
    const rejected = facilitations.filter(r => isRej(r)).length;

    return {
      pending_pm: pendingPM,
      approved_pm: pendingFinance,
      disbursed: disbursed,
      rejected: rejected,
      all: facilitations.length
    };
  }, [facilitations]);

  const pendingRequestsCount = requestPipelineCounts.pendingSupervisor;
  const pendingPMFacilitationsCount = facilitationCounts.pending_pm;
  const unreadCount = notifications.filter(n => !n.read).length;

  // Sidebar navigation handler
  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (tabId !== 'requests') {
      setSelectedRequestToReview(null);
    }
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 sm:py-6 flex justify-center items-start font-sans">
      <div className="w-full max-w-md min-h-screen sm:min-h-[860px] bg-slate-100 sm:rounded-[32px] sm:shadow-2xl sm:border-[6px] sm:border-slate-800 relative overflow-hidden flex flex-col border-x border-slate-200">

        {/* Toast Alert Banner */}
        {toastMessage && (
          <div className={`absolute top-4 left-4 right-4 z-70 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-rose-900/95 border-rose-700 text-rose-100 backdrop-blur-md'
              : toastMessage.type === 'info'
              ? 'bg-blue-900/95 border-blue-700 text-blue-100 backdrop-blur-md'
              : 'bg-emerald-900/95 border-emerald-700 text-emerald-100 backdrop-blur-md'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="truncate">{toastMessage.message}</span>
          </div>
        )}

        {/* Mobile Drawer Overlay Backdrop */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 animate-in fade-in duration-150 cursor-pointer"
          />
        )}

        {/* SLIDE-OUT SIDEBAR DRAWER */}
        <aside 
          className={`absolute inset-y-0 left-0 z-50 w-76 max-w-[85%] bg-white flex flex-col shadow-2xl border-r border-slate-200 transition-transform duration-200 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* 1. Drawer Header Brand */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#006B56] text-white flex items-center justify-center font-black text-xs shadow-xs">
                ADRA
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-[#006B56] block leading-tight">
                  ADRA PM App
                </span>
                <span className="text-[10px] text-slate-500 font-semibold block">
                  Programme Management Hub
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Manager Profile Card */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                  {(currentUser?.full_name || currentUser?.name || 'PM')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-xs text-slate-900 block truncate">
                    {currentUser?.full_name || currentUser?.name || 'Grace Ochieng'}
                  </span>
                  <span className="text-[10px] text-purple-700 font-bold block truncate">
                    Programme Manager
                  </span>
                </div>
              </div>
            </div>

            {/* Scope Filter inside drawer */}
            <div className="mt-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1 block mb-1">
                Programme Scope
              </label>
              <div className="relative">
                <select
                  value={selectedProgrammeScope}
                  onChange={(e) => {
                    setSelectedProgrammeScope(e.target.value);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full pl-2.5 pr-7 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#006B56] cursor-pointer appearance-none truncate shadow-2xs"
                >
                  <option value="ALL">All Programmes</option>
                  {programmes.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 3. Navigation List (Streamlined Essential Views) */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1 text-xs font-semibold">
            {/* Overview / Dashboard */}
            <button
              type="button"
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#006B56] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Home className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-[#006B56]'}`} />
                <span>Executive Overview</span>
              </div>
            </button>

            {/* Assistance Requests with Collapsible Pipeline Sub-Filters */}
            <div className="space-y-0.5">
              <div
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                  activeTab === 'requests'
                    ? 'bg-[#006B56] text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div
                  onClick={() => {
                    setRequestStatusFilter('ALL');
                    handleNavClick('requests');
                    setIsRequestsExpanded(true);
                  }}
                  className="flex items-center space-x-2.5 flex-1 min-w-0"
                >
                  <HeartHandshake className={`w-4 h-4 ${activeTab === 'requests' ? 'text-white' : 'text-[#006B56]'}`} />
                  <span className="truncate">Assistance Requests</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {pendingRequestsCount > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      activeTab === 'requests' ? 'bg-white text-[#006B56]' : 'bg-rose-600 text-white shadow-2xs'
                    }`}>
                      {pendingRequestsCount}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRequestsExpanded(prev => !prev);
                    }}
                    className={`p-1 rounded-lg transition hover:bg-black/10 cursor-pointer ${
                      activeTab === 'requests' ? 'text-white' : 'text-slate-400'
                    }`}
                    title={isRequestsExpanded ? 'Collapse sub-filters' : 'Expand sub-filters'}
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isRequestsExpanded ? 'rotate-180' : ''
                    }`} />
                  </button>
                </div>
              </div>

              {/* Collapsible Assistance Request Sub-Filters */}
              {isRequestsExpanded && (
                <div className="pl-6 pr-1 py-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  {[
                    { id: 'ALL', label: 'All Requests', count: requestPipelineCounts.all, color: 'text-slate-800 bg-slate-100' },
                    { id: 'Pending Supervisor', label: 'Pending Supervisor', count: requestPipelineCounts.pendingSupervisor, color: 'text-rose-800 bg-rose-100' },
                    { id: 'Supervisor Assigned', label: 'Supervisor Assigned', count: requestPipelineCounts.supervisorAssigned, color: 'text-amber-800 bg-amber-100' },
                    { id: 'Field Worker Assigned', label: 'Worker in Field', count: requestPipelineCounts.workerInField, color: 'text-blue-800 bg-blue-100' },
                    { id: 'Audit Completed', label: 'Audit Finished', count: requestPipelineCounts.auditFinished, color: 'text-emerald-800 bg-emerald-100' },
                    { id: 'Rejected', label: 'Rejected by PM', count: requestPipelineCounts.rejected, color: 'text-rose-800 bg-rose-100' },
                    { id: 'Disbursed', label: 'Disbursed / Done', count: requestPipelineCounts.disbursed, color: 'text-teal-800 bg-teal-100' }
                  ].map(sub => {
                    const isSubActive = activeTab === 'requests' && (
                      (requestStatusFilter === 'ALL' && sub.id === 'ALL') ||
                      (requestStatusFilter !== 'ALL' && String(requestStatusFilter).toLowerCase() === String(sub.id).toLowerCase())
                    );
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setRequestStatusFilter(sub.id);
                          setActiveTab('requests');
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                          isSubActive
                            ? 'bg-emerald-50 text-[#006B56] font-bold border border-emerald-200 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{sub.label}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-black shrink-0 ${
                          isSubActive ? 'bg-emerald-200/80 text-emerald-950' : sub.color
                        }`}>
                          {sub.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Facilitations Sign-Off with Collapsible Sub-Filters */}
            <div className="space-y-0.5">
              <div
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                  activeTab === 'facilitations'
                    ? 'bg-[#006B56] text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div
                  onClick={() => {
                    setFacilitationStatusFilter('pending_pm');
                    handleNavClick('facilitations');
                    setIsFacilitationsExpanded(true);
                  }}
                  className="flex items-center space-x-2.5 flex-1 min-w-0"
                >
                  <Banknote className={`w-4 h-4 ${activeTab === 'facilitations' ? 'text-white' : 'text-amber-600'}`} />
                  <span className="truncate">Facilitation Sign-Off</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {facilitationCounts.pending_pm > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      activeTab === 'facilitations' ? 'bg-white text-[#006B56]' : 'bg-amber-500 text-slate-950 shadow-2xs'
                    }`}>
                      {facilitationCounts.pending_pm}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFacilitationsExpanded(prev => !prev);
                    }}
                    className={`p-1 rounded-lg transition hover:bg-black/10 cursor-pointer ${
                      activeTab === 'facilitations' ? 'text-white' : 'text-slate-400'
                    }`}
                    title={isFacilitationsExpanded ? 'Collapse sub-filters' : 'Expand sub-filters'}
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isFacilitationsExpanded ? 'rotate-180' : ''
                    }`} />
                  </button>
                </div>
              </div>

              {/* Collapsible Facilitation Sub-Filters */}
              {isFacilitationsExpanded && (
                <div className="pl-6 pr-1 py-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  {[
                    { id: 'pending_pm', label: 'Pending Review', count: facilitationCounts.pending_pm, color: 'text-amber-800 bg-amber-100' },
                    { id: 'approved_pm', label: 'Authorized', count: facilitationCounts.approved_pm, color: 'text-blue-800 bg-blue-100' },
                    { id: 'disbursed', label: 'Disbursed', count: facilitationCounts.disbursed, color: 'text-emerald-800 bg-emerald-100' },
                    { id: 'rejected', label: 'Rejected by PM', count: facilitationCounts.rejected, color: 'text-rose-800 bg-rose-100' },
                    { id: 'all', label: 'All Facilitations', count: facilitationCounts.all, color: 'text-slate-800 bg-slate-100' }
                  ].map(sub => {
                    const isSubActive = activeTab === 'facilitations' && facilitationStatusFilter === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setFacilitationStatusFilter(sub.id);
                          setActiveTab('facilitations');
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                          isSubActive
                            ? 'bg-emerald-50 text-[#006B56] font-bold border border-emerald-200 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{sub.label}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-black shrink-0 ${
                          isSubActive ? 'bg-emerald-200/80 text-emerald-950' : sub.color
                        }`}>
                          {sub.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Programmes */}
            <button
              type="button"
              onClick={() => handleNavClick('programmes')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'programmes'
                  ? 'bg-[#006B56] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Briefcase className={`w-4 h-4 ${activeTab === 'programmes' ? 'text-white' : 'text-slate-500'}`} />
                <span>Programmes Portfolio</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">
                {programmes.length}
              </span>
            </button>

            {/* Field Supervisors */}
            <button
              type="button"
              onClick={() => handleNavClick('supervisors')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'supervisors'
                  ? 'bg-[#006B56] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Users className={`w-4 h-4 ${activeTab === 'supervisors' ? 'text-white' : 'text-slate-500'}`} />
                <span>Field Supervisors</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">
                {supervisors.length}
              </span>
            </button>

            {/* Reports & Analytics (Consolidated Operations Hub) */}
            <button
              type="button"
              onClick={() => handleNavClick('reports')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-[#006B56] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BarChart3 className={`w-4 h-4 ${activeTab === 'reports' ? 'text-white' : 'text-slate-500'}`} />
                <span>Reports & Analytics</span>
              </div>
            </button>

            <div className="pt-2 pb-1 border-t border-slate-100 my-1" />

            {/* Notifications */}
            <button
              type="button"
              onClick={() => handleNavClick('notifications')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-[#006B56] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-white' : 'text-slate-500'}`} />
                <span>Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-rose-500 text-white shadow-2xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Manager Profile & Settings */}
            <button
              type="button"
              onClick={() => handleNavClick('profile')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#006B56] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-white' : 'text-slate-500'}`} />
                <span>Profile & Settings</span>
              </div>
            </button>
          </div>

          {/* 4. Drawer Footer: Switch Role & Logout */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 space-y-2 shrink-0">
            {/* Quick Role Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="w-full py-1.5 px-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-between border border-slate-200 transition cursor-pointer shadow-2xs"
              >
                <span className="flex items-center space-x-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#006B56]" />
                  <span>Switch Role</span>
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleSwitcher && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[9px] uppercase font-black text-slate-400">
                    Switch Operational Role
                  </div>
                  {[
                    { role: 'Program Manager', label: 'Program Manager' },
                    { role: 'Supervisor', label: 'Supervisor' },
                    { role: 'Field Worker', label: 'Field Worker' },
                    { role: 'Beneficiary', label: 'Beneficiary' },
                    { role: 'Finance Officer', label: 'Finance Officer' },
                    { role: 'Administrator', label: 'Administrator' }
                  ].map(r => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={async () => {
                        setShowRoleSwitcher(false);
                        setIsSidebarOpen(false);
                        if (onSwitchRole) {
                          await onSwitchRole(r.role);
                        } else if (quickSwitchRole) {
                          await quickSwitchRole(r.role);
                        }
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer ${
                        r.role === 'Program Manager' ? 'bg-emerald-50 text-[#006B56] font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span>{r.label}</span>
                      {r.role === 'Program Manager' && <span className="w-1.5 h-1.5 rounded-full bg-[#006B56]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Logout Button in Drawer */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* FIXED STICKY MOBILE TOP HEADER */}
        <header className="bg-white px-3.5 py-2.5 border-b border-slate-200 sticky top-0 z-40 shadow-2xs flex items-center justify-between gap-2 shrink-0">
          {/* Left: Menu Hamburger + ADRA Brand / Tab Title */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Hamburger Button - Always available to open sidebar */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 active:scale-95 transition cursor-pointer shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-slate-800" />
            </button>

            {activeTab !== 'dashboard' ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={() => handleNavClick('dashboard')}
                  className="p-1 text-slate-500 hover:text-[#006B56] rounded-lg hover:bg-slate-100 transition cursor-pointer shrink-0"
                  title="Back to Executive Overview"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="font-black text-xs text-slate-900 truncate">
                  {activeTab === 'facilitations'
                    ? 'Field Facilitations'
                    : activeTab === 'requests'
                    ? 'Assistance Requests'
                    : activeTab === 'programmes'
                    ? 'Programmes'
                    : activeTab === 'supervisors'
                    ? 'Supervisors'
                    : activeTab === 'beneficiaries'
                    ? 'Beneficiaries'
                    : activeTab === 'activities'
                    ? 'Field Activities'
                    : activeTab === 'distributions'
                    ? 'Aid Distributions'
                    : activeTab === 'resources'
                    ? 'Resources & Depots'
                    : activeTab === 'reports'
                    ? 'Reports'
                    : activeTab === 'notifications'
                    ? 'Notifications'
                    : activeTab === 'profile'
                    ? 'Profile'
                    : 'ADRA South Sudan'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#006B56] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  A
                </div>
                <div className="min-w-0">
                  <span className="font-black text-sm text-slate-900 tracking-tight leading-none block truncate">
                    ADRA South Sudan
                  </span>
                  <span className="text-[10px] text-[#006B56] font-extrabold uppercase tracking-wider block mt-0.5">
                    Programme Manager
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Controls: Refresh, Notifications, Profile, Logout */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Refresh Button */}
            <button
              type="button"
              onClick={loadDashboardData}
              disabled={isLoading}
              title="Refresh Live Records"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#006B56]' : ''}`} />
            </button>

            {/* Notification Bell with Badge */}
            <button
              type="button"
              onClick={() => handleNavClick('notifications')}
              className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center relative border border-slate-200/80 transition cursor-pointer shadow-2xs shrink-0"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[8px] font-black flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* PM Profile Avatar Button */}
            <button
              type="button"
              onClick={() => handleNavClick('profile')}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0 border ${
                activeTab === 'profile'
                  ? 'bg-[#006B56] text-white border-[#006B56]'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200'
              }`}
              title="Programme Manager Profile"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition active:scale-95 shadow-xs shrink-0 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline font-bold">Logout</span>
            </button>
          </div>
        </header>

        {/* SCROLLABLE MAIN BODY */}
        <main className="flex-1 overflow-y-auto p-3.5 space-y-4 pb-8">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <RefreshCw className="w-7 h-7 animate-spin text-[#006B56]" />
              <p className="font-bold text-xs text-slate-600">Loading ADRA South Sudan Programme Data...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: EXECUTIVE OVERVIEW */}
              {activeTab === 'dashboard' && (
                <PMOverviewView
                  requests={scopedRequests}
                  programmes={programmes}
                  beneficiaries={beneficiaries}
                  distributions={scopedDistributions}
                  activities={scopedActivities}
                  resources={scopedResources}
                  facilitations={facilitations}
                  supervisors={supervisors}
                  onSelectRequest={handleSelectRequestFromOverview}
                  onNavigateTab={(tab) => handleNavClick(tab)}
                />
              )}

              {/* TAB: FIELD FACILITATIONS SIGN-OFF */}
              {activeTab === 'facilitations' && (
                <PMFacilitationsView
                  requests={facilitations}
                  pmName={currentUser?.full_name || currentUser?.name || 'Grace Ochieng'}
                  activeFilter={facilitationStatusFilter}
                  onFilterChange={setFacilitationStatusFilter}
                  onOpenSidebar={() => setIsSidebarOpen(true)}
                  onRefresh={loadDashboardData}
                  onBack={() => handleNavClick('dashboard')}
                />
              )}

              {/* TAB 2: ASSISTANCE REQUESTS */}
              {activeTab === 'requests' && (
                <PMAssistanceRequestsView
                  requests={scopedRequests}
                  beneficiaries={beneficiaries}
                  supervisors={supervisors}
                  programmes={programmes}
                  currentUser={currentUser}
                  onApproveRequest={handleApproveRequest}
                  onRejectRequest={handleRejectRequest}
                  onRequestInfo={handleRequestInfo}
                  onAssignSupervisor={handleAssignSupervisor}
                  selectedRequestToReview={selectedRequestToReview}
                  onClearSelectedRequest={() => setSelectedRequestToReview(null)}
                  initialStatusFilter={requestStatusFilter}
                  onStatusFilterChange={(newStatus) => setRequestStatusFilter(newStatus)}
                />
              )}

              {/* TAB 3: PROGRAMMES PORTFOLIO */}
              {activeTab === 'programmes' && (
                <PMProgrammesView
                  programmes={programmes}
                  requests={requests}
                  resources={resources}
                  onSelectProgramme={(p) => setSelectedProgrammeScope(p.name)}
                />
              )}

              {/* TAB 4: FIELD SUPERVISORS */}
              {activeTab === 'supervisors' && (
                <PMSupervisorsView
                  supervisors={supervisors}
                  programmes={programmes}
                />
              )}

              {/* TAB 5: BENEFICIARY REGISTRY */}
              {activeTab === 'beneficiaries' && (
                <PMBeneficiariesView
                  beneficiaries={beneficiaries}
                  requests={requests}
                  programmes={programmes}
                  onSelectRequest={handleSelectRequestFromOverview}
                />
              )}

              {/* TAB 6: FIELD ACTIVITIES */}
              {activeTab === 'activities' && (
                <PMFieldActivitiesView
                  activities={scopedActivities}
                  requests={requests}
                  programmes={programmes}
                />
              )}

              {/* TAB 7: AID DISTRIBUTIONS */}
              {activeTab === 'distributions' && (
                <PMAidDistributionsView
                  distributions={scopedDistributions}
                  requests={requests}
                  programmes={programmes}
                />
              )}

              {/* TAB 8: RESOURCES & DEPOTS */}
              {activeTab === 'resources' && (
                <PMResourcesView
                  resources={scopedResources}
                  programmes={programmes}
                />
              )}

              {/* TAB 9: REPORTS & EXPORTS */}
              {activeTab === 'reports' && (
                <PMReportsView
                  requests={scopedRequests}
                  beneficiaries={beneficiaries}
                  distributions={scopedDistributions}
                  programmes={programmes}
                  resources={scopedResources}
                  supervisors={supervisors}
                  feedback={feedback}
                  activities={scopedActivities}
                />
              )}

              {/* TAB 10: NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <PMNotificationsView
                  notifications={notifications}
                  onMarkAllAsRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                  onNavigateTab={(tab) => handleNavClick(tab)}
                />
              )}

              {/* TAB 11: PROFILE & SETTINGS */}
              {activeTab === 'profile' && (
                <PMProfileView
                  currentUser={currentUser}
                  programmes={programmes}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default ProgrammeManagerDashboard;
