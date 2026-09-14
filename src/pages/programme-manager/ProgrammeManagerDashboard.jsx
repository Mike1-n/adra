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
  Sparkles
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

export function ProgrammeManagerDashboard({
  currentUser,
  onLogout,
  onSwitchRole
}) {
  const { logout: authLogout } = useAuth();
  const handleLogout = onLogout || authLogout;

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable sections state for sidebar
  const [expandedSections, setExpandedSections] = useState({
    programmes: true,
    assistance: true,
    field: false,
    resources: false
  });

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Scope filter: Programme Manager can filter all views by specific programme or 'ALL'
  const [selectedProgrammeScope, setSelectedProgrammeScope] = useState('ALL');

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
        fbRes
      ] = await Promise.all([
        db.getAssistanceRequests(),
        db.getBeneficiaries(),
        db.getPrograms(),
        db.getDistributions ? db.getDistributions() : (db.getInterventions ? db.getInterventions() : []),
        db.getFieldActivities ? db.getFieldActivities() : [],
        db.getSupervisors ? db.getSupervisors() : [],
        db.getProgramResources ? db.getProgramResources() : [],
        db.getComplaints ? db.getComplaints() : []
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

      const pendingReqCount = normalizedRequests.filter(r => r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'Pending' || r.status === 'Pending Review' || r.status === 'My Decision').length;
      const lowStockCount = unpack(resRes).filter(r => r.is_low_stock || r.status === 'Low Stock' || r.status === 'Critical').length;
      const recentActs = unpack(actsRes);

      const dynamicNotifs = [];
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

  const handleRespondFeedback = async (feedbackId, response, responderName) => {
    try {
      const res = await db.respondToComplaint(feedbackId, response, responderName);
      if (res.error) throw res.error;
      showToast(`Feedback #${feedbackId} resolution recorded and saved to audit log.`, 'success');
      loadDashboardData();
    } catch (err) {
      console.error('Feedback response failed:', err);
      showToast('Error responding to feedback.', 'error');
      throw err;
    }
  };

  const handleSelectRequestFromOverview = (req) => {
    setSelectedRequestToReview(req);
    setActiveTab('requests');
  };

  const pendingRequestsCount = scopedRequests.filter(
    r => r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'Pending' || r.status === 'Pending Review' || r.status === 'My Decision'
  ).length;

  const unreadCount = notifications.filter(n => !n.read).length;

  // Sidebar navigation handler
  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileDrawerOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-70 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200 max-w-sm ${
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

      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* FIXED LEFT SIDEBAR (260px wide, 100vh) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:static md:translate-x-0 shadow-sm ${
        isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Top Branding (ADRA South Sudan) */}
          <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#006B56] text-white flex items-center justify-center font-black text-base shadow-sm">
                A
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 leading-none">
                  ADRA
                </span>
                <span className="text-[11px] text-[#006B56] font-bold mt-0.5">
                  South Sudan
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info Bar */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-3 text-xs">
            <div className="w-8 h-8 rounded-full bg-[#006B56] text-white font-bold flex items-center justify-center text-xs shadow-2xs">
              PD
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="font-extrabold text-slate-900 truncate text-xs">Peter Deng</div>
              <div className="text-[10px] text-[#006B56] font-semibold truncate">Program Manager</div>
            </div>
          </div>

          {/* Main Navigation Items (High Contrast & Clear Active Visibility) */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-250px)] text-xs">
            
            {/* 1. Dashboard */}
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#006B56] text-white font-black shadow-sm ring-1 ring-[#006B56]'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Home className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-[#006B56]'}`} />
                <span className={activeTab === 'dashboard' ? 'text-white font-black' : ''}>Dashboard</span>
              </div>
            </button>

            {/* 2. Programmes (Expandable) */}
            <div>
              <button
                onClick={() => toggleSection('programmes')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'programmes' || activeTab === 'programmes_performance'
                    ? 'text-[#006B56] bg-emerald-50 border border-emerald-300/90 font-black shadow-2xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-[#006B56]" />
                  <span>Programmes</span>
                </div>
                {expandedSections.programmes ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {expandedSections.programmes && (
                <div className="pl-4 pr-1 py-1 space-y-1 mt-1 border-l-2 border-emerald-400 ml-4">
                  <button
                    onClick={() => handleNavClick('programmes')}
                    className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeTab === 'programmes'
                        ? 'bg-[#006B56] text-white font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    Active Programmes
                  </button>
                  <button
                    onClick={() => handleNavClick('programmes_performance')}
                    className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeTab === 'programmes_performance'
                        ? 'bg-[#006B56] text-white font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    Programme Performance
                  </button>
                </div>
              )}
            </div>

            {/* 3. Assistance (Expandable) */}
            <div>
              <button
                onClick={() => toggleSection('assistance')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'requests'
                    ? 'text-[#006B56] bg-emerald-50 border border-emerald-300/90 font-black shadow-2xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <HeartHandshake className="w-4 h-4 text-[#006B56]" />
                  <span>Assistance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white">
                    {pendingRequestsCount}
                  </span>
                  {expandedSections.assistance ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
              </button>

              {expandedSections.assistance && (
                <div className="pl-4 pr-1 py-1 space-y-1 mt-1 border-l-2 border-emerald-400 ml-4">
                  <button
                    onClick={() => handleNavClick('requests')}
                    className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                      activeTab === 'requests'
                        ? 'bg-[#006B56] text-white font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    <span>Assistance Requests</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      activeTab === 'requests' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {pendingRequestsCount}
                    </span>
                  </button>
                  <button
                    onClick={() => handleNavClick('requests')}
                    className="w-full text-left py-2 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Assessments
                  </button>
                  <button
                    onClick={() => handleNavClick('requests')}
                    className="w-full text-left py-2 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Approvals
                  </button>
                </div>
              )}
            </div>

            {/* 4. Field Operations (Expandable) */}
            <div>
              <button
                onClick={() => toggleSection('field')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'activities' || activeTab === 'supervisors' || activeTab === 'beneficiaries'
                    ? 'text-[#006B56] bg-emerald-50 border border-emerald-300/90 font-black shadow-2xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#006B56]" />
                  <span>Field Operations</span>
                </div>
                {expandedSections.field ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {expandedSections.field && (
                <div className="pl-4 pr-1 py-1 space-y-1 mt-1 border-l-2 border-emerald-400 ml-4">
                  <button
                    onClick={() => handleNavClick('activities')}
                    className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeTab === 'activities'
                        ? 'bg-[#006B56] text-white font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    Field Activity
                  </button>
                  <button
                    onClick={() => handleNavClick('supervisors')}
                    className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeTab === 'supervisors'
                        ? 'bg-[#006B56] text-white font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    Field Workers / Supervisors
                  </button>
                  <button
                    onClick={() => handleNavClick('beneficiaries')}
                    className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeTab === 'beneficiaries'
                        ? 'bg-[#006B56] text-white font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    Beneficiary Registry
                  </button>
                </div>
              )}
            </div>

            {/* 5. Resources (Expandable) */}
            <div>
              <button
                onClick={() => toggleSection('resources')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'resources'
                    ? 'text-[#006B56] bg-emerald-50 border border-emerald-300/90 font-black shadow-2xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-[#006B56]" />
                  <span>Resources</span>
                </div>
                {expandedSections.resources ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {expandedSections.resources && (
                <div className="pl-4 pr-1 py-1 space-y-1 mt-1 border-l-2 border-emerald-400 ml-4">
                  <button
                    onClick={() => handleNavClick('resources')}
                    className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeTab === 'resources'
                        ? 'bg-[#006B56] text-white font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    Resource Allocation
                  </button>
                  <button
                    onClick={() => handleNavClick('resources')}
                    className="w-full text-left py-2 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Resource Utilization
                  </button>
                </div>
              )}
            </div>

            {/* 6. Reports */}
            <button
              onClick={() => handleNavClick('reports')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-[#006B56] text-white font-black shadow-sm ring-1 ring-[#006B56]'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className={`w-4 h-4 ${activeTab === 'reports' ? 'text-white' : 'text-[#006B56]'}`} />
                <span className={activeTab === 'reports' ? 'text-white font-black' : ''}>Reports</span>
              </div>
            </button>

            {/* 7. Notifications (with Badge) */}
            <button
              onClick={() => handleNavClick('notifications')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-[#006B56] text-white font-black shadow-sm ring-1 ring-[#006B56]'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-white' : 'text-[#006B56]'}`} />
                <span className={activeTab === 'notifications' ? 'text-white font-black' : ''}>Notifications</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'notifications' ? 'bg-white/25 text-white' : 'bg-rose-500 text-white'
              }`}>
                {unreadCount}
              </span>
            </button>
          </nav>
        </div>

        {/* Bottom Navigation in Sidebar (Help & Support, Profile, Logout) */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-1 text-xs">
          <button
            onClick={() => handleNavClick('profile')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-white hover:text-slate-900 font-semibold transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Help & Support</span>
          </button>

          <button
            onClick={() => handleNavClick('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
              activeTab === 'profile' ? 'bg-[#006B56] text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-white hover:text-slate-900'
            }`}
          >
            <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-white' : 'text-slate-500'}`} />
            <span className={activeTab === 'profile' ? 'text-white font-bold' : ''}>Profile</span>
          </button>

          {onSwitchRole && (
            <button
              onClick={() => onSwitchRole('Administrator')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-white hover:text-slate-900 font-semibold transition"
            >
              <ShieldCheck className="w-4 h-4 text-[#006B56]" />
              <span>Admin Mode</span>
            </button>
          )}

          <button
            onClick={() => onLogout && onLogout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP HEADER */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4 shrink-0">
          {/* MOBILE VIEW (<md): Organization Name + Hamburger */}
          <div className="flex md:hidden items-center gap-2.5 min-w-0">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-2 -ml-1 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 active:scale-95 transition"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#006B56] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                A
              </div>
              <div className="min-w-0">
                <span className="font-black text-sm text-slate-900 tracking-tight leading-none block truncate">
                  ADRA South Sudan
                </span>
                <span className="text-[10px] text-[#006B56] font-extrabold uppercase tracking-wider block mt-0.5">
                  Program Manager
                </span>
              </div>
            </div>
          </div>

          {/* DESKTOP VIEW (>=md): Title & Welcome Greeting */}
          <div className="hidden md:flex items-center gap-3 min-w-0">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Good morning, {currentUser?.full_name?.split(' ')[0] || currentUser?.name?.split(' ')[0] || 'Manager'}
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Here's what's happening across your programmes in South Sudan.
              </p>
            </div>
          </div>

          {/* DESKTOP CONTROLS (>=md: Search, Scope, Refresh, Profile) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Global Search Bar */}
            <div className="relative w-48 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search requests, programmes..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#006B56] transition font-medium"
              />
            </div>

            {/* Scope Filter Pill */}
            <div className="relative">
              <select
                value={selectedProgrammeScope}
                onChange={(e) => setSelectedProgrammeScope(e.target.value)}
                className="pl-2.5 pr-7 py-2 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#006B56] cursor-pointer appearance-none max-w-[150px] truncate"
              >
                <option value="ALL">All Programmes</option>
                {programmes.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Live Sync Refresh */}
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              title="Refresh Live Data"
              className="p-2 text-slate-500 hover:text-[#006B56] hover:bg-slate-100 rounded-xl transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#006B56]' : ''}`} />
            </button>

            {/* Notification Button */}
            <button
              onClick={() => handleNavClick('notifications')}
              className={`relative p-2 rounded-xl transition ${
                activeTab === 'notifications' ? 'bg-[#006B56] text-white' : 'text-slate-600 hover:text-[#006B56] hover:bg-slate-100'
              }`}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile Avatar Chip */}
            <div
              onClick={() => handleNavClick('profile')}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer hover:opacity-80 transition"
              title="View Programme Manager Profile"
            >
              <div className="w-8 h-8 rounded-full bg-[#006B56] text-white font-bold flex items-center justify-center text-xs">
                {(currentUser?.full_name || currentUser?.name || 'PM')
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-none">
                  {currentUser?.full_name || currentUser?.name || currentUser?.email?.split('@')[0] || 'Program Manager'}
                </div>
                <div className="text-[10px] text-[#006B56] font-semibold mt-0.5">
                  {currentUser?.role || 'Program Manager'}
                </div>
              </div>
            </div>

            {/* Prominent Header Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer ml-1"
              title="Logout of ADRA"
            >
              <LogOut className="w-3.5 h-3.5 text-white" />
              <span className="font-bold">Logout</span>
            </button>
          </div>

          {/* MOBILE RIGHT CONTROLS (<md): Notification, Profile & Logout Buttons */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleNavClick('notifications')}
              className="relative p-2 text-slate-700 hover:text-[#006B56] hover:bg-slate-100 rounded-xl transition active:scale-95"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Mobile Profile Icon Button */}
            <button
              type="button"
              onClick={() => handleNavClick('profile')}
              className={`p-2 rounded-xl transition active:scale-95 ${
                activeTab === 'profile' ? 'bg-[#006B56] text-white' : 'text-slate-700 hover:text-[#006B56] hover:bg-slate-100'
              }`}
              title="My Profile"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Mobile Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-white" />
              <span className="font-bold text-xs">Logout</span>
            </button>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-[#006B56] mb-3" />
              <p className="font-bold text-xs text-slate-600">Loading ADRA South Sudan Programme Data...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD COMMAND CENTER */}
              {activeTab === 'dashboard' && (
                <PMOverviewView
                  requests={scopedRequests}
                  programmes={programmes}
                  beneficiaries={beneficiaries}
                  distributions={scopedDistributions}
                  activities={scopedActivities}
                  resources={scopedResources}
                  onSelectRequest={handleSelectRequestFromOverview}
                  onNavigateTab={(tab) => handleNavClick(tab)}
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
                />
              )}

              {/* TAB 3: ACTIVE PROGRAMMES & PERFORMANCE */}
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

              {/* TAB 8: RESOURCES & WAREHOUSES */}
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
