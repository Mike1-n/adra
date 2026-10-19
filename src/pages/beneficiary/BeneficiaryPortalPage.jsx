import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  HandHeart,
  FolderKanban,
  History,
  Truck,
  Bell,
  MessageSquareQuote,
  User,
  Headphones,
  Shield,
  LogOut,
  Menu,
  X,
  Sparkles,
  QrCode,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  Info,
  Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

// 14 Module Subcomponents
import { BeneficiaryIdCard } from './components/BeneficiaryIdCard';
import { AssistanceRequestView } from './components/AssistanceRequestView';
import { ProgrammeInformationView } from './components/ProgrammeInformationView';
import { AidHistoryView } from './components/AidHistoryView';
import { DistributionInformationView } from './components/DistributionInformationView';
import { NotificationsView } from './components/NotificationsView';
import { FeedbackComplaintsView } from './components/FeedbackComplaintsView';
import { BeneficiaryProfileView } from './components/BeneficiaryProfileView';
import { HelpSupportContactView } from './components/HelpSupportContactView';
import { SecuritySettingsView } from './components/SecuritySettingsView';
import { AboutUsView } from './components/AboutUsView';
import { BeneficiaryMobileDashboard } from './mobile/BeneficiaryMobileDashboard';

export function BeneficiaryPortalPage({ onSwitchToFieldApp }) {
  const { currentUser, logout } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [beneficiary, setBeneficiary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load Beneficiary Profile, Requests and Distributions
  const loadBeneficiaryProfile = async () => {
    try {
      setLoading(true);
      const [beneficiaries, allDistributions] = await Promise.all([
        db.getBeneficiaries(),
        db.getDistributions()
      ]);
      // Match by email, id, or default to Mary Nyambura (b7)
      const found = beneficiaries.find(
        b =>
          b.email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
          b.id === currentUser?.beneficiary_id ||
          b.beneficiary_code === currentUser?.beneficiary_code ||
          b.id === 'b7'
      );
      const targetBen = found || beneficiaries[0];
      setBeneficiary(targetBen);
      setDistributions(allDistributions || []);

      if (targetBen) {
        const userReqs = await db.getAssistanceRequests(targetBen.id || targetBen.beneficiary_code);
        setRequests(userReqs || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeneficiaryProfile();
  }, [currentUser]);

  const navItems = [
    { id: 'dashboard', label: 'Home / Overview', icon: Home, count: null },
    { id: 'requests', label: 'Assistance Requests', icon: HandHeart, count: requests.length || 3 },
    { id: 'programmes', label: 'ADRA Programmes', icon: FolderKanban, count: null },
    { id: 'history', label: 'Aid History', icon: History, count: null },
    { id: 'distributions', label: 'Distribution Schedules', icon: Truck, count: distributions.length || 2 },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: 2 },
    { id: 'feedback', label: 'Feedback & Complaints', icon: MessageSquareQuote, count: null },
    { id: 'about', label: 'About Us', icon: Info, count: null },
    { id: 'support', label: 'Contact Us', icon: Headphones, count: null },
  ];

  const handleApplyProgramme = () => {
    setActiveTab('requests');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navbar (Green Brand Header) */}
      <header className="sticky top-0 z-40 bg-[#004D3F] border-b border-[#003B30] text-white shadow-md pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Portal Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-white border border-white/20 hover:bg-white/15 transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>

            <div className="min-w-0 flex flex-col justify-center">
              <span className="text-base font-black text-white tracking-wider leading-tight">
                ADRA
              </span>
              <span className="text-[10px] text-emerald-200 font-medium leading-none">
                {currentUser?.role || 'Beneficiary'}
              </span>
            </div>
          </div>

          {/* Top Right Actions: Logout ONLY */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

            {/* Header Logout Button */}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer"
              title="Logout of Client Portal"
            >
              <LogOut className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline font-bold">Logout</span>
            </button>
          </div>
        </div>

        {/* Desktop Horizontal Navigation Bar */}
        <div className="hidden md:block bg-slate-50 border-t border-slate-200 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-2xs border border-emerald-300/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.count && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <div className="p-3 mb-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#004D3F] flex items-center justify-center text-white shrink-0 border border-emerald-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 block">
                  {beneficiary?.full_name || 'Mary Nyambura'}
                </span>
                <span className="font-mono text-xs text-emerald-700 font-bold block">
                  {beneficiary?.beneficiary_code || 'BEN-2025-007'}
                </span>
              </div>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading Beneficiary Client Portal...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <BeneficiaryMobileDashboard
                beneficiary={beneficiary}
                requests={requests}
                distributions={distributions}
                notifications={[
                  {
                    id: 'notif_welcome',
                    title: 'Beneficiary Account Active',
                    message: `Welcome to ADRA community portal. Your household (${beneficiary?.beneficiary_code || 'Verified'}) is verified for active humanitarian distributions.`,
                    created_at: 'Today'
                  }
                ]}
                unreadCount={1}
                onRequestAssistance={() => setActiveTab('requests')}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'id_card' && (
              <BeneficiaryIdCard beneficiary={beneficiary} />
            )}

            {activeTab === 'requests' && (
              <AssistanceRequestView beneficiary={beneficiary} />
            )}

            {activeTab === 'programmes' && (
              <ProgrammeInformationView onApplyProgramme={handleApplyProgramme} />
            )}

            {activeTab === 'history' && (
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <AidHistoryView
                  beneficiary={beneficiary}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              </div>
            )}

            {activeTab === 'distributions' && (
              <DistributionInformationView beneficiary={beneficiary} />
            )}

            {activeTab === 'notifications' && (
              <NotificationsView
                beneficiary={beneficiary}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'feedback' && (
              <FeedbackComplaintsView beneficiary={beneficiary} />
            )}

            {activeTab === 'profile' && (
              <BeneficiaryProfileView
                beneficiary={beneficiary}
                onProfileUpdated={loadBeneficiaryProfile}
              />
            )}

            {activeTab === 'about' && (
              <AboutUsView onNavigateTab={(tab) => setActiveTab(tab)} />
            )}

            {activeTab === 'support' && (
              <HelpSupportContactView beneficiary={beneficiary} />
            )}

            {activeTab === 'security' && (
              <SecuritySettingsView beneficiary={beneficiary} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
export default BeneficiaryPortalPage;
