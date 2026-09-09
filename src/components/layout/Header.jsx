import React, { useState } from 'react';
import {
  Bell,
  Database,
  CheckCircle2,
  Shield,
  ChevronDown,
  ChevronLeft,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { isNative } from '../../lib/capacitor';

export function Header({
  currentTab = 'dashboard',
  onSelectTab,
  currentTabTitle = 'Dashboard'
}) {
  const { currentUser, quickSwitchRole } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const notifications = [
    { id: 1, title: 'Seed Distribution Completed', time: '10 mins ago', desc: 'Project Officer completed activity ACT-2025-101.' },
    { id: 2, title: 'Budget Allocation Approved', time: '1 hour ago', desc: 'Direct Activity Costs ($850,000) added for DR-CSA project.' },
    { id: 3, title: 'Target Exceeded in Marsabit', time: '3 hours ago', desc: 'Clean water access indicator reached 8,900 individuals.' },
  ];

  const canGoBack = currentTab !== 'dashboard' && onSelectTab;

  return (
    <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 pt-safe sticky top-0 z-30 transition-all">
      <div className="h-14 sm:h-16 flex items-center justify-between">
        {/* Left: Mobile Back Button & Page Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {canGoBack && (
            <button
              onClick={() => onSelectTab('dashboard')}
              aria-label="Back to Dashboard"
              className="p-1.5 -ml-1 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 active:scale-95 transition"
            >
              <ChevronLeft className="w-5 h-5 text-emerald-400" />
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-100 truncate">
                {currentTabTitle}
              </h1>
              {isNative && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  <Smartphone className="w-2.5 h-2.5" /> APK
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 sm:hidden truncate">
              ADRA Management System
            </p>
          </div>
        </div>

        {/* Right: Database Status Badge, Notifications & Role */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Supabase connection indicator badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <Database className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-slate-300">
              {isSupabaseConfigured ? 'Supabase' : 'Demo DB'}
            </span>
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </div>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 active:scale-95 transition relative"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-slate-950" />
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-200">Field Alerts</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">3 New</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 transition">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-200">
                        <span className="truncate pr-1">{n.title}</span>
                        <span className="text-[9px] text-slate-400 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition active:scale-95 shadow-sm"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="max-w-[80px] sm:max-w-none truncate">{currentUser?.role || 'Admin'}</span>
              <ChevronDown className="w-3 h-3 text-emerald-400 shrink-0" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
                <p className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Role Switcher (Viva)</p>
                {['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer'].map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      quickSwitchRole(role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                      currentUser?.role === role ? 'bg-emerald-600/20 text-emerald-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{role}</span>
                    {currentUser?.role === role && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
