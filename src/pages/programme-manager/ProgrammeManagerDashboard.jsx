import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Layers,
  Activity,
  Truck,
  UserCheck,
  Package,
  BarChart3,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  Building,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { db, normalizeAssistanceRequest } from '../../lib/supabase';
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
  // Navigation State - 13 Sidebar Items
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

      // Mock real notifications for PM
      const pendingReqCount = normalizedRequests.filter(r => r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'Pending').length;
      const lowStockCount = unpack(resRes).filter(r => r.is_low_stock || r.status === 'Low Stock').length;

      setNotifications([
        {
          id: 'notif-1',
          title: 'Pending Assistance Requests Require Review',
          message: `${pendingReqCount} aid requests are awaiting official Programme Manager review and supervisor task allocation.`,
          type: 'request',
          created_at: new Date().toISOString(),
          read: false
        },
        {
          id: 'notif-2',
          title: 'Warehouse Low-Stock Alert',
          message: `${lowStockCount || 2} key humanitarian commodities are near depletion threshold in Kapoeta Depot.`,
          type: 'resource',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          read: false
        },
        {
          id: 'notif-3',
          title: 'Field Verification Milestone Completed',
          message: 'Supervisor David Deng completed 5 household verification visits in Kapoeta South.',
          type: 'activity',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          read: true
        }
      ]);
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
      showToast(`Request #${requestId} assigned to Supervisor ${supervisorName}. Field implementation task created.`, 'success');
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

  // Nav helper for Overview Quick Actions
  const handleSelectRequestFromOverview = (req) => {
    setSelectedRequestToReview(req);
    setActiveTab('requests');
  };

  // 13 Sidebar Navigation Items Configuration
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'requests', label: 'Assistance Requests', icon: FileText, badge: scopedRequests.filter(r => r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'Pending').length },
    { id: 'beneficiaries', label: 'Beneficiaries', icon: Users },
    { id: 'programmes', label: 'Programmes', icon: Layers },
    { id: 'activities', label: 'Field Activities', icon: Activity },
    { id: 'distributions', label: 'Aid Distributions', icon: Truck },
    { id: 'supervisors', label: 'Supervisors', icon: UserCheck },
    { id: 'resources', label: 'Resources', icon: Package, badge: scopedResources.filter(r => r.is_low_stock).length ? 'Alert' : null, badgeAlert: true },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, badge: feedback.filter(f => f.status === 'Pending').length },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.filter(n => !n.read).length },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'logout', label: 'Logout', icon: LogOut, isDanger: true }
  ];

  const handleSidebarClick = (itemId) => {
    if (itemId === 'logout') {
      if (onLogout) onLogout();
      return;
    }
    setActiveTab(itemId);
    setIsMobileMenuOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-70 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200 ${
          toastMessage.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : toastMessage.type === 'info'
            ? 'bg-blue-50 border-blue-200 text-blue-800'
            : 'bg-emerald-50 border-emerald-300 text-emerald-900'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {toastMessage.message}
        </div>
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 text-slate-800 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 shadow-xs ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header / ADRA Logo */}
        <div>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#006B56] flex items-center justify-center font-black text-white tracking-wider text-base shadow-sm">
                A
              </div>
              <div>
                <h1 className="font-black text-sm tracking-tight text-slate-900 leading-none">
                  ADRA South Sudan
                </h1>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 font-bold tracking-wide uppercase px-2 py-0.5 rounded-full inline-block mt-1">
                  Programme Manager
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Brief Bar */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3 text-xs">
            <div className="w-8 h-8 rounded-full bg-[#006B56] text-white font-black flex items-center justify-center text-xs shadow-xs">
              GO
            </div>
            <div className="overflow-hidden">
              <div className="font-extrabold text-slate-900 truncate text-xs">{currentUser?.name || 'Grace Ochieng'}</div>
              <div className="text-[11px] text-[#006B56] font-bold truncate">Emergency Programs</div>
            </div>
          </div>

          {/* Navigation Links - 13 Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Programme Operations
            </p>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSidebarClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all text-left ${
                    isActive
                      ? 'bg-[#006B56] text-white font-extrabold shadow-sm'
                      : item.isDanger
                      ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold mt-2 border-t border-slate-100 pt-3'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.isDanger ? 'text-rose-500' : 'text-[#006B56]'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge !== null && item.badge !== 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      item.badgeAlert
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 font-semibold text-center">
          <span>ADRA HMS v2.4 • South Sudan Mission</span>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP NAVIGATION BAR */}
        <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between gap-4 shrink-0 shadow-xs">
          {/* Left: Mobile Toggle & Programme Scope Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Scope Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Scope:</span>
              <div className="relative">
                <select
                  value={selectedProgrammeScope}
                  onChange={(e) => setSelectedProgrammeScope(e.target.value)}
                  className="pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#006B56] cursor-pointer appearance-none"
                >
                  <option value="ALL">All My Programmes ({programmes.length})</option>
                  {programmes.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Right: Quick Notifications Bell, Refresh, and User Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              title="Refresh Live Data"
              className="p-2 text-slate-500 hover:text-[#006B56] hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#006B56]' : ''}`} />
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 text-slate-600 hover:text-[#006B56] hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {/* User Chip */}
            <div
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-[#006B56] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                GO
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-none">Grace Ochieng</div>
                <div className="text-[10px] text-[#006B56] font-semibold mt-0.5">Programme Manager</div>
              </div>
            </div>
          </div>
        </header>

        {/* DYNAMIC SUB-VIEW RENDERER */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-[#006B56] mb-3" />
              <p className="font-semibold text-sm text-slate-600">Syncing ADRA South Sudan Programme Records...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <PMOverviewView
                  requests={scopedRequests}
                  programmes={programmes}
                  beneficiaries={beneficiaries}
                  distributions={scopedDistributions}
                  activities={scopedActivities}
                  onSelectRequest={handleSelectRequestFromOverview}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

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

              {activeTab === 'beneficiaries' && (
                <PMBeneficiariesView
                  beneficiaries={beneficiaries}
                  requests={requests}
                  programmes={programmes}
                  onSelectRequest={handleSelectRequestFromOverview}
                />
              )}

              {activeTab === 'programmes' && (
                <PMProgrammesView
                  programmes={programmes}
                  requests={requests}
                  resources={resources}
                  onSelectProgramme={(p) => setSelectedProgrammeScope(p.name)}
                />
              )}

              {activeTab === 'activities' && (
                <PMFieldActivitiesView
                  activities={scopedActivities}
                  requests={requests}
                  programmes={programmes}
                />
              )}

              {activeTab === 'distributions' && (
                <PMAidDistributionsView
                  distributions={scopedDistributions}
                  requests={requests}
                  programmes={programmes}
                />
              )}

              {activeTab === 'supervisors' && (
                <PMSupervisorsView
                  supervisors={supervisors}
                  programmes={programmes}
                />
              )}

              {activeTab === 'resources' && (
                <PMResourcesView
                  resources={scopedResources}
                  programmes={programmes}
                />
              )}

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

              {activeTab === 'feedback' && (
                <PMFeedbackView
                  feedback={feedback}
                  programmes={programmes}
                  currentUser={currentUser}
                  onRespondFeedback={handleRespondFeedback}
                />
              )}

              {activeTab === 'notifications' && (
                <PMNotificationsView
                  notifications={notifications}
                  onMarkAllAsRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

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
