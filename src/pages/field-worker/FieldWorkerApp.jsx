import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  QrCode,
  Users,
  Activity,
  User,
  LogOut,
  Shield,
  ArrowRightLeft,
  Bell,
  MapPin,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Menu,
  X,
  ChevronDown,
  Settings,
  Clock,
  CheckCircle2,
  FileCheck,
  UserCheck,
  DollarSign,
  Banknote
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

// Field Worker Subviews
import { FieldWorkerDashboardView } from './components/FieldWorkerDashboardView';
import { FieldWorkerTasksView } from './components/FieldWorkerTasksView';
import { FieldWorkerActivitiesView } from './components/FieldWorkerActivitiesView';
import { FieldWorkerBeneficiariesView } from './components/FieldWorkerBeneficiariesView';
import { FieldWorkerProfileView } from './components/FieldWorkerProfileView';
import { FieldFundingListView } from './components/FieldFundingListView';

// Field Worker Modals
import { FieldAssessmentFormModal } from './components/FieldAssessmentFormModal';
import { FieldDistributionScannerModal } from './components/FieldDistributionScannerModal';
import { FieldBeneficiaryRegisterModal } from './components/FieldBeneficiaryRegisterModal';
import { FieldFundingRequestModal } from './components/FieldFundingRequestModal';

export function FieldWorkerApp({
  currentUser,
  onLogout,
  onSwitchRole,
  onBackToFieldApp
}) {
  const { logout, quickSwitchRole } = useAuth();
  const toast = useToast();

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'tasks' | 'beneficiaries' | 'activities' | 'funding' | 'profile'
  const [taskStatusFilter, setTaskStatusFilter] = useState('all'); // 'all' | 'pending' | 'submitted' | 'completed'
  const [facilitationFilter, setFacilitationFilter] = useState('request'); // 'request' | 'pending' | 'approved'
  const [isTasksExpanded, setIsTasksExpanded] = useState(true);
  const [isFacilitationExpanded, setIsFacilitationExpanded] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals State
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedTaskForAssessment, setSelectedTaskForAssessment] = useState(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [selectedTaskForFunding, setSelectedTaskForFunding] = useState(null);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showCoverageMenu, setShowCoverageMenu] = useState(false);

  // Data State
  const [worker, setWorker] = useState({});
  const [allWorkers, setAllWorkers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [dutyStatus, setDutyStatus] = useState('Available');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load all worker data
  const loadData = async (targetWorker = null) => {
    try {
      setLoading(true);
      const workersList = await db.getFieldWorkers();
      setAllWorkers(workersList || []);

      const current = targetWorker || (
        workersList.find(w => 
          w.email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
          w.name?.toLowerCase() === currentUser?.full_name?.toLowerCase() ||
          w.id === currentUser?.id
        ) || workersList[0] || {
          id: 'fw-1',
          name: currentUser?.full_name || 'Field Officer',
          email: currentUser?.email || 'field.worker@adra.org',
          role: 'Field Worker',
          state: 'Eastern Equatoria',
          county: 'Kapoeta South',
          payam: 'Kapoeta Town',
          boma: 'Machi',
          supervisor_name: 'Emmanuel Adeyemi',
          current_status: 'Available'
        }
      );

      setWorker(current);
      setDutyStatus(current.current_status || 'Available');

      const [assignedTasks, assData, actData, benData, fundData] = await Promise.all([
        db.getFieldWorkerAssignedRequests ? db.getFieldWorkerAssignedRequests(current.id, current.name) : db.getAssistanceRequests(),
        db.getFieldAssessments ? db.getFieldAssessments(null, current.id, current.name) : [],
        db.getFieldWorkerActivities ? db.getFieldWorkerActivities(current.id, current.name) : [],
        db.getBeneficiaries ? db.getBeneficiaries() : [],
        db.getFieldFundingRequests ? db.getFieldFundingRequests(current.id) : []
      ]);

      if (assignedTasks && assignedTasks.length > 0) {
        setTasks(assignedTasks);
      } else {
        const allReqs = await db.getAssistanceRequests();
        setTasks(allReqs);
      }

      setAssessments(assData || []);
      setActivities(actData || []);
      
      const allBens = benData || [];
      const territoryBens = allBens.filter(b => {
        if (!current) return true;
        const matchPayam = current.payam && b.payam && b.payam.toLowerCase().trim() === current.payam.toLowerCase().trim();
        const matchCounty = current.county && b.county && b.county.toLowerCase().trim() === current.county.toLowerCase().trim();
        const matchLocation = (current.payam && b.location && b.location.toLowerCase().includes(current.payam.toLowerCase())) ||
                              (current.county && b.location && b.location.toLowerCase().includes(current.county.toLowerCase()));
        const matchRegistrar = (current.name && b.registered_by?.toLowerCase() === current.name.toLowerCase()) ||
                               (current.id && b.registered_by_id === current.id);
        return matchPayam || matchCounty || matchLocation || matchRegistrar;
      });
      setBeneficiaries(territoryBens);
      setFundingRequests(fundData || []);
    } catch (err) {
      console.error('Failed to load field worker data:', err);
      toast.error('Error loading field worker profile and tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(worker);
    toast.success('Field tasks & records refreshed');
  };

  const handleSelectWorkerProfile = (selectedW) => {
    setWorker(selectedW);
    setDutyStatus(selectedW.current_status || 'Available');
    setShowCoverageMenu(false);
    loadData(selectedW);
    toast.info(`Switched field route to ${selectedW.name} (${selectedW.payam || selectedW.assigned_area})`);
  };

  const handleUpdateDutyStatus = async (newStatus) => {
    setDutyStatus(newStatus);
    setWorker(prev => ({ ...prev, current_status: newStatus }));
    try {
      if (db.updateFieldWorkerDutyStatus) {
        await db.updateFieldWorkerDutyStatus(worker.id, newStatus);
      }
    } catch (err) {
      console.error('Duty status sync error:', err);
    }
  };

  const handleSubmitAssessment = async (assessmentData) => {
    const res = await db.submitFieldAssessment(assessmentData);
    await loadData(worker);
    return res;
  };

  const handleConfirmDistribution = async (distData) => {
    const res = await db.confirmAidDistribution(distData);
    await loadData(worker);
    return res;
  };

  const handleRegisterBeneficiary = async (benData) => {
    const res = await db.createBeneficiary(benData);
    await loadData(worker);
    return res;
  };

  const handleCreateActivity = async (actData) => {
    const res = await db.createFieldWorkerActivity(actData);
    await loadData(worker);
    return res;
  };

  const handleSubmitFundingRequest = async (fundingData) => {
    const res = await db.createFieldFundingRequest(fundingData);
    await loadData(worker);
    return res;
  };

  // Dynamic counts for sidebar badges
  const pendingTasksCount = useMemo(() => {
    return tasks.filter(t => 
      t.status === 'Assigned to Field Worker' || 
      t.status === 'Submitted' ||
      t.status === 'Assessment In Progress' || 
      t.status === 'Correction Required'
    ).length;
  }, [tasks]);

  const submittedTasksCount = useMemo(() => {
    return tasks.filter(t => 
      t.status === 'Assessment Submitted' || 
      t.status === 'Awaiting Program Manager Decision'
    ).length;
  }, [tasks]);

  const completedTasksCount = useMemo(() => {
    return tasks.filter(t => 
      t.status === 'Completed' || 
      t.status === 'Distributed' || 
      t.status === 'Approved'
    ).length;
  }, [tasks]);

  const activeFundingCount = useMemo(() => {
    return fundingRequests.filter(r => r.status !== 'Disbursed' && !r.status?.includes('Rejected')).length;
  }, [fundingRequests]);

  const pendingFundingCount = useMemo(() => {
    return fundingRequests.filter(r => r.status !== 'Disbursed' && !r.status?.includes('Rejected')).length;
  }, [fundingRequests]);

  const approvedFundingCount = useMemo(() => {
    return fundingRequests.filter(r => r.status === 'Disbursed').length;
  }, [fundingRequests]);

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

        {/* SLIDE-OUT SIDEBAR DRAWER */}
        <aside 
          className={`absolute inset-y-0 left-0 z-50 w-76 max-w-[85%] bg-white flex flex-col shadow-2xl border-r border-slate-200 transition-transform duration-200 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* 1. Drawer Header Brand (Fixed Top) */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#006B56] text-white flex items-center justify-center font-black text-xs shadow-xs">
                ADRA
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-[#006B56] block leading-tight">
                  ADRA Field App
                </span>
                <span className="text-[10px] text-slate-500 font-semibold block">
                  Humanitarian Field Ops
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

          {/* 2. Field Officer / Route Switcher (Fixed) */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCoverageMenu(!showCoverageMenu)}
                className="w-full p-2 bg-white hover:bg-emerald-50/40 border border-slate-200 rounded-xl text-left flex items-center justify-between shadow-2xs transition cursor-pointer"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#006B56] flex items-center justify-center shrink-0 border border-emerald-200/70">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block leading-none">
                      Field Route / Payam
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate block mt-0.5">
                      {worker.payam || worker.county || 'Kapoeta South'}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {showCoverageMenu && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-50 text-xs animate-in fade-in max-h-64 overflow-y-auto">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400">
                    Select Field Officer Route
                  </div>
                  {allWorkers.map(w => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleSelectWorkerProfile(w)}
                      className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition ${
                        worker.id === w.id ? 'bg-emerald-50 text-[#006B56] font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="font-bold block text-xs truncate">{w.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal truncate block">
                          {w.payam || w.assigned_area} • Sup: {w.supervisor_name || 'Emmanuel Adeyemi'}
                        </span>
                      </div>
                      {worker.id === w.id && <span className="w-2 h-2 rounded-full bg-[#006B56] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Dedicated Scrollable Navigation Area */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
            {/* Dashboard Overview */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('dashboard');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#006B56] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-400'}`} />
                <span>Dashboard Overview</span>
              </div>
            </button>

            {/* Assigned Field Tasks Section (Collapsible) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsTasksExpanded(!isTasksExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <ClipboardList className="w-4 h-4 text-[#006B56]" />
                  <span className="font-extrabold text-slate-900">Assigned Field Tasks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200/80">
                    {tasks.length} Cases
                  </span>
                  {isTasksExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Sub-items under Assigned (Clean flat list without cards) */}
              {isTasksExpanded && (
                <div className="pl-3 pr-1 py-0.5 space-y-0.5 border-l-2 border-slate-200 ml-4 my-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('tasks');
                      setTaskStatusFilter('all');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                      activeTab === 'tasks' && taskStatusFilter === 'all'
                        ? 'bg-emerald-50 text-[#006B56] font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'tasks' && taskStatusFilter === 'all' ? 'bg-[#006B56]' : 'bg-slate-400'}`} />
                      <span>All Tasks</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'tasks' && taskStatusFilter === 'all'
                        ? 'bg-[#006B56] text-white'
                        : 'text-slate-500'
                    }`}>
                      {tasks.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('tasks');
                      setTaskStatusFilter('pending');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                      activeTab === 'tasks' && taskStatusFilter === 'pending'
                        ? 'bg-amber-50 text-amber-900 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'tasks' && taskStatusFilter === 'pending' ? 'bg-amber-600' : 'bg-slate-400'}`} />
                      <span>Pending Audit</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'tasks' && taskStatusFilter === 'pending'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-500'
                    }`}>
                      {pendingTasksCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('tasks');
                      setTaskStatusFilter('submitted');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                      activeTab === 'tasks' && taskStatusFilter === 'submitted'
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'tasks' && taskStatusFilter === 'submitted' ? 'bg-blue-600' : 'bg-slate-400'}`} />
                      <span>Submitted</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'tasks' && taskStatusFilter === 'submitted'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-500'
                    }`}>
                      {submittedTasksCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('tasks');
                      setTaskStatusFilter('completed');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                      activeTab === 'tasks' && taskStatusFilter === 'completed'
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'tasks' && taskStatusFilter === 'completed' ? 'bg-emerald-700' : 'bg-slate-400'}`} />
                      <span>Delivered</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'tasks' && taskStatusFilter === 'completed'
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-500'
                    }`}>
                      {completedTasksCount}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Household Registry */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('beneficiaries');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'beneficiaries'
                  ? 'bg-[#006B56] text-white shadow-xs'
                  : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Users className={`w-4 h-4 ${activeTab === 'beneficiaries' ? 'text-white' : 'text-slate-500'}`} />
                <span>Household Registry</span>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-black min-w-[24px] text-center shadow-xs ${
                activeTab === 'beneficiaries'
                  ? 'bg-white text-[#006B56]'
                  : 'bg-purple-600 text-white'
              }`}>
                {beneficiaries.length}
              </span>
            </button>

            {/* Daily Field Logs */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('activities');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'activities'
                  ? 'bg-[#006B56] text-white shadow-xs'
                  : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Activity className={`w-4 h-4 ${activeTab === 'activities' ? 'text-white' : 'text-slate-500'}`} />
                <span>Daily Field Logs</span>
              </div>
              {activities.length > 0 && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-black min-w-[24px] text-center shadow-xs ${
                  activeTab === 'activities'
                    ? 'bg-white text-[#006B56]'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {activities.length}
                </span>
              )}
            </button>

            {/* Facilitation Section (Collapsible) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsFacilitationExpanded(!isFacilitationExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <Banknote className="w-4 h-4 text-[#006B56]" />
                  <span className="font-extrabold text-slate-900">Facilitation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200/80">
                    {fundingRequests.length} Total
                  </span>
                  {isFacilitationExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Sub-items under Facilitation (Clean flat list without cards) */}
              {isFacilitationExpanded && (
                <div className="pl-3 pr-1 py-0.5 space-y-0.5 border-l-2 border-slate-200 ml-4 my-1">
                  {/* 1. Request Facilitation */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('funding');
                      setFacilitationFilter('request');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                      activeTab === 'funding' && facilitationFilter === 'request'
                        ? 'bg-emerald-50 text-[#006B56] font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'funding' && facilitationFilter === 'request' ? 'bg-[#006B56]' : 'bg-slate-400'}`} />
                      <span>Request</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'funding' && facilitationFilter === 'request'
                        ? 'bg-[#006B56] text-white'
                        : 'text-slate-500'
                    }`}>
                      {tasks.length}
                    </span>
                  </button>

                  {/* 2. Pending Facilitations */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('funding');
                      setFacilitationFilter('pending');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                      activeTab === 'funding' && facilitationFilter === 'pending'
                        ? 'bg-amber-50 text-amber-900 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'funding' && facilitationFilter === 'pending' ? 'bg-amber-600' : 'bg-slate-400'}`} />
                      <span>Pending</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'funding' && facilitationFilter === 'pending'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-500'
                    }`}>
                      {pendingFundingCount}
                    </span>
                  </button>

                  {/* 3. Approved Facilitations */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('funding');
                      setFacilitationFilter('approved');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                      activeTab === 'funding' && facilitationFilter === 'approved'
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'funding' && facilitationFilter === 'approved' ? 'bg-emerald-700' : 'bg-slate-400'}`} />
                      <span>Approved</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'funding' && facilitationFilter === 'approved'
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-500'
                    }`}>
                      {approvedFundingCount}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Officer Profile & Zone */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#006B56] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-white' : 'text-slate-400'}`} />
                <span>Officer Profile & Zone</span>
              </div>
            </button>

            {/* Quick Scan Action in Drawer */}
            <button
              type="button"
              onClick={() => {
                setShowScannerModal(true);
                setIsSidebarOpen(false);
              }}
              className="w-full mt-2 flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <QrCode className="w-4 h-4 text-blue-700" />
                <span>Scan Aid QR Token</span>
              </div>
              <span className="text-[9px] font-black uppercase bg-blue-200/80 text-blue-950 px-1.5 py-0.2 rounded">
                Tool
              </span>
            </button>
          </nav>

          {/* 4. Sidebar Footer (Fixed at Bottom) */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/90 shrink-0 space-y-2">
            <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-[#006B56] text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                {worker.name ? worker.name.split(' ').map(n => n[0]).join('') : 'FW'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate block">
                    {worker.name || 'Field Officer'}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${
                    dutyStatus === 'Available' ? 'bg-emerald-500' :
                    dutyStatus === 'On Assignment' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                </div>
                <span className="text-[10px] text-slate-400 block truncate">
                  Sup: {worker.supervisor_name || 'Emmanuel Adeyemi'}
                </span>
              </div>
            </div>

            {/* Role Switcher */}
            <button
              type="button"
              onClick={() => {
                setShowRoleSwitcher(!showRoleSwitcher);
              }}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#006B56]" />
              Switch System Role
            </button>

            {showRoleSwitcher && (
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 space-y-1 text-xs animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleSwitcher(false);
                    setIsSidebarOpen(false);
                    onSwitchRole ? onSwitchRole('Supervisor') : quickSwitchRole('Supervisor');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Supervisor (Emmanuel Adeyemi)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleSwitcher(false);
                    setIsSidebarOpen(false);
                    onSwitchRole ? onSwitchRole('Program Manager') : quickSwitchRole('Program Manager');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Programme Manager (Grace Ochieng)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleSwitcher(false);
                    setIsSidebarOpen(false);
                    onSwitchRole ? onSwitchRole('Administrator') : quickSwitchRole('Administrator');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Administrator (Dr. Elizabeth Warren)
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onLogout || logout}
              className="w-full py-2 px-3 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* TOP APP BAR / HEADER */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-3.5 py-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            
            {/* Hamburger button + Brand Identity */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px] sm:max-w-none">
                    {worker.name || 'Field Officer'}
                  </h1>
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                    dutyStatus === 'Available' ? 'bg-emerald-100 text-emerald-900' :
                    dutyStatus === 'On Assignment' ? 'bg-amber-100 text-amber-900' :
                    'bg-blue-100 text-blue-900'
                  }`}>
                    ● {dutyStatus}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-none mt-0.5 flex items-center gap-1">
                  <span>{worker.payam || worker.county || 'Kapoeta South'}</span>
                  <span>•</span>
                  <span className="text-slate-600">Sup: {worker.supervisor_name || 'Emmanuel Adeyemi'}</span>
                </p>
              </div>
            </div>

            {/* Right Header Action Icons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh Records"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#006B56]' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setShowScannerModal(true)}
                title="Scan QR Token"
                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition border border-blue-200/70"
              >
                <QrCode className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onLogout || logout}
                title="Sign Out"
                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT BODY */}
        <main className="flex-1 overflow-y-auto p-3.5 space-y-4 pb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-9 h-9 border-3 border-[#006B56]/20 border-t-[#006B56] rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-600">Loading field tasks & boma records...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <FieldWorkerDashboardView
                  worker={worker}
                  tasks={tasks}
                  assessments={assessments}
                  activities={activities}
                  beneficiaries={beneficiaries}
                  fundingRequests={fundingRequests}
                  dutyStatus={dutyStatus}
                  onUpdateDutyStatus={handleUpdateDutyStatus}
                  onNavigateTab={(tab, filter = 'all') => {
                    setActiveTab(tab);
                    if (filter) setTaskStatusFilter(filter);
                  }}
                  onStartAssessment={(task = null) => {
                    setSelectedTaskForAssessment(task);
                    setShowAssessmentModal(true);
                  }}
                  onOpenScanner={() => setShowScannerModal(true)}
                  onOpenRegisterBeneficiary={() => setShowRegisterModal(true)}
                  onOpenFundingRequest={(task = null) => {
                    setSelectedTaskForFunding(task);
                    setActiveTab('funding');
                  }}
                  onRequestFacilitation={(task = null) => {
                    setSelectedTaskForFunding(task);
                    setActiveTab('funding');
                  }}
                  onSelectTask={(task) => {
                    setSelectedTaskForAssessment(task);
                    setShowAssessmentModal(true);
                  }}
                />
              )}

              {activeTab === 'tasks' && (
                <FieldWorkerTasksView
                  tasks={tasks}
                  statusFilter={taskStatusFilter}
                  onStatusFilterChange={setTaskStatusFilter}
                  onStartAssessment={(task) => {
                    setSelectedTaskForAssessment(task);
                    setShowAssessmentModal(true);
                  }}
                  onSelectTask={(task) => {
                    setSelectedTaskForAssessment(task);
                    setShowAssessmentModal(true);
                  }}
                  onOpenScanner={() => setShowScannerModal(true)}
                  onRequestFacilitation={(task) => {
                    setSelectedTaskForFunding(task);
                    setActiveTab('funding');
                  }}
                />
              )}

              {activeTab === 'funding' && (
                <FieldFundingListView
                  requests={fundingRequests}
                  worker={worker}
                  tasks={tasks}
                  initialTask={selectedTaskForFunding}
                  filterMode={facilitationFilter}
                  onFilterModeChange={setFacilitationFilter}
                  onSubmitFundingRequest={handleSubmitFundingRequest}
                  onRefresh={() => loadData(worker)}
                />
              )}

              {activeTab === 'beneficiaries' && (
                <FieldWorkerBeneficiariesView
                  beneficiaries={beneficiaries}
                  worker={worker}
                  onOpenRegisterBeneficiary={() => setShowRegisterModal(true)}
                  onStartAuditForBeneficiary={(ben) => {
                    setSelectedTaskForAssessment({
                      beneficiary_name: ben.full_name,
                      beneficiary_code: ben.beneficiary_code,
                      phone: ben.phone_number,
                      state: worker.state,
                      county: worker.county,
                      payam: worker.payam,
                      household_members: ben.household_members || 6
                    });
                    setShowAssessmentModal(true);
                  }}
                />
              )}

              {activeTab === 'activities' && (
                <FieldWorkerActivitiesView
                  activities={activities}
                  worker={worker}
                  onCreateActivity={handleCreateActivity}
                />
              )}

              {activeTab === 'profile' && (
                <FieldWorkerProfileView
                  worker={worker}
                  dutyStatus={dutyStatus}
                  onUpdateDutyStatus={handleUpdateDutyStatus}
                  onSwitchRole={(role) => onSwitchRole ? onSwitchRole(role) : quickSwitchRole(role)}
                  onLogout={onLogout || logout}
                />
              )}
            </>
          )}
        </main>

        {/* MODAL DIALOGS */}
        {showAssessmentModal && (
          <FieldAssessmentFormModal
            isOpen={showAssessmentModal}
            onClose={() => {
              setShowAssessmentModal(false);
              setSelectedTaskForAssessment(null);
            }}
            task={selectedTaskForAssessment}
            worker={worker}
            onSubmitAssessment={handleSubmitAssessment}
          />
        )}

        {showScannerModal && (
          <FieldDistributionScannerModal
            isOpen={showScannerModal}
            onClose={() => setShowScannerModal(false)}
            worker={worker}
            tasks={tasks}
            onConfirmDistribution={handleConfirmDistribution}
          />
        )}

        {showRegisterModal && (
          <FieldBeneficiaryRegisterModal
            isOpen={showRegisterModal}
            onClose={() => setShowRegisterModal(false)}
            worker={worker}
            onRegisterBeneficiary={handleRegisterBeneficiary}
          />
        )}

        {showFundingModal && (
          <FieldFundingRequestModal
            isOpen={showFundingModal}
            onClose={() => {
              setShowFundingModal(false);
              setSelectedTaskForFunding(null);
            }}
            worker={worker}
            tasks={tasks}
            initialTask={selectedTaskForFunding}
            onSubmitFundingRequest={handleSubmitFundingRequest}
          />
        )}

      </div>
    </div>
  );
}
