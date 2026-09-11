import React, { useState, useEffect } from 'react';
import {
  Home,
  FileText,
  Gift,
  Bell,
  User,
  ArrowLeft,
  Plus,
  Menu,
  X,
  CreditCard,
  Truck,
  MessageSquare,
  Headphones,
  Shield,
  LogOut,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ExternalLink,
  QrCode,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

// Mobile Subcomponents
import { BeneficiarySignUpWizard } from './mobile/BeneficiarySignUpWizard';
import { AssistanceRequestWizard } from './mobile/AssistanceRequestWizard';
import { BeneficiaryMobileDashboard } from './mobile/BeneficiaryMobileDashboard';

// Shared Subviews
import { AssistanceRequestView } from './components/AssistanceRequestView';
import { DistributionInformationView } from './components/DistributionInformationView';
import { BeneficiaryIdCard } from './components/BeneficiaryIdCard';
import { AidHistoryView } from './components/AidHistoryView';
import { NotificationsView } from './components/NotificationsView';
import { FeedbackComplaintsView } from './components/FeedbackComplaintsView';
import { BeneficiaryProfileView } from './components/BeneficiaryProfileView';
import { HelpSupportContactView } from './components/HelpSupportContactView';
import { SecuritySettingsView } from './components/SecuritySettingsView';

export function BeneficiaryMobileApp({ onSwitchToFieldApp }) {
  const { currentUser, logout, login } = useAuth();
  const toast = useToast();

  // View state: 'dashboard' | 'request_wizard' | 'signup_wizard' | 'auth_choice' | 'my_requests' | 'distributions' | 'id_card' | 'history' | 'notifications' | 'feedback' | 'profile' | 'support' | 'security'
  const [currentView, setCurrentView] = useState(() => {
    return currentUser?.role === 'Beneficiary' ? 'dashboard' : 'auth_choice';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [beneficiary, setBeneficiary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [requestStatusFilter, setRequestStatusFilter] = useState('ALL');
  const [isRequestsMenuOpen, setIsRequestsMenuOpen] = useState(true);

  // Load beneficiary profile, requests, and schedules
  const loadData = async () => {
    try {
      setLoading(true);
      const [allBeneficiaries, allDistributions] = await Promise.all([
        db.getBeneficiaries(),
        db.getDistributions()
      ]);

      // Accurately match current user without falling back to hardcoded b7
      const found = allBeneficiaries.find(
        b =>
          (currentUser?.email && b.email?.toLowerCase() === currentUser?.email?.toLowerCase()) ||
          (currentUser?.beneficiary_id && b.id === currentUser?.beneficiary_id) ||
          (currentUser?.beneficiary_code && b.beneficiary_code === currentUser?.beneficiary_code) ||
          (currentUser?.phone_number && b.phone_number === currentUser?.phone_number) ||
          (currentUser?.id && b.id === currentUser?.id) ||
          (currentUser?.full_name && b.full_name?.toLowerCase() === currentUser?.full_name?.toLowerCase())
      ) || (currentUser?.role === 'Beneficiary' ? {
        id: currentUser.id || `ben_${Date.now()}`,
        full_name: currentUser.full_name || currentUser.name || 'Beneficiary',
        beneficiary_code: currentUser.beneficiary_code || currentUser.id_number || 'ADRA-SS-PENDING',
        email: currentUser.email || '',
        phone_number: currentUser.phone_number || '',
        verification_status: currentUser.verification_status || 'Verified Active',
        location: currentUser.location || 'South Sudan'
      } : allBeneficiaries[0]);

      setBeneficiary(found);
      setDistributions(allDistributions);

      if (found) {
        const userReqs = await db.getAssistanceRequests(found.id);
        setRequests(userReqs);

        // Generate dynamic notifications based on real requests and status
        const notifs = [];
        if (userReqs.length > 0) {
          userReqs.forEach(r => {
            notifs.push({
              id: `notif_r_${r.id}`,
              title: `Assistance Request ${r.request_code}`,
              message: `Your ${r.category} request status is currently ${r.status_label || r.status}.`,
              created_at: r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : 'Recent',
              is_read: r.status === 'Approved' ? false : true
            });
          });
        }
        if (found.verification_status) {
          notifs.push({
            id: `notif_v_${found.id}`,
            title: 'Beneficiary Account Active',
            message: `Your household ID ${found.beneficiary_code} is recorded as ${found.verification_status}.`,
            created_at: 'Recent',
            is_read: true
          });
        }
        setNotifications(notifs);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'Beneficiary') {
      loadData();
    }
  }, [currentUser]);

  // Handle Quick 1-Click login as John Machar (b7)
  const handleQuickLoginJohn = async () => {
    try {
      await login('mary.nyambura@adra.community', 'Password123!');
      setCurrentView('dashboard');
      toast.success('Logged in as John Machar (ADRA-SS-000125)');
    } catch (err) {
      toast.error('Login failed.');
    }
  };

  const getHeaderTitle = () => {
    switch (currentView) {
      case 'auth_choice':
        return 'ADRA Beneficiary App';
      case 'signup_wizard':
        return 'Sign Up & Enrollment';
      case 'request_wizard':
        return 'ADRA';
      case 'my_requests':
        return 'My Assistance Requests';
      case 'distributions':
        return 'Distribution Schedules & Aid Tokens';
      case 'id_card':
        return 'Digital Beneficiary ID Card';
      case 'history':
        return 'Assistance History & Relief Receipts';
      case 'notifications':
        return 'Notifications & Alerts';
      case 'feedback':
        return 'Feedback & Grievances';
      case 'profile':
        return 'My Household Profile';
      case 'support':
        return 'Help & Contact ADRA';
      case 'security':
        return 'Security & PIN';
      default:
        return 'Beneficiary Portal';
    }
  };

  const isChildView = currentView !== 'dashboard' && currentView !== 'auth_choice';
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const initials = beneficiary?.full_name
    ? beneficiary.full_name
        .trim()
        .split(/\s+/)
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ID';

  const navGroups = [
    {
      label: 'Main Services',
      items: [
        { id: 'dashboard', name: 'Home / Overview', icon: Home },
        { id: 'my_requests', name: 'Assistance Requests', icon: FileText, badge: requests.length },
        { id: 'distributions', name: 'Distribution Schedules', icon: Truck },
        { id: 'id_card', name: 'Digital ID Card', icon: CreditCard },
        { id: 'history', name: 'Aid History & Receipts', icon: Gift },
      ]
    },
    {
      label: 'Updates & Help',
      items: [
        { id: 'notifications', name: 'Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null, alert: true },
        { id: 'feedback', name: 'Feedback & Complaints', icon: MessageSquare },
        { id: 'support', name: 'Help & Contact ADRA', icon: Headphones },
      ]
    },
    {
      label: 'My Account',
      items: [
        { id: 'profile', name: 'Household Profile', icon: User },
        { id: 'security', name: 'Security & PIN', icon: Shield },
      ]
    }
  ];

  const requestFilterCounts = {
    ALL: requests.length,
    Pending: requests.filter(r => (r.status || '').toLowerCase().includes('pending')).length,
    'Under Review': requests.filter(r => {
      const s = (r.status || '').toLowerCase();
      return s.includes('review') && !s.includes('pending');
    }).length,
    Approved: requests.filter(r => (r.status || '').toLowerCase().includes('approv')).length,
    Fulfilled: requests.filter(r => {
      const s = (r.status || '').toLowerCase();
      return s.includes('fulfill') || s.includes('disburs');
    }).length,
  };

  const requestSubFilters = [
    { id: 'ALL', label: 'All Requests', count: requestFilterCounts.ALL },
    { id: 'Pending', label: 'Pending', count: requestFilterCounts.Pending },
    { id: 'Under Review', label: 'Under Review', count: requestFilterCounts['Under Review'] },
    { id: 'Approved', label: 'Approved', count: requestFilterCounts.Approved },
    { id: 'Fulfilled', label: 'Fulfilled', count: requestFilterCounts.Fulfilled },
  ];

  const handleNavClick = (tabId) => {
    if (tabId === 'my_requests') {
      if (currentView === 'my_requests') {
        setIsRequestsMenuOpen(prev => !prev);
        return;
      }
      setRequestStatusFilter('ALL');
      setIsRequestsMenuOpen(true);
    }
    setCurrentView(tabId);
    setIsSidebarOpen(false);
  };

  const handleFilterClick = (filterId) => {
    setRequestStatusFilter(filterId);
    setCurrentView('my_requests');
    setIsSidebarOpen(false);
  };

  const renderSidebarContent = (isDrawer = false) => (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 bg-[#006B56] text-white shrink-0">
        <div
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          {/* Circular ADRA Emblem */}
          <svg viewBox="0 0 100 100" className="w-8 h-8 text-white shrink-0" fill="currentColor">
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
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight leading-none font-serif">
              ADRA
            </span>
            <span className="text-[10px] text-white/80 font-medium leading-tight mt-0.5 tracking-wide">
              South Sudan Portal
            </span>
          </div>
        </div>

        {isDrawer && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Primary Action Button: + Request Assistance */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/60 shrink-0">
        <button
          type="button"
          onClick={() => {
            setCurrentView('request_wizard');
            setIsSidebarOpen(false);
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-[#006B56] hover:bg-[#005745] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Assistance Request</span>
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              {group.label}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || (item.id === 'my_requests' && currentView === 'request_wizard');
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-150 cursor-pointer text-left ${
                      isActive
                        ? 'bg-[#EAF5F0] text-[#006B56] shadow-2xs border border-[#006B56]/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition ${
                          isActive ? 'text-[#006B56] stroke-[2.4]' : 'text-slate-500'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                            item.alert
                              ? 'bg-rose-500 text-white'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.id === 'my_requests' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsRequestsMenuOpen(prev => !prev);
                          }}
                          className={`p-1 rounded-md transition cursor-pointer flex items-center justify-center ${
                            isActive
                              ? 'text-[#006B56] hover:bg-[#006B56]/15'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70'
                          }`}
                          aria-label={isRequestsMenuOpen ? "Collapse requests filters" : "Expand requests filters"}
                          title={isRequestsMenuOpen ? "Hide filter categories" : "Show filter categories"}
                        >
                          {isRequestsMenuOpen ? (
                            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                        </button>
                      ) : (
                        isActive && (
                          <ChevronRight className="w-3.5 h-3.5 text-[#006B56] shrink-0" />
                        )
                      )}
                    </div>
                  </button>

                  {/* Filter Sub-items for Assistance Requests in the Sidebar */}
                  {item.id === 'my_requests' && isRequestsMenuOpen && (
                    <div className="pl-6 pr-1 pt-1 pb-0.5 space-y-1">
                      {requestSubFilters.map((sub) => {
                        const isFilterActive = currentView === 'my_requests' && requestStatusFilter === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterClick(sub.id);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer text-left ${
                              isFilterActive
                                ? 'bg-[#006B56] text-white shadow-2xs font-extrabold'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{sub.label}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                isFilterActive
                                  ? 'bg-white/25 text-white'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {sub.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Beneficiary Profile & Identity Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-[#006B56] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-slate-900 truncate">
              {beneficiary?.full_name || 'Beneficiary'}
            </p>
            <p className="text-[10px] text-emerald-800 font-mono font-bold truncate flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-[#006B56]" />
              {beneficiary?.beneficiary_code || 'ADRA-SS-PENDING'}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {onSwitchToFieldApp && (
          <button
            type="button"
            onClick={onSwitchToFieldApp}
            className="w-full mt-2 py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Switch to Field Staff App</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#F4F7F5] overflow-hidden font-sans select-text text-slate-900">
      {/* 1. PERMANENT DESKTOP/TABLET SIDEBAR (VISIBLE ON MD+ SCREENS) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-slate-200/80 h-full shrink-0 shadow-xs z-20">
        {renderSidebarContent(false)}
      </aside>

      {/* 2. RESPONSIVE MOBILE SIDEBAR DRAWER (VISIBLE ON <MD WHEN TOGGLED) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Dark Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Slide-over Sidebar Drawer */}
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#F4F7F5]">
        {/* TOP BRAND/NAV HEADER (DARK GREEN) */}
        <header className="bg-[#006B56] px-4 sm:px-6 h-16 flex items-center justify-between shrink-0 z-20 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button on Mobile (<md) to open Sidebar */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1 rounded-xl text-white hover:bg-white/15 cursor-pointer transition"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>

            {/* Back button when in sub-views */}
            {isChildView && (
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="p-1.5 rounded-xl text-white hover:bg-white/15 cursor-pointer transition"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}

            {/* Header Brand / Title: In phone mode, 'ADRA' appears */}
            <div className="min-w-0 flex items-center gap-2.5">
              <span className="text-base sm:text-lg font-black text-white font-serif tracking-wider">
                ADRA
              </span>
              {currentView !== 'request_wizard' && currentView !== 'dashboard' && currentView !== 'auth_choice' && (
                <>
                  <span className="text-white/40 hidden sm:inline">|</span>
                  <h1 className="text-xs sm:text-sm font-bold text-white/90 truncate leading-tight hidden sm:block">
                    {getHeaderTitle()}
                  </h1>
                </>
              )}
              {(currentView === 'dashboard' || currentView === 'request_wizard') && (
                <span className="text-[10px] text-white/80 hidden sm:block font-medium">
                  South Sudan Community Portal
                </span>
              )}
            </div>
          </div>

          {/* Right Header: Notification Bell (Language selector removed) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCurrentView('notifications')}
              className="relative p-2 rounded-xl text-white hover:bg-white/15 cursor-pointer transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#E53E3E] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-[#006B56] shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT BODY (NO BOTTOM NAVIGATION) */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto w-full space-y-4">
            {/* AUTH CHOICE SCREEN (IF LOGGED OUT) */}
            {currentView === 'auth_choice' && (
              <div className="max-w-md mx-auto my-8 p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xl">
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-[#006B56] text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-900/20 font-black text-3xl mb-2">
                    A
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">
                    ADRA South Sudan
                  </h2>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Direct humanitarian aid delivery, emergency food relief, clean water tokens, and assistance requests.
                  </p>
                </div>

                <div className="space-y-3 py-6">
                  <button
                    type="button"
                    onClick={() => setCurrentView('signup_wizard')}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#006B56] hover:bg-[#005443] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#006B56]/30 transition cursor-pointer active:scale-98"
                  >
                    <span>New User: Sign Up</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickLoginJohn}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>Existing Beneficiary: Login (John Machar)</span>
                  </button>
                </div>

                <div className="text-[10px] text-slate-400">
                  Adventist Development and Relief Agency • South Sudan Community Portal
                </div>
              </div>
            )}

            {/* SIGN UP WIZARD */}
            {currentView === 'signup_wizard' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <BeneficiarySignUpWizard
                  onBackToLogin={() => setCurrentView('auth_choice')}
                  onRegistrationComplete={(newBen) => {
                    setBeneficiary(newBen);
                    setCurrentView('dashboard');
                    loadData();
                  }}
                />
              </div>
            )}

            {/* REQUEST ASSISTANCE WIZARD */}
            {currentView === 'request_wizard' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <AssistanceRequestWizard
                  beneficiary={beneficiary}
                  onCancel={() => setCurrentView('dashboard')}
                  onRequestSubmitted={(newReq) => {
                    setRequests(prev => [newReq, ...prev]);
                    const newNotif = {
                      id: `notif_${Date.now()}`,
                      title: 'Assistance Request Submitted',
                      message: `Your assistance request ${newReq.request_code} (${newReq.category}) has been received and is currently under review.`,
                      created_at: 'Just now',
                      is_read: false
                    };
                    setNotifications(prev => [newNotif, ...prev]);
                    setCurrentView('my_requests');
                  }}
                />
              </div>
            )}

            {/* DYNAMIC DASHBOARD */}
            {currentView === 'dashboard' && (
              <BeneficiaryMobileDashboard
                beneficiary={beneficiary}
                requests={requests}
                distributions={distributions}
                notifications={notifications}
                unreadCount={unreadCount}
                onRequestAssistance={() => setCurrentView('request_wizard')}
                onNavigateTab={(tab) => setCurrentView(tab)}
              />
            )}

            {/* MY ASSISTANCE REQUESTS */}
            {currentView === 'my_requests' && (
              <AssistanceRequestView
                beneficiary={beneficiary}
                statusFilter={requestStatusFilter}
                onStatusFilterChange={setRequestStatusFilter}
                onRequestNew={() => setCurrentView('request_wizard')}
              />
            )}

            {/* DISTRIBUTION SCHEDULES & TOKENS */}
            {currentView === 'distributions' && (
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <DistributionInformationView beneficiary={beneficiary} />
              </div>
            )}

            {/* DIGITAL BENEFICIARY ID CARD */}
            {currentView === 'id_card' && (
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <BeneficiaryIdCard beneficiary={beneficiary} />
              </div>
            )}

            {/* AID HISTORY & RECEIPTS */}
            {currentView === 'history' && (
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <AidHistoryView beneficiary={beneficiary} />
              </div>
            )}

            {/* NOTIFICATIONS */}
            {currentView === 'notifications' && (
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <NotificationsView
                  beneficiary={beneficiary}
                  onNavigateTab={(tab) => setCurrentView(tab)}
                />
              </div>
            )}

            {/* FEEDBACK & COMPLAINTS */}
            {currentView === 'feedback' && (
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <FeedbackComplaintsView beneficiary={beneficiary} />
              </div>
            )}

            {/* PROFILE */}
            {currentView === 'profile' && (
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <BeneficiaryProfileView
                  beneficiary={beneficiary}
                  onProfileUpdated={loadData}
                />
              </div>
            )}

            {/* HELP & CONTACT */}
            {currentView === 'support' && (
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <HelpSupportContactView />
              </div>
            )}

            {/* SECURITY & SETTINGS */}
            {currentView === 'security' && (
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <SecuritySettingsView beneficiary={beneficiary} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default BeneficiaryMobileApp;
