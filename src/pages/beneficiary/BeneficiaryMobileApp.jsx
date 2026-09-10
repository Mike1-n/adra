import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Maximize2,
  Minimize2,
  Home,
  HandHeart,
  Truck,
  CreditCard,
  User,
  Bell,
  ArrowLeft,
  LogOut,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Menu,
  X,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

// Mobile Subcomponents
import { BeneficiarySignUpWizard } from './mobile/BeneficiarySignUpWizard';
import { AssistanceRequestWizard } from './mobile/AssistanceRequestWizard';
import { BeneficiaryMobileDashboard } from './mobile/BeneficiaryMobileDashboard';

// Shared Subviews
import { BeneficiaryIdCard } from './components/BeneficiaryIdCard';
import { AssistanceRequestView } from './components/AssistanceRequestView';
import { DistributionInformationView } from './components/DistributionInformationView';
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

  const [beneficiary, setBeneficiary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Desktop presentation frame toggle (mobile preview vs full width)
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);
  const [currentTime, setCurrentTime] = useState('09:41');

  // Update mock clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load beneficiary profile, requests, and schedules
  const loadData = async () => {
    try {
      setLoading(true);
      const [allBeneficiaries, allDistributions] = await Promise.all([
        db.getBeneficiaries(),
        db.getDistributions()
      ]);

      const found = allBeneficiaries.find(
        b =>
          b.email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
          b.id === currentUser?.beneficiary_id ||
          b.beneficiary_code === currentUser?.beneficiary_code ||
          b.id === 'b7'
      ) || allBeneficiaries[0];

      setBeneficiary(found);
      setDistributions(allDistributions);

      if (found) {
        const userReqs = await db.getAssistanceRequests(found.id);
        setRequests(userReqs);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load mobile app data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'Beneficiary') {
      loadData();
    }
  }, [currentUser]);

  // Handle Quick 1-Click login as Mary Nyambura (Existing Beneficiary)
  const handleQuickLoginMary = async () => {
    try {
      await login('mary.nyambura@adra.community', 'Password123!');
      setCurrentView('dashboard');
      toast.success('Logged in as Mary Nyambura (BEN-2025-007 / ADRA-SS-000125)');
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
        return 'Request Assistance';
      case 'my_requests':
        return 'Assistance Requests';
      case 'distributions':
        return 'Distribution Schedules';
      case 'id_card':
        return 'Digital Beneficiary ID';
      case 'history':
        return 'Assistance History';
      case 'notifications':
        return 'Notifications';
      case 'feedback':
        return 'Feedback & Grievances';
      case 'profile':
        return 'My Household Profile';
      case 'support':
        return 'Help & Contact ADRA';
      case 'security':
        return 'Security & PIN';
      default:
        return 'ADRA Client App';
    }
  };

  const isChildView = currentView !== 'dashboard' && currentView !== 'auth_choice';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 font-sans">
      {/* Top Bar for Desktop Examiner (Switcher & Frame Toggles) */}
      <div className="w-full max-w-md hidden sm:flex items-center justify-between pb-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Beneficiary Mobile Application
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1 cursor-pointer shadow-2xs"
            title={isPhoneFrame ? 'Switch to Expanded View' : 'Switch to Smartphone Frame'}
          >
            {isPhoneFrame ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            <span>{isPhoneFrame ? 'Expand' : 'Phone Frame'}</span>
          </button>

          {onSwitchToFieldApp && (
            <button
              type="button"
              onClick={onSwitchToFieldApp}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer shadow-2xs"
            >
              Field App
            </button>
          )}
        </div>
      </div>

      {/* MOBILE APPLICATION DEVICE CONTAINER */}
      <div
        className={`w-full bg-white transition-all duration-300 flex flex-col relative overflow-hidden ${
          isPhoneFrame
            ? 'sm:max-w-[410px] sm:h-[844px] sm:rounded-[42px] sm:border-[8px] sm:border-slate-850 sm:shadow-2xl'
            : 'max-w-4xl min-h-screen sm:min-h-[860px] sm:rounded-3xl sm:border border-slate-200 sm:shadow-xl'
        }`}
      >
        {/* SMARTPHONE HARDWARE NOTCH & STATUS BAR */}
        <div className="bg-white border-b border-slate-100 px-6 pt-3 pb-2 flex items-center justify-between text-xs font-semibold text-slate-800 shrink-0 z-30">
          <span>{currentTime}</span>

          {/* Speaker notch on phone frame */}
          {isPhoneFrame && (
            <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto hidden sm:block -mt-1" />
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold">5G</span>
            <div className="w-5 h-2.5 rounded-sm border border-slate-800 p-0.5 flex items-center">
              <div className="w-full h-full bg-slate-900 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* MOBILE TOP APP BAR */}
        <div className="h-14 px-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2">
            {isChildView ? (
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="p-1.5 -ml-1 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
                A
              </div>
            )}
            <h1 className="text-sm font-black tracking-tight text-slate-900 truncate">
              {getHeaderTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            {currentUser?.role === 'Beneficiary' && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentView('notifications')}
                  className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600" />
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentView('security')}
                  className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Settings & Logout"
                >
                  <User className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* SCROLLABLE MAIN MOBILE BODY */}
        <div className="flex-1 overflow-y-auto bg-white scrollbar-none">
          {/* 1. CHOOSE LOGIN OR SIGN UP SCREEN */}
          {currentView === 'auth_choice' && (
            <div className="min-h-full flex flex-col justify-between p-6 text-center">
              <div className="pt-8 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-700/20 font-black text-3xl mb-2">
                  A
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  ADRA Community App
                </h2>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Direct humanitarian aid delivery, emergency food relief, clean water tokens, and assistance requests.
                </p>
              </div>

              {/* Action Buttons: Existing Beneficiary vs New User */}
              <div className="space-y-3 py-6">
                <button
                  type="button"
                  onClick={() => setCurrentView('signup_wizard')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer active:scale-98"
                >
                  <span>New User: Sign Up</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickLoginMary}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>Existing Beneficiary: Login (Mary Nyambura)</span>
                </button>

                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 font-medium">
                    Preloaded Examiner Demo Account: Mary Nyambura (BEN-2025-007)
                  </span>
                </div>
              </div>

              <div className="pb-4 text-[10px] text-slate-400">
                Adventist Development and Relief Agency • Kenya Community Portal
              </div>
            </div>
          )}

          {/* 2. SIGN UP WIZARD */}
          {currentView === 'signup_wizard' && (
            <BeneficiarySignUpWizard
              onBackToLogin={() => setCurrentView('auth_choice')}
              onRegistrationComplete={(newBen) => {
                setBeneficiary(newBen);
                setCurrentView('dashboard');
                loadData();
              }}
            />
          )}

          {/* 3. REQUEST ASSISTANCE WIZARD */}
          {currentView === 'request_wizard' && (
            <AssistanceRequestWizard
              beneficiary={beneficiary}
              onCancel={() => setCurrentView('dashboard')}
              onRequestSubmitted={(newReq) => {
                setRequests(prev => [newReq, ...prev]);
                setCurrentView('my_requests');
              }}
            />
          )}

          {/* 4. BENEFICIARY MOBILE DASHBOARD */}
          {currentView === 'dashboard' && (
            <BeneficiaryMobileDashboard
              beneficiary={beneficiary}
              requests={requests}
              distributions={distributions}
              onRequestAssistance={() => setCurrentView('request_wizard')}
              onNavigateTab={(tab) => setCurrentView(tab)}
            />
          )}

          {/* 5. MY ASSISTANCE REQUESTS */}
          {currentView === 'my_requests' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  My Assistance Requests ({requests.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setCurrentView('request_wizard')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> New Request
                </button>
              </div>

              <AssistanceRequestView beneficiary={beneficiary} />
            </div>
          )}

          {/* 6. DISTRIBUTION SCHEDULES & TOKENS */}
          {currentView === 'distributions' && (
            <div className="p-4">
              <DistributionInformationView beneficiary={beneficiary} />
            </div>
          )}

          {/* 7. DIGITAL BENEFICIARY ID CARD */}
          {currentView === 'id_card' && (
            <div className="p-4">
              <BeneficiaryIdCard beneficiary={beneficiary} />
            </div>
          )}

          {/* 8. AID HISTORY & RECEIPTS */}
          {currentView === 'history' && (
            <div className="p-4">
              <AidHistoryView beneficiary={beneficiary} />
            </div>
          )}

          {/* 9. NOTIFICATIONS */}
          {currentView === 'notifications' && (
            <div className="p-4">
              <NotificationsView
                beneficiary={beneficiary}
                onNavigateTab={(tab) => setCurrentView(tab)}
              />
            </div>
          )}

          {/* 10. FEEDBACK & COMPLAINTS */}
          {currentView === 'feedback' && (
            <div className="p-4">
              <FeedbackComplaintsView beneficiary={beneficiary} />
            </div>
          )}

          {/* 11. PROFILE */}
          {currentView === 'profile' && (
            <div className="p-4">
              <BeneficiaryProfileView
                beneficiary={beneficiary}
                onProfileUpdated={loadData}
              />
            </div>
          )}

          {/* 12. HELP & CONTACT */}
          {currentView === 'support' && (
            <div className="p-4">
              <HelpSupportContactView />
            </div>
          )}

          {/* 13. SECURITY & SETTINGS */}
          {currentView === 'security' && (
            <div className="p-4">
              <SecuritySettingsView beneficiary={beneficiary} />
            </div>
          )}
        </div>

        {/* MOBILE STICKY BOTTOM NAVIGATION BAR */}
        {currentUser?.role === 'Beneficiary' && currentView !== 'auth_choice' && currentView !== 'signup_wizard' && (
          <div className="bg-white/95 backdrop-blur-md border-t border-slate-100 px-3 py-2 flex items-center justify-around shrink-0 z-30 shadow-lg">
            <button
              type="button"
              onClick={() => setCurrentView('dashboard')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold cursor-pointer transition ${
                currentView === 'dashboard' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('my_requests')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold cursor-pointer transition ${
                currentView === 'my_requests' || currentView === 'request_wizard'
                  ? 'text-emerald-700'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <HandHeart className="w-5 h-5" />
              <span>Requests</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('distributions')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold cursor-pointer transition ${
                currentView === 'distributions' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Truck className="w-5 h-5" />
              <span>Schedules</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('id_card')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold cursor-pointer transition ${
                currentView === 'id_card' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>My ID</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('profile')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold cursor-pointer transition ${
                currentView === 'profile' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default BeneficiaryMobileApp;
