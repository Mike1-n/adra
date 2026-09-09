import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ShieldCheck,
  Settings,
  Search,
  Download,
  Smartphone,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Database,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, isSupabaseConfigured } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { GlobalSearchView } from '../../pages/admin/components/GlobalSearchView';

export function AdminWebPortalLayout({
  activeSection,
  onSelectSection,
  activeSubTab,
  onSelectSubTab,
  onSwitchToFieldApp,
  children
}) {
  const { currentUser, logout } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toast = useToast();

  const loadPendingCount = async () => {
    try {
      const apps = await db.getApprovals('ALL');
      setPendingApprovals(apps.filter(a => a.status === 'Pending').length);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPendingCount();
    const timer = setInterval(loadPendingCount, 15000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const backup = await db.exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ADRA_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Database backup exported successfully');
    } catch (err) {
      toast.error('Backup failed to download');
    } finally {
      setIsExporting(false);
    }
  };

  const navItems = [
    {
      id: 'overview',
      name: 'Overview',
      icon: LayoutDashboard,
      desc: 'System Telemetry & KPIs'
    },
    {
      id: 'identity',
      name: 'Identity & Access',
      icon: Users,
      badge: pendingApprovals > 0 ? pendingApprovals : null,
      desc: 'Users, Roles & Approvals'
    },
    {
      id: 'field',
      name: 'Field Operations',
      icon: FolderKanban,
      desc: 'Programmes & Locations'
    },
    {
      id: 'security',
      name: 'Security & Audit',
      icon: ShieldCheck,
      desc: 'Audit Logs & Policies'
    },
    {
      id: 'system',
      name: 'System & Data',
      icon: Settings,
      desc: 'Backups, Settings & Reports'
    }
  ];

  return (
    <div className="flex h-screen bg-white text-slate-100 overflow-hidden font-sans select-none antialiased">
      {/* Streamlined Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-800 flex-col h-full shrink-0 z-30">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-600/20">
              A
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-100 flex items-center gap-1.5">
                ADRA <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-500/30">Admin</span>
              </span>
              <p className="text-[10px] text-slate-500 font-medium">Enterprise Web Portal</p>
            </div>
          </div>
        </div>

        {/* 5 Primary Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Console Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 text-left group ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-850 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-500/30'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer: Switch to Field App & Profile */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {/* Subtle Switch to Field App */}
          <button
            onClick={onSwitchToFieldApp}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-semibold transition group"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              Field Application
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* User Account */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser?.full_name}
                className="w-7 h-7 rounded-full object-cover border border-emerald-500/40 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.full_name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-500 truncate">HQ Administrator</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out of ADRA"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Sleek Topbar Header */}
        <header className="h-16 bg-white/95 border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 backdrop-blur-md">
          {/* Left: Mobile Menu & Current Section Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 capitalize">
                {navItems.find(n => n.id === activeSection)?.name || 'Admin Console'}
              </span>
              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-400" />
              <span className="hidden sm:inline text-xs text-slate-500 font-medium">
                {navItems.find(n => n.id === activeSection)?.desc || ''}
              </span>
            </div>
          </div>

          {/* Right: Search, Database Status, Actions */}
          <div className="flex items-center gap-2.5">
            {/* Clean Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-600 hover:text-slate-900 transition"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline font-medium">Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 bg-white border border-slate-300 text-[10px] rounded text-slate-500 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* DB Status Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium">
              <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{isSupabaseConfigured ? 'PostgreSQL' : 'Local DB'}</span>
            </div>

            {/* Backup Export */}
            <button
              onClick={handleExportBackup}
              disabled={isExporting}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-800 transition disabled:opacity-50"
              title="Download full JSON snapshot"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>{isExporting ? 'Exporting...' : 'Backup'}</span>
            </button>

            {/* Switch to Field App */}
            <button
              onClick={onSwitchToFieldApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-500/30 text-emerald-600 text-xs font-semibold transition shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Field App</span>
            </button>

            {/* Prominent Admin Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-800 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              title="Log out of Admin Portal"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Content Body with Generous Whitespace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-white">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-white border-r border-slate-800 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
              <span className="font-bold text-sm text-slate-100">ADRA Admin Portal</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectSection(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium ${
                    activeSection === item.id
                      ? 'bg-emerald-600 text-white font-semibold shadow-md'
                      : 'text-slate-600 hover:bg-slate-850'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 ${activeSection === item.id ? 'text-white' : 'text-slate-400'}`} />
                    {item.name}
                  </span>
                  {item.badge && (
                    <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${activeSection === item.id ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-500/30'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="p-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center gap-2.5 px-2 py-1">
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                  alt={currentUser?.full_name}
                  className="w-8 h-8 rounded-full object-cover border border-emerald-500/40"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.full_name || 'Administrator'}</p>
                  <p className="text-[10px] text-slate-500 truncate">{currentUser?.email || 'admin@adra.org'}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSwitchToFieldApp();
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-500/30 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
              >
                <Smartphone className="w-4 h-4 text-emerald-600" /> Open Field Application
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      <Modal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        title="Global Search"
        size="lg"
      >
        <GlobalSearchView onSelectEntity={() => setIsSearchOpen(false)} />
      </Modal>
    </div>
  );
}
