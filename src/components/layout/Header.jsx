import React, { useState } from 'react';
import {
  Bell,
  Database,
  CheckCircle2,
  Shield,
  ChevronDown,
  ChevronLeft,
  Smartphone,
  Globe,
  ExternalLink,
  LogOut,
  Menu,
  User,
  MessageSquarePlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { isNative } from '../../lib/capacitor';
import { UserProfileModal } from '../common/UserProfileModal';
import { ModuleFeedbackModal } from '../common/ModuleFeedbackModal';
import { NotificationBellButton } from '../common/NotificationBellButton';

export function Header({
  currentTab = 'dashboard',
  onSelectTab,
  currentTabTitle = 'Dashboard',
  onSwitchToAdminWeb,
  onOpenMobileSidebar
}) {
  const { currentUser, quickSwitchRole, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const notifications = [
    { id: 1, title: 'Seed Distribution Completed', time: '10 mins ago', desc: 'Project Officer completed activity ACT-2025-101.' },
    { id: 2, title: 'Budget Allocation Approved', time: '1 hour ago', desc: 'Direct Activity Costs ($850,000) added for DR-CSA project.' },
    { id: 3, title: 'Target Exceeded in Marsabit', time: '3 hours ago', desc: 'Clean water access indicator reached 8,900 individuals.' },
  ];

  return (
    <header className="bg-[#004D3F] border-b border-[#003B30] text-white px-3 sm:px-6 pt-safe sticky top-0 z-30 transition-all shadow-md">
      <div className="h-14 sm:h-16 flex items-center justify-between">
        {/* Left: Mobile Sidebar Toggle & Page Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onOpenMobileSidebar && (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              aria-label="Open Navigation Sidebar"
              className="lg:hidden p-1.5 -ml-1 rounded-xl text-white hover:bg-white/15 bg-white/10 border border-white/20 active:scale-95 transition cursor-pointer"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          )}

          <div className="min-w-0 flex flex-col justify-center">
            <span className="text-base font-black text-white tracking-wider leading-tight">
              ADRA
            </span>
            <span className="text-[10px] text-emerald-200 font-medium leading-none">
              {currentUser?.role || 'Administrator'}
            </span>
          </div>
        </div>

        {/* Right: Notifications, Profile Icon, and Logout Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Notifications Center Bell */}
          <NotificationBellButton
            currentUser={currentUser}
            onNavigate={(tab) => onSelectTab && onSelectTab(tab)}
          />

          {/* Profile Icon Button */}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition active:scale-95 cursor-pointer shadow-2xs"
            title="My Profile"
          >
            <User className="w-4 h-4 text-white shrink-0" />
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline font-bold">Logout</span>
          </button>
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onLogout={logout}
        onSwitchRole={quickSwitchRole}
      />

      {/* Universal Module Feedback Modal */}
      <ModuleFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        defaultModule={currentTabTitle || 'Field App'}
      />
    </header>
  );
}
