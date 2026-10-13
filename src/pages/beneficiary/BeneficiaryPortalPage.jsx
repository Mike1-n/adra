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
  ChevronRight
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

export function BeneficiaryPortalPage({ onSwitchToFieldApp }) {
  const { currentUser, logout } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('id_card');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [beneficiary, setBeneficiary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load Beneficiary Profile
  const loadBeneficiaryProfile = async () => {
    try {
      setLoading(true);
      const beneficiaries = await db.getBeneficiaries();
      // Match by email, id, or default to Mary Nyambura (b7)
      const found = beneficiaries.find(
        b =>
          b.email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
          b.id === currentUser?.beneficiary_id ||
          b.beneficiary_code === currentUser?.beneficiary_code ||
          b.id === 'b7'
      );
      setBeneficiary(found || beneficiaries[0]);
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
    { id: 'id_card', label: 'Beneficiary ID', icon: CreditCard, count: null },
    { id: 'requests', label: 'Assistance Requests', icon: HandHeart, count: 3 },
    { id: 'programmes', label: 'ADRA Programmes', icon: FolderKanban, count: null },
    { id: 'history', label: 'Aid History', icon: History, count: null },
    { id: 'distributions', label: 'Distribution Schedules', icon: Truck, count: 2 },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: 2 },
    { id: 'feedback', label: 'Feedback & Complaints', icon: MessageSquareQuote, count: null },
    { id: 'profile', label: 'My Profile', icon: User, count: null },
    { id: 'support', label: 'Help & Contact ADRA', icon: Headphones, count: null },
    { id: 'security', label: 'Security & Logout', icon: Shield, count: null },
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

          {/* Top Right Actions: Profile & Logout ONLY */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Profile Icon Button */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition active:scale-95 cursor-pointer shadow-2xs"
              title="My Profile"
            >
              {beneficiary?.avatar || currentUser?.avatar ? (
                <img
                  src={beneficiary?.avatar || currentUser?.avatar}
                  alt="Profile"
                  className="w-4 h-4 rounded-full object-cover border border-white/40"
                />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </button>

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
              <img
                src={beneficiary?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-emerald-400"
              />
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

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={logout}
                className="text-xs font-bold text-rose-600 flex items-center gap-1.5 p-2 rounded-lg hover:bg-rose-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>

              {currentUser?.role === 'Administrator' && onSwitchToFieldApp && (
                <button
                  type="button"
                  onClick={onSwitchToFieldApp}
                  className="text-xs font-bold text-slate-600 p-2 hover:text-slate-900 cursor-pointer"
                >
                  Field App
                </button>
              )}
            </div>
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
              <AidHistoryView beneficiary={beneficiary} />
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

            {activeTab === 'support' && (
              <HelpSupportContactView />
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
