import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  Sparkles,
  Lock,
  Globe,
  X,
  Layers,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { db } from '../../lib/supabase';
import { AdraLogo } from '../common/AdraLogo';

export function Sidebar({
  currentTab,
  onSelectTab,
  onSwitchToAdminWeb,
  isMobile = false,
  onCloseMobile,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse,
}) {
  const { currentUser, logout, quickSwitchRole } = useAuth();
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  // Sync collapsed state (prop or internal state)
  const isCollapsed = !isMobile && (externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed);
  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalIsCollapsed(prev => !prev);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadPending = async () => {
      try {
        const apps = await db.getApprovals('ALL');
        if (isMounted) {
          const pending = apps.filter(a => a.status === 'Pending').length;
          setPendingApprovals(pending);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadPending();
    const timer = setInterval(loadPending, 15000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['Administrator', 'Program Manager', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'programs', name: 'Programs Manager', icon: Layers, roles: ['Administrator', 'Program Manager', 'Project Officer', 'M&E Officer', 'Finance Officer'] },
    { id: 'inventory', name: 'Inventory & Logistics', icon: Package, roles: ['Administrator', 'Program Manager', 'Inventory Manager', 'Finance Officer'] },
    { id: 'projects', name: 'Projects', icon: FolderKanban, roles: ['Administrator', 'Program Manager', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'beneficiaries', name: 'Beneficiaries', icon: Users, roles: ['Administrator', 'Program Manager', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'activities', name: 'Activities', icon: CalendarCheck2, roles: ['Administrator', 'Program Manager', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'interventions', name: 'Interventions', icon: HeartHandshake, roles: ['Administrator', 'Program Manager', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'me', name: 'Monitoring & Eval', icon: Target, roles: ['Administrator', 'Program Manager', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'finance', name: 'Finance & Grants', icon: DollarSign, roles: ['Administrator', 'Program Manager', 'Finance Officer', 'Project Officer'] },
    { id: 'donors', name: 'Donors & Partners', icon: Building2, roles: ['Administrator', 'Program Manager', 'Project Officer', 'Finance Officer'] },
    { id: 'reports', name: 'Reports & Export', icon: FileText, roles: ['Administrator', 'Program Manager', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
    { id: 'users', name: 'Admin Console', icon: ShieldCheck, roles: ['Administrator'] },
    { id: 'audit', name: 'Audit Logs', icon: History, roles: ['Administrator'] },
    { id: 'settings', name: 'Settings & DB', icon: Settings, roles: ['Administrator', 'Program Manager', 'Project Officer', 'Finance Officer', 'M&E Officer'] },
  ];

  const filteredNav = navigation.filter(item =>
    item.roles.includes(currentUser?.role || 'Administrator')
  );

  const handleNavClick = (id) => {
    if (id === 'users' && onSwitchToAdminWeb) {
      onSwitchToAdminWeb();
      if (isMobile && onCloseMobile) onCloseMobile();
      return;
    }
    onSelectTab(id);
    if (isMobile && onCloseMobile) onCloseMobile();
  };

  return (
    <aside
      className={cn(
        'bg-white border-r border-slate-200 flex flex-col h-full select-none transition-all duration-200',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className={cn(
        'h-16 flex items-center border-b border-slate-200 bg-white shrink-0',
        isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        {/* ADRA Brand Logo: Full with name when enlarged, only emblem when collapsed */}
        <AdraLogo
          isCollapsed={isCollapsed}
          subtitle="DMS"
          description="Field Application"
          onClick={isCollapsed ? toggleCollapse : undefined}
        />

        {/* Action buttons (Close for mobile, collapse/expand toggle for desktop) */}
        {!isMobile ? (
          <button
            type="button"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Enlarge Sidebar (Show Full ADRA Logo)' : 'Collapse Sidebar (Show Icon Logo)'}
            className={cn(
              'p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer',
              isCollapsed && 'hidden'
            )}
            aria-label="Toggle sidebar collapse"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        ) : (
          onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )
        )}
      </div>

      {/* When Collapsed: Expand Toggle Button banner */}
      {isCollapsed && (
        <div className="p-2 flex justify-center border-b border-slate-100 bg-slate-50/60">
          <button
            type="button"
            onClick={toggleCollapse}
            title="Enlarge Sidebar"
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer flex items-center justify-center w-full"
          >
            <PanelLeftOpen className="w-4 h-4 text-emerald-700" />
          </button>
        </div>
      )}

      {/* Role Switcher for Quick Academic Defense */}
      {!isCollapsed ? (
        <div className="p-3 mx-3 my-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-slate-700 mb-1.5 font-semibold">
            <span className="flex items-center gap-1 font-bold text-emerald-700">
              <Sparkles className="w-3 h-3" /> Quick Role Switcher
            </span>
            <span className="text-[9px] text-slate-500 uppercase font-bold">Viva / Demo</span>
          </div>
          <select
            value={currentUser?.role || 'Administrator'}
            onChange={(e) => quickSwitchRole(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold shadow-xs"
          >
            <option value="Administrator">👑 Administrator</option>
            <option value="Program Manager">📂 Program Manager</option>
            <option value="Supervisor">🔍 Supervisor</option>
            <option value="Project Officer">📋 Project Officer</option>
            <option value="Field Worker">🌾 Field Worker</option>
            <option value="Finance Officer">💰 Finance Officer</option>
            <option value="Inventory Manager">📦 Inventory Manager</option>
            <option value="Supplier">🚚 Supplier</option>
            <option value="Donor">🤝 Donor</option>
            <option value="Beneficiary">👥 Beneficiary</option>
            <option value="M&E Officer">🎯 M&E Officer</option>
          </select>
        </div>
      ) : (
        <div className="my-2 flex justify-center px-2">
          <button
            onClick={() => {
              const roles = ['Administrator', 'Program Manager', 'Supervisor', 'Project Officer', 'Field Worker', 'Finance Officer', 'Inventory Manager', 'Supplier', 'Donor', 'Beneficiary', 'M&E Officer'];
              const currentIndex = roles.indexOf(currentUser?.role || 'Administrator');
              const nextRole = roles[(currentIndex + 1) % roles.length];
              quickSwitchRole(nextRole);
            }}
            title={`Current: ${currentUser?.role || 'Administrator'} (Click to cycle role)`}
            className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center transition shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dedicated Admin Web App Launcher for Administrators */}
      {currentUser?.role === 'Administrator' && onSwitchToAdminWeb && (
        !isCollapsed ? (
          <div className="mx-3 mb-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs shrink-0">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Admin Web App
              </span>
            </div>
            <p className="text-[10px] text-slate-600 leading-tight mb-2">
              Standalone HQ portal for 17 admin functions & database controls.
            </p>
            <button
              onClick={onSwitchToAdminWeb}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-white" />
              <span>Launch Web Portal</span>
            </button>
          </div>
        ) : (
          <div className="mb-2 flex justify-center px-2">
            <button
              onClick={onSwitchToAdminWeb}
              title="Launch Admin Web Portal"
              className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition shadow-sm cursor-pointer"
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>
        )
      )}

      {/* Navigation Links */}
      <nav className={cn('flex-1 space-y-1 overflow-y-auto', isCollapsed ? 'px-2 py-2' : 'px-3 py-1')}>
        {!isCollapsed && (
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Management Modules
          </p>
        )}
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                'w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer',
                isCollapsed ? 'justify-center p-2.5 my-1' : 'justify-between px-3.5 py-2.5 text-left',
                isActive
                  ? 'bg-[#006B56] text-white shadow-sm font-black ring-1 ring-[#006B56]'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-transparent font-medium'
              )}
            >
              <div className={cn('flex items-center gap-3 min-w-0', isCollapsed && 'justify-center')}>
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors shrink-0',
                    isActive ? 'text-white stroke-[2.2]' : 'text-slate-500 group-hover:text-[#006B56]'
                  )}
                />
                {!isCollapsed && (
                  <span className={cn('truncate', isActive ? 'text-white font-black' : 'text-slate-700 group-hover:text-slate-900')}>
                    {item.name}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.id === 'users' && pendingApprovals > 0 && (
                    <span className={cn(
                      'px-1.5 py-0.5 text-[10px] font-bold rounded-full',
                      isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                    )}>
                      {pendingApprovals}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                  )}
                </div>
              )}
              {isCollapsed && item.id === 'users' && pendingApprovals > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className={cn('border-t border-slate-200 bg-white shrink-0', isCollapsed ? 'p-2' : 'p-3')}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser?.full_name}
              className="w-8 h-8 rounded-full object-cover border border-emerald-500/40"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {currentUser?.full_name || 'User'}
              </p>
              <p className="text-[10px] text-emerald-700 truncate flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-2.5 h-2.5" />
                {currentUser?.role || 'Guest'}
              </p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser?.full_name}
              title={`${currentUser?.full_name || 'User'} (${currentUser?.role || 'Guest'})`}
              className="w-9 h-9 rounded-full object-cover border border-emerald-500/40 cursor-pointer"
            />
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
