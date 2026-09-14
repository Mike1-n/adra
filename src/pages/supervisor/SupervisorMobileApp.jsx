import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  FileCheck,
  UserCheck,
  History,
  Bell,
  LogOut,
  Shield,
  ArrowRightLeft,
  ChevronDown,
  MapPin,
  Menu,
  X,
  User,
  Settings,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

// Supervisor Subviews
import { SupervisorDashboardView } from './components/SupervisorDashboardView';
import { SupervisorAssignmentsView } from './components/SupervisorAssignmentsView';
import { SupervisorAssignmentDetailsView } from './components/SupervisorAssignmentDetailsView';
import { SupervisorTeamView } from './components/SupervisorTeamView';
import { SupervisorWorkerDetailsView } from './components/SupervisorWorkerDetailsView';
import { SupervisorReportReviewView } from './components/SupervisorReportReviewView';
import { SupervisorBeneficiariesView } from './components/SupervisorBeneficiariesView';
import { SupervisorNotificationsView } from './components/SupervisorNotificationsView';
import { SupervisorActivityHistoryView } from './components/SupervisorActivityHistoryView';
import { SupervisorProfileView } from './components/SupervisorProfileView';

export function SupervisorMobileApp({
  currentUser,
  onLogout,
  onSwitchRole,
  onBackToFieldApp
}) {
  const { logout, quickSwitchRole } = useAuth();
  const toast = useToast();

  // Navigation states: 'dashboard' | 'assignments' | 'team' | 'reports' | 'beneficiaries' | 'activities' | 'profile'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Auxiliary subview state: null | 'assignment_details' | 'worker_details' | 'report_review' | 'notifications' | 'profile'
  const [activeSubview, setActiveSubview] = useState(null);

  // Selected item targets
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState(null);

  // Data state
  const [assignments, setAssignments] = useState([]);
  const [fieldWorkers, setFieldWorkers] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [allSupervisors, setAllSupervisors] = useState([]);
  const [activeSupervisor, setActiveSupervisor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mobile Drawer State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showStateMenu, setShowStateMenu] = useState(false);

  // Load all supervisory data
  const loadData = async (targetSupervisor = null) => {
    try {
      setLoading(true);
      const sups = await db.getSupervisors();
      setAllSupervisors(sups || []);

      const effectiveSupervisor = targetSupervisor || activeSupervisor || (
        sups.find(s => s.email?.toLowerCase() === currentUser?.email?.toLowerCase() || s.id === currentUser?.id) || sups[0]
      );
      setActiveSupervisor(effectiveSupervisor);

      const supervisorId = effectiveSupervisor?.id || currentUser?.id || 'sup-1';

      const [
        assignsData,
        workersData,
        assessData,
        notifsData,
        actsData,
        bensData
      ] = await Promise.all([
        db.getSupervisorAssignments(supervisorId),
        db.getFieldWorkers(supervisorId),
        db.getFieldAssessments(supervisorId),
        db.getSupervisorNotifications(supervisorId),
        db.getSupervisorActivityHistory(supervisorId),
        db.getBeneficiaries()
      ]);

      setAssignments(assignsData || []);
      setFieldWorkers(workersData || []);
      setAssessments(assessData || []);
      setNotifications(notifsData || []);
      setActivities(actsData || []);
      setBeneficiaries(bensData || []);
    } catch (err) {
      console.error('Error loading supervisor mobile data:', err);
      toast.error('Failed to load supervisor data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Handler: Change active state supervisor
  const handleSelectStateSupervisor = (sup) => {
    setActiveSupervisor(sup);
    setShowStateMenu(false);
    loadData(sup);
    toast.success(`Switched to ${sup.state} State Hub: ${sup.name}`);
  };

  // Handler: Assign Field Worker to Request
  const handleAssignFieldWorker = async (requestId, fieldWorkerId, fieldWorkerName, notes, dueDate) => {
    await db.assignFieldWorkerToRequest(
      requestId,
      fieldWorkerId,
      fieldWorkerName,
      notes,
      dueDate,
      activeSupervisor?.name || currentUser?.full_name || 'Emmanuel Adeyemi'
    );
    await loadData(activeSupervisor);
  };

  // Handler: Reassign Field Worker
  const handleReassignWorker = async (requestId, newWorkerId, newWorkerName, reason) => {
    await db.reassignFieldWorker(
      requestId,
      newWorkerId,
      newWorkerName,
      reason,
      activeSupervisor?.name || currentUser?.full_name || 'Emmanuel Adeyemi'
    );
    await loadData(activeSupervisor);
  };

  // Handler: Forward Assessment to Program Manager
  const handleForwardToPM = async (assessmentId, notes) => {
    await db.forwardAssessmentToPM(
      assessmentId,
      notes,
      activeSupervisor?.name || currentUser?.full_name || 'Emmanuel Adeyemi'
    );
    await loadData(activeSupervisor);
    setActiveSubview(null);
  };

  // Handler: Request Correction from Field Worker
  const handleRequestCorrection = async (assessmentId, reason) => {
    await db.requestAssessmentCorrection(
      assessmentId,
      reason,
      activeSupervisor?.name || currentUser?.full_name || 'Emmanuel Adeyemi'
    );
    await loadData(activeSupervisor);
    setActiveSubview(null);
  };

  // Handler: Add supervisory comment/note
  const handleAddComment = async (assessmentId, comment) => {
    await db.addSupervisorAssessmentComment(
      assessmentId,
      comment,
      activeSupervisor?.name || currentUser?.full_name || 'Emmanuel Adeyemi'
    );
    await loadData(activeSupervisor);
  };

  // Handler: Update Profile
  const handleUpdateProfile = async (id, data) => {
    await db.updateUser(id, data);
    await loadData(activeSupervisor);
  };

  // Unread notifications count
  const unreadNotifsCount = notifications.filter(n => !n.is_read).length;
  const pendingAssignmentsCount = assignments.filter(
    a => !a.assigned_field_worker_name || 
         a.assigned_field_worker_name.includes('Pending') || 
         a.status === 'Assigned to Supervisor'
  ).length;
  const pendingReportsCount = assessments.filter(
    a => a.status === 'Under Supervisor Review' || a.status === 'Submitted'
  ).length;

  // Render Subview or Tab Content
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-500">Loading supervisory records...</p>
        </div>
      );
    }

    // Detail Subviews
    if (activeSubview === 'assignment_details' && selectedAssignment) {
      return (
        <div className="p-4">
          <SupervisorAssignmentDetailsView
            assignment={selectedAssignment}
            fieldWorkers={fieldWorkers}
            onBack={() => setActiveSubview(null)}
            onAssignWorker={handleAssignFieldWorker}
            onReassignWorker={handleReassignWorker}
            onOpenReport={(item) => {
              const ass = assessments.find(a => a.request_id === item.id || a.request_code === item.request_code);
              if (ass) {
                setSelectedAssessment(ass);
                setActiveSubview('report_review');
              }
            }}
          />
        </div>
      );
    }

    if (activeSubview === 'worker_details' && selectedWorker) {
      return (
        <div className="p-4">
          <SupervisorWorkerDetailsView
            worker={selectedWorker}
            assignments={assignments.filter(a => a.assigned_field_worker_id === selectedWorker.id || a.assigned_field_worker_name === selectedWorker.name)}
            onBack={() => setActiveSubview(null)}
            onStatusChange={async (workerId, newStatus) => {
              await db.updateFieldWorkerStatus(workerId, newStatus);
              await loadData(activeSupervisor);
            }}
          />
        </div>
      );
    }

    if (activeSubview === 'report_review' && selectedAssessment) {
      return (
        <div className="p-4">
          <SupervisorReportReviewView
            assessments={assessments}
            activeAssessment={selectedAssessment}
            onBack={() => setActiveSubview(null)}
            onForwardToPM={handleForwardToPM}
            onRequestCorrection={handleRequestCorrection}
            onAddComment={handleAddComment}
          />
        </div>
      );
    }

    if (activeSubview === 'notifications') {
      return (
        <div className="p-4">
          <SupervisorNotificationsView
            notifications={notifications}
            onBack={() => setActiveSubview(null)}
            onMarkAsRead={async (id) => {
              await db.markSupervisorNotificationRead(id);
              await loadData(activeSupervisor);
            }}
            onSelectNotification={(n) => {
              if (n.link_id?.startsWith('ADR-REQ-')) {
                const found = assignments.find(a => a.request_code === n.link_id);
                if (found) {
                  setSelectedAssignment(found);
                  setActiveSubview('assignment_details');
                }
              } else if (n.link_id?.startsWith('FA-')) {
                const foundAss = assessments.find(a => a.assessment_code === n.link_id);
                if (foundAss) {
                  setSelectedAssessment(foundAss);
                  setActiveSubview('report_review');
                }
              }
            }}
          />
        </div>
      );
    }

    if (activeSubview === 'profile') {
      return (
        <div className="p-4">
          <SupervisorProfileView
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
            onBack={() => setActiveSubview(null)}
          />
        </div>
      );
    }

    // Main Tabs
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-4">
            <SupervisorDashboardView
              supervisorName={activeSupervisor?.name || currentUser?.full_name || 'Emmanuel Adeyemi'}
              operationalArea={activeSupervisor?.assigned_area || activeSupervisor?.state || 'Eastern Equatoria State'}
              programmeSector="Emergency Response & Humanitarian Operations"
              assignments={assignments}
              fieldWorkers={fieldWorkers}
              assessments={assessments}
              activities={activities}
              onNavigateTab={(tab) => {
                setActiveSubview(null);
                setActiveTab(tab);
              }}
              onSelectAssignment={(item) => {
                setSelectedAssignment(item);
                setActiveSubview('assignment_details');
              }}
              onSelectWorker={(worker) => {
                setSelectedWorker(worker);
                setActiveSubview('worker_details');
              }}
              onSelectAssessment={(ass) => {
                setSelectedAssessment(ass);
                setActiveSubview('report_review');
              }}
            />
          </div>
        );

      case 'assignments':
        return (
          <div className="p-4">
            <SupervisorAssignmentsView
              assignments={assignments}
              fieldWorkers={fieldWorkers}
              onSelectAssignment={(item) => {
                setSelectedAssignment(item);
                setActiveSubview('assignment_details');
              }}
              onAssignFieldWorker={handleAssignFieldWorker}
              onOpenReport={(item) => {
                const ass = assessments.find(a => a.request_id === item.id || a.request_code === item.request_code);
                if (ass) {
                  setSelectedAssessment(ass);
                  setActiveSubview('report_review');
                }
              }}
            />
          </div>
        );

      case 'team':
        return (
          <div className="p-4">
            <SupervisorTeamView
              fieldWorkers={fieldWorkers}
              onSelectWorker={(worker) => {
                setSelectedWorker(worker);
                setActiveSubview('worker_details');
              }}
            />
          </div>
        );

      case 'reports':
        return (
          <div className="p-4">
            <SupervisorReportReviewView
              assessments={assessments}
              activeAssessment={null}
              onSelectAssessment={(ass) => {
                setSelectedAssessment(ass);
                setActiveSubview('report_review');
              }}
              onForwardToPM={handleForwardToPM}
              onRequestCorrection={handleRequestCorrection}
              onAddComment={handleAddComment}
            />
          </div>
        );

      case 'beneficiaries':
        return (
          <div className="p-4">
            <SupervisorBeneficiariesView
              beneficiaries={beneficiaries}
              onSelectBeneficiary={(benId) => {
                setSelectedBeneficiaryId(benId);
              }}
            />
          </div>
        );

      case 'activities':
        return (
          <div className="p-4">
            <SupervisorActivityHistoryView activities={activities} />
          </div>
        );

      case 'profile':
        return (
          <div className="p-4">
            <SupervisorProfileView
              currentUser={currentUser}
              onUpdateProfile={handleUpdateProfile}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Sidebar navigation items
  const sidebarNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList, badge: pendingAssignmentsCount > 0 ? pendingAssignmentsCount : null, badgeColor: 'bg-amber-500' },
    { id: 'team', label: 'Field Team (5 Workers)', icon: Users, badge: fieldWorkers.length, badgeColor: 'bg-emerald-600' },
    { id: 'reports', label: 'Reports Review', icon: FileCheck, badge: pendingReportsCount > 0 ? pendingReportsCount : null, badgeColor: 'bg-rose-500' },
    { id: 'beneficiaries', label: 'Beneficiaries Registry', icon: UserCheck },
    { id: 'activities', label: 'Activity Log', icon: History },
    { id: 'profile', label: 'Profile & Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-slate-950 sm:py-6 flex justify-center items-start font-sans">
      <div className="w-full max-w-md min-h-screen sm:min-h-[860px] bg-slate-100 sm:rounded-[32px] sm:shadow-2xl sm:border-[6px] sm:border-slate-800 relative overflow-hidden flex flex-col border-x border-slate-200">
        
        {/* Mobile Drawer Overlay Backdrop */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 animate-in fade-in duration-150 cursor-pointer"
          />
        )}

        {/* MOBILE SLIDE-OUT SIDEBAR DRAWER */}
        <aside 
          className={`absolute inset-y-0 left-0 z-50 w-72 max-w-[85%] bg-white flex flex-col justify-between shadow-2xl border-r border-slate-200 transition-transform duration-200 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full justify-between overflow-y-auto">
            <div>
              {/* Drawer Header Brand */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <svg viewBox="0 0 100 100" className="w-7 h-7 text-[#006B56] shrink-0" fill="currentColor">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" />
                  <circle cx="50" cy="28" r="6" />
                  <circle cx="33" cy="40" r="5.5" />
                  <circle cx="67" cy="40" r="5.5" />
                  <path d="M50,38c-6,0-12,4-14,9a18,18,0,0,0,28,0C62,42,56,38,50,38Z" />
                  <path d="M33,48c-4,0-8,3-10,6a15,15,0,0,0,19,0C39,51,36,48,33,48Z" />
                  <path d="M67,48c-4,0-8,3-10,6a15,15,0,0,0,19,0C75,51,71,48,67,48Z" />
                  <path d="M28,68 Q50,60 72,68" stroke="currentColor" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                  <path d="M22,76 Q50,68 78,76" stroke="currentColor" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                </svg>
                <span className="font-extrabold text-lg tracking-tight text-[#006B56] font-serif">
                  ADRA
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* State Supervisory Hub Switcher in Drawer */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/60">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowStateMenu(!showStateMenu)}
                  className="w-full p-2.5 bg-white hover:bg-emerald-50/40 border border-slate-200 rounded-xl text-left flex items-center justify-between shadow-2xs transition cursor-pointer"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#006B56] flex items-center justify-center shrink-0 border border-emerald-200/70">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block leading-none">
                        Active State Hub
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate block mt-0.5">
                        {activeSupervisor?.state || 'Eastern Equatoria'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {showStateMenu && (
                  <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-50 text-xs animate-in fade-in max-h-64 overflow-y-auto">
                    <div className="px-3 py-1.5 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400">
                      Select South Sudan State
                    </div>
                    {allSupervisors.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectStateSupervisor(s)}
                        className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition ${
                          activeSupervisor?.id === s.id ? 'bg-emerald-50 text-[#006B56] font-bold' : 'text-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="font-bold block text-xs truncate">{s.state}</span>
                          <span className="text-[10px] text-slate-400 font-normal truncate block">{s.name}</span>
                        </div>
                        {activeSupervisor?.id === s.id && <span className="w-2 h-2 rounded-full bg-[#006B56] shrink-0"></span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Navigation Items */}
            <nav className="p-3 space-y-1">
              {sidebarNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = !activeSubview && activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSubview(null);
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#006B56] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== null && item.badge !== undefined && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                        isActive ? 'bg-white/20 text-white' : `${item.badgeColor || 'bg-slate-200'} text-white`
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Drawer Footer Profile & Actions */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2">
            <div className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <img
                  src={activeSupervisor?.avatar || currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                  alt="Supervisor"
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate leading-tight">
                    {activeSupervisor?.name || currentUser?.full_name || 'Emmanuel Adeyemi'}
                  </span>
                  <span className="text-[10px] text-emerald-800 font-semibold block truncate">
                    Supervisor ({activeSupervisor?.state || 'State'})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout || logout}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Role Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center space-x-1.5">
                  <ArrowRightLeft className="w-3 h-3 text-[#006B56]" />
                  <span>Switch Role</span>
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleSwitcher && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-xs animate-in fade-in">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400">
                    Switch Operational Role
                  </div>
                  {[
                    { role: 'Program Manager', label: 'Program Manager (Grace O.)' },
                    { role: 'Supervisor', label: 'Supervisor' },
                    { role: 'Field Worker', label: 'Field Worker (John D.)' },
                    { role: 'Beneficiary', label: 'Beneficiary (Mary N.)' }
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
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between text-xs ${
                        r.role === 'Supervisor' ? 'bg-emerald-50 text-[#006B56] font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span>{r.label}</span>
                      {r.role === 'Supervisor' && <span className="w-1.5 h-1.5 rounded-full bg-[#006B56]"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* TOP HEADER (Structured like Programme Manager Header) */}
      <header className="bg-white px-3.5 py-2.5 border-b border-slate-200 sticky top-0 z-40 shadow-2xs flex items-center justify-between gap-3">
        {/* Left: Menu button + ADRA South Sudan Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          {activeSubview ? (
            <button
              type="button"
              onClick={() => setActiveSubview(null)}
              className="p-1.5 -ml-1 text-slate-600 hover:text-[#006B56] rounded-xl hover:bg-slate-100 transition cursor-pointer flex items-center space-x-1 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 active:scale-95 transition cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {!activeSubview && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#006B56] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                A
              </div>
              <div className="min-w-0">
                <span className="font-black text-sm text-slate-900 tracking-tight leading-none block truncate">
                  ADRA South Sudan
                </span>
                <span className="text-[10px] text-[#006B56] font-extrabold uppercase tracking-wider block mt-0.5">
                  Supervisor Portal
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Notifications Bell Icon */}
        <button
          type="button"
          onClick={() => {
            setActiveSubview(activeSubview === 'notifications' ? null : 'notifications');
          }}
          className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center relative border border-slate-200/80 transition cursor-pointer shadow-2xs shrink-0"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[8px] font-black flex items-center justify-center shadow-xs">
              {unreadNotifsCount}
            </span>
          )}
        </button>
      </header>

      {/* Main Mobile Screen Body */}
      <main className="flex-1 pb-8 overflow-y-auto">
        {renderContent()}
      </main>

      </div>
    </div>
  );
}

export default SupervisorMobileApp;
