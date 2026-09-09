import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  HeartHandshake,
  Users,
  Grid,
  CalendarCheck2,
  Target,
  DollarSign,
  Building2,
  FileText,
  UserCheck,
  History,
  Settings,
  X,
  Sparkles,
  LogOut,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export function MobileBottomNav({ currentTab, onSelectTab }) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { currentUser, logout, quickSwitchRole } = useAuth();

  const primaryTabs = [
    { id: 'dashboard', name: 'Home', icon: LayoutDashboard },
    { id: 'projects', name: 'Projects', icon: FolderKanban },
    { id: 'interventions', name: 'Aid / Relief', icon: HeartHandshake },
    { id: 'beneficiaries', name: 'Beneficiaries', icon: Users },
  ];

  const moreModules = [
    { id: 'activities', name: 'Activities', desc: 'Workplan & Outputs', icon: CalendarCheck2, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', roles: ['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'me', name: 'Monitoring & Eval', desc: 'Logframe & Targets', icon: Target, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', roles: ['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'finance', name: 'Finance & Grants', desc: 'Budgets & Vouchers', icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', roles: ['Administrator', 'Finance Officer', 'Project Officer'] },
    { id: 'donors', name: 'Donors & Partners', desc: 'Funding Directory', icon: Building2, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', roles: ['Administrator', 'Project Officer', 'Finance Officer'] },
    { id: 'reports', name: 'Reports & Export', desc: 'PDF / CSV Export', icon: FileText, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', roles: ['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'users', name: 'User Management', desc: 'RBAC Staff Roster', icon: UserCheck, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', roles: ['Administrator'] },
    { id: 'audit', name: 'Audit Logs', desc: 'Activity Trail & DB', icon: History, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20', roles: ['Administrator'] },
    { id: 'settings', name: 'Settings & DB', desc: 'Diagnostics & Demo', icon: Settings, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', roles: ['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
  ];

  const filteredMoreModules = moreModules.filter(item =>
    item.roles.includes(currentUser?.role || 'Administrator')
  );

  const isMoreActive = !primaryTabs.some(t => t.id === currentTab);

  const handleSelect = (tabId) => {
    onSelectTab(tabId);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* Native-style Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 pb-safe">
        <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelect(tab.id)}
                className="flex-1 flex flex-col items-center justify-center py-1 relative group focus:outline-none"
              >
                <div
                  className={cn(
                    'w-10 h-8 rounded-xl flex items-center justify-center transition-all duration-200',
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-950/50 scale-105'
                      : 'text-slate-400 group-active:scale-95'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    'text-[10px] tracking-tight font-medium transition-colors mt-0.5',
                    isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                  )}
                >
                  {tab.name}
                </span>
                {isActive && (
                  <span className="absolute -bottom-0.5 w-1 h-1 bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}

          {/* More Modules Button */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="flex-1 flex flex-col items-center justify-center py-1 relative group focus:outline-none"
          >
            <div
              className={cn(
                'w-10 h-8 rounded-xl flex items-center justify-center transition-all duration-200',
                isMoreActive || showMoreMenu
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-950/50 scale-105'
                  : 'text-slate-400 group-active:scale-95'
              )}
            >
              <Grid className="w-5 h-5" />
            </div>
            <span
              className={cn(
                'text-[10px] tracking-tight font-medium transition-colors mt-0.5',
                isMoreActive || showMoreMenu ? 'text-emerald-400 font-semibold' : 'text-slate-400'
              )}
            >
              More
            </span>
            {isMoreActive && (
              <span className="absolute -bottom-0.5 w-1 h-1 bg-emerald-400 rounded-full" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile "More" Bottom Sheet Modal */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMoreMenu(false)}
          />

          {/* Sheet Body */}
          <div className="relative bg-slate-900 border-t border-slate-800 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-200 pb-safe">
            {/* Sheet Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-slate-700/80" />
            </div>

            {/* Header with Title and Close */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white">All Modules</span>
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  ADRA DMS
                </span>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 border border-slate-700/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Quick Profile & Viva Role Switcher Card */}
            <div className="p-4 mx-4 my-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={currentUser?.full_name}
                    className="w-10 h-10 rounded-full object-cover border border-emerald-500/40"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {currentUser?.full_name || 'Field Officer'}
                    </p>
                    <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {currentUser?.role || 'Administrator'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    logout();
                  }}
                  title="Logout"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Role Switcher Pill for Mobile Defense */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <Sparkles className="w-3 h-3" /> Quick Role Switcher (Viva Mode)
                  </span>
                </div>
                <select
                  value={currentUser?.role || 'Administrator'}
                  onChange={(e) => quickSwitchRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Administrator">👑 Administrator</option>
                  <option value="Project Officer">📋 Project Officer</option>
                  <option value="Finance Officer">💰 Finance Officer</option>
                  <option value="M&E Officer">🎯 M&E Officer</option>
                </select>
              </div>
            </div>

            {/* Modules Grid */}
            <div className="overflow-y-auto px-4 pb-6 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-2">
                Specialized Operations
              </p>
              <div className="grid grid-cols-2 gap-2">
                {filteredMoreModules.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150',
                        isActive
                          ? 'bg-emerald-600/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-200 hover:bg-slate-800/50'
                      )}
                    >
                      <div className={cn('p-2 rounded-lg border shrink-0', item.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
