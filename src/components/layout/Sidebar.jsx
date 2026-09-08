import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CalendarCheck2,
  HeartHandshake,
  Target,
  DollarSign,
  Building2,
  FileText,
  UserCheck,
  History,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export function Sidebar({ currentTab, onSelectTab, isMobile = false, onCloseMobile }) {
  const { currentUser, logout, quickSwitchRole, demoAccounts } = useAuth();

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'projects', name: 'Projects', icon: FolderKanban, roles: ['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'beneficiaries', name: 'Beneficiaries', icon: Users, roles: ['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'activities', name: 'Activities', icon: CalendarCheck2, roles: ['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'interventions', name: 'Interventions', icon: HeartHandshake, roles: ['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'me', name: 'Monitoring & Eval', icon: Target, roles: ['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'finance', name: 'Finance & Grants', icon: DollarSign, roles: ['Administrator', 'Finance Officer', 'Project Officer'] },
    { id: 'donors', name: 'Donors & Partners', icon: Building2, roles: ['Administrator', 'Project Officer', 'Finance Officer'] },
    { id: 'reports', name: 'Reports & Export', icon: FileText, roles: ['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'users', name: 'User Management', icon: UserCheck, roles: ['Administrator'] },
    { id: 'audit', name: 'Audit Logs', icon: History, roles: ['Administrator'] },
    { id: 'settings', name: 'Settings & DB', icon: Settings, roles: ['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
  ];

  const filteredNav = navigation.filter(item =>
    item.roles.includes(currentUser?.role || 'Administrator')
  );

  const handleNavClick = (id) => {
    onSelectTab(id);
    if (isMobile && onCloseMobile) onCloseMobile();
  };

  return (
    <aside className="w-64 bg-slate-950/95 border-r border-slate-800/80 flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800/80 bg-slate-900/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-base shadow-lg shadow-emerald-950/50 border border-emerald-400/30">
          A
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
            ADRA <span className="text-emerald-400 text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">DMS</span>
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Humanitarian NGO</span>
        </div>
      </div>

      {/* Role Switcher for Quick Academic Defense */}
      <div className="p-3 mx-3 my-3 rounded-xl bg-slate-900/90 border border-slate-800/90">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span className="flex items-center gap-1 font-medium text-emerald-400">
            <Sparkles className="w-3 h-3" /> Quick Role Switcher
          </span>
          <span className="text-[9px] text-slate-500 uppercase">Viva / Demo</span>
        </div>
        <select
          value={currentUser?.role || 'Administrator'}
          onChange={(e) => quickSwitchRole(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
        >
          <option value="Administrator">👑 Administrator</option>
          <option value="Project Officer">📋 Project Officer</option>
          <option value="Finance Officer">💰 Finance Officer</option>
          <option value="M&E Officer">🎯 M&E Officer</option>
        </select>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Management Modules
        </p>
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group text-left',
                isActive
                  ? 'bg-emerald-600/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-950/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                  )}
                />
                <span>{item.name}</span>
              </div>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={currentUser?.full_name}
            className="w-8 h-8 rounded-full object-cover border border-emerald-500/40"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {currentUser?.full_name || 'User'}
            </p>
            <p className="text-[10px] text-emerald-400 truncate flex items-center gap-1 font-medium">
              <ShieldCheck className="w-2.5 h-2.5" />
              {currentUser?.role || 'Guest'}
            </p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
