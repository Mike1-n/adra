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
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { isNative } from '../../lib/capacitor';

export function Header({
  currentTab = 'dashboard',
  onSelectTab,
  currentTabTitle = 'Dashboard',
  onSwitchToAdminWeb
}) {
  const { currentUser, quickSwitchRole, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const notifications = [
    { id: 1, title: 'Seed Distribution Completed', time: '10 mins ago', desc: 'Project Officer completed activity ACT-2025-101.' },
    { id: 2, title: 'Budget Allocation Approved', time: '1 hour ago', desc: 'Direct Activity Costs ($850,000) added for DR-CSA project.' },
    { id: 3, title: 'Target Exceeded in Marsabit', time: '3 hours ago', desc: 'Clean water access indicator reached 8,900 individuals.' },
  ];

  const canGoBack = currentTab !== 'dashboard' && onSelectTab;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 pt-safe sticky top-0 z-30 transition-all">
      <div className="h-14 sm:h-16 flex items-center justify-between">
        {/* Left: Mobile Back Button & Page Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {canGoBack && (
            <button
              onClick={() => onSelectTab('dashboard')}
              aria-label="Back to Dashboard"
              className="p-1.5 -ml-1 rounded-xl text-slate-700 hover:text-slate-950 bg-slate-100 border border-slate-200 active:scale-95 transition"
            >
              <ChevronLeft className="w-5 h-5 text-emerald-600" />
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {currentTabTitle}
              </h1>
              {isNative && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  <Smartphone className="w-2.5 h-2.5" /> APK
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 sm:hidden truncate">
              ADRA Management System
            </p>
          </div>
        </div>

        {/* Right: Database Status Badge, Notifications & Role */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Supabase connection indicator badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">
            <Database className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span className="text-slate-700 font-medium">
              {isSupabaseConfigured ? 'Supabase' : 'Demo DB'}
            </span>
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          </div>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 active:scale-95 transition relative"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-900">Field Alerts</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">3 New</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-900">
                        <span className="truncate pr-1">{n.title}</span>
                        <span className="text-[9px] text-slate-500 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Standalone Admin Web App Portal Button */}
          {currentUser?.role === 'Administrator' && onSwitchToAdminWeb && (
            <button
              onClick={onSwitchToAdminWeb}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
              title="Launch Standalone Administrator Enterprise Web App"
            >
              <Globe className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Admin Web App</span>
              <ExternalLink className="w-3 h-3 text-white" />
            </button>
          )}

          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold transition active:scale-95 shadow-sm"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="max-w-[80px] sm:max-w-none truncate">{currentUser?.role || 'Admin'}</span>
              <ChevronDown className="w-3 h-3 text-emerald-700 shrink-0" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
                <p className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1">Role Switcher (Viva)</p>
                {['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer'].map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      quickSwitchRole(role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                      currentUser?.role === role ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{role}</span>
                    {currentUser?.role === role && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline font-bold">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
