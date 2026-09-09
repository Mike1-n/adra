import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  Search,
  Users,
  KeyRound,
  FileCheck,
  UserCheck,
  FolderKanban,
  MapPin,
  HeartHandshake,
  History,
  Lock,
  Radio,
  Settings,
  Database,
  BarChart3,
  HelpCircle,
  Clock,
  Sparkles,
  Download,
  Plus,
  RefreshCw,
  Layers,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { db, isSupabaseConfigured } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

// Hub Sub-Views
import { AdminDashboardView } from './components/AdminDashboardView';
import { UserRoleManagementView } from './components/UserRoleManagementView';
import { PermissionMatrixView } from './components/PermissionMatrixView';
import { ApprovalManagementView } from './components/ApprovalManagementView';
import { BeneficiaryOversightView } from './components/BeneficiaryOversightView';
import { FieldGovernanceView } from './components/FieldGovernanceView';
import { SecurityAuditView } from './components/SecurityAuditView';
import { NotificationsBroadcastView } from './components/NotificationsBroadcastView';
import { DataSettingsSupportView } from './components/DataSettingsSupportView';
import { GlobalSearchView } from './components/GlobalSearchView';

export function AdminConsolePage() {
  // Navigation State: hub and subFunction
  // Hubs: 'executive', 'identity', 'field', 'security', 'data', 'support'
  const [activeHub, setActiveHub] = useState('executive');
  const [activeFunction, setActiveFunction] = useState('dashboard');
  
  // Pending approvals counter for badge
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  const loadApprovalBadge = async () => {
    try {
      const approvals = await db.getApprovals('ALL');
      const pending = approvals.filter(a => a.status === 'Pending').length;
      setPendingApprovalsCount(pending);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadApprovalBadge();
    const interval = setInterval(loadApprovalBadge, 15000);
    return () => clearInterval(interval);
  }, []);

  // Quick navigation handler from dashboard cards or action buttons
  const navigateTo = (functionId) => {
    switch (functionId) {
      case 'dashboard':
        setActiveHub('executive');
        setActiveFunction('dashboard');
        break;
      case 'search':
        setActiveHub('executive');
        setActiveFunction('search');
        break;
      case 'users':
        setActiveHub('identity');
        setActiveFunction('users');
        break;
      case 'roles':
        setActiveHub('identity');
        setActiveFunction('roles');
        break;
      case 'permissions':
        setActiveHub('identity');
        setActiveFunction('permissions');
        break;
      case 'user-approvals':
      case 'approvals':
        setActiveHub('identity');
        setActiveFunction('user-approvals');
        break;
      case 'beneficiaries':
        setActiveHub('field');
        setActiveFunction('beneficiaries');
        break;
      case 'programmes':
        setActiveHub('field');
        setActiveFunction('programmes');
        break;
      case 'locations':
        setActiveHub('field');
        setActiveFunction('locations');
        break;
      case 'operational-approvals':
        setActiveHub('field');
        setActiveFunction('operational-approvals');
        break;
      case 'audit':
        setActiveHub('security');
        setActiveFunction('audit');
        break;
      case 'security':
        setActiveHub('security');
        setActiveFunction('security');
        break;
      case 'notifications':
        setActiveHub('security');
        setActiveFunction('notifications');
        break;
      case 'settings':
        setActiveHub('data');
        setActiveFunction('settings');
        break;
      case 'data':
      case 'data-mgmt':
        setActiveHub('data');
        setActiveFunction('data-mgmt');
        break;
      case 'reports':
        setActiveHub('data');
        setActiveFunction('reports');
        break;
      case 'faqs':
      case 'support':
        setActiveHub('support');
        setActiveFunction('faqs');
        break;
      default:
        setActiveHub('executive');
        setActiveFunction('dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickBackup = async () => {
    try {
      setIsExporting(true);
      const backup = await db.exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ADRA_System_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Live database backup exported successfully!');
    } catch (err) {
      toast.error('Backup generation failed.');
    } finally {
      setIsExporting(false);
    }
  };

  // Hubs metadata
  const hubs = [
    {
      id: 'executive',
      name: 'Executive & Search',
      icon: LayoutDashboard,
      badge: null,
      functions: [
        { id: 'dashboard', name: 'Dashboard Telemetry', icon: LayoutDashboard, num: 'F1' },
        { id: 'search', name: 'Global Engine Search', icon: Search, num: 'F16' },
      ]
    },
    {
      id: 'identity',
      name: 'Identity & Access',
      icon: Users,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} pending` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      functions: [
        { id: 'users', name: 'User Directory & CRUD', icon: Users, num: 'F2 & F3' },
        { id: 'permissions', name: 'Permission Matrix (6 Capabilities)', icon: KeyRound, num: 'F4' },
        { id: 'user-approvals', name: 'Account Approval Queue', icon: UserCheck, num: 'F5', count: pendingApprovalsCount },
      ]
    },
    {
      id: 'field',
      name: 'Field & Programmes',
      icon: FolderKanban,
      functions: [
        { id: 'beneficiaries', name: 'Beneficiary Oversight', icon: Users, num: 'F6' },
        { id: 'programmes', name: 'Programme Portfolio', icon: FolderKanban, num: 'F7' },
        { id: 'locations', name: 'Location Hierarchy', icon: MapPin, num: 'F8' },
        { id: 'operational-approvals', name: 'Operational Approval Workflow', icon: HeartHandshake, num: 'F10' },
      ]
    },
    {
      id: 'security',
      name: 'Security & Governance',
      icon: Lock,
      functions: [
        { id: 'audit', name: 'Immutable Audit Trail', icon: History, num: 'F11' },
        { id: 'security', name: 'Security & Password Policies', icon: Lock, num: 'F12' },
        { id: 'notifications', name: 'System Announcements & Alerts', icon: Radio, num: 'F13' },
      ]
    },
    {
      id: 'data',
      name: 'Data & Reporting',
      icon: Database,
      functions: [
        { id: 'settings', name: 'System Settings & ID Formats', icon: Settings, num: 'F9' },
        { id: 'data-mgmt', name: 'Database Backups & Integrity', icon: Database, num: 'F14' },
        { id: 'reports', name: 'Analytical System Reports', icon: BarChart3, num: 'F15' },
      ]
    },
    {
      id: 'support',
      name: 'Support & Knowledge',
      icon: HelpCircle,
      functions: [
        { id: 'faqs', name: 'Interactive FAQs & Helpdesk', icon: HelpCircle, num: 'F17' },
      ]
    }
  ];

  // Active hub descriptor
  const currentHubObj = hubs.find(h => h.id === activeHub) || hubs[0];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header Bar: Title, Status, Quick Actions */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-emerald-500/25">
              <ShieldCheck className="w-3.5 h-3.5" /> 17-Function Administrator Module
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {isSupabaseConfigured ? 'Supabase PostgreSQL Live' : 'Persistent Reactive Storage'}
            </span>
            {pendingApprovalsCount > 0 && (
              <button
                onClick={() => navigateTo('user-approvals')}
                className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1 border border-amber-500/30 hover:bg-amber-500/30 transition"
              >
                <Clock className="w-3 h-3" /> {pendingApprovalsCount} Approvals Pending
              </button>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
            ADRA DMS Administrator Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Zero-hardcoded enterprise control plane for security, personnel, multi-country programmes, and real-time audit governance.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsSearchModalOpen(true)}
            icon={Search}
            className="flex-1 sm:flex-none"
          >
            Global Search
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleQuickBackup}
            disabled={isExporting}
            icon={Download}
            className="flex-1 sm:flex-none"
          >
            {isExporting ? 'Exporting...' : 'Backup JSON'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigateTo('users')}
            icon={Plus}
            className="flex-1 sm:flex-none"
          >
            Manage Users
          </Button>
        </div>
      </div>

      {/* Hub Navigation Ribbon (6 Functional Hubs) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {hubs.map((hub) => {
          const Icon = hub.icon;
          const isActive = activeHub === hub.id;
          return (
            <button
              key={hub.id}
              onClick={() => {
                setActiveHub(hub.id);
                setActiveFunction(hub.functions[0].id);
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 border shrink-0 ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950/50'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{hub.name}</span>
              {hub.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${hub.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {hub.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-Function Selector Pills */}
      <div className="p-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-1.5 overflow-x-auto">
        {currentHubObj.functions.map((fn) => {
          const Icon = fn.icon;
          const isActive = activeFunction === fn.id;
          return (
            <button
              key={fn.id}
              onClick={() => setActiveFunction(fn.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold shadow-inner border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800/80 text-slate-500'}`}>
                {fn.num}
              </span>
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{fn.name}</span>
              {fn.count > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {fn.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area: Renders the active Administrative Function */}
      <div className="mt-4">
        {/* Hub 1: Executive & Search */}
        {activeHub === 'executive' && activeFunction === 'dashboard' && (
          <AdminDashboardView
            onNavigateTab={navigateTo}
            onOpenSearch={() => setIsSearchModalOpen(true)}
          />
        )}
        {activeHub === 'executive' && activeFunction === 'search' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-emerald-400" />
                  Global Multi-Entity Search Engine (Function 16)
                </h3>
                <p className="text-xs text-slate-400">
                  Scans live users, beneficiaries, programmes, distributions, and registered suppliers with instant type filters.
                </p>
              </div>
            </div>
            <GlobalSearchView />
          </div>
        )}

        {/* Hub 2: Identity & Access */}
        {activeHub === 'identity' && (activeFunction === 'users' || activeFunction === 'roles') && (
          <UserRoleManagementView />
        )}
        {activeHub === 'identity' && activeFunction === 'permissions' && (
          <PermissionMatrixView />
        )}
        {activeHub === 'identity' && activeFunction === 'user-approvals' && (
          <ApprovalManagementView initialCategory="User Registration" />
        )}

        {/* Hub 3: Field & Programmes */}
        {activeHub === 'field' && activeFunction === 'beneficiaries' && (
          <BeneficiaryOversightView />
        )}
        {activeHub === 'field' && activeFunction === 'programmes' && (
          <FieldGovernanceView initialTab="programmes" />
        )}
        {activeHub === 'field' && activeFunction === 'locations' && (
          <FieldGovernanceView initialTab="locations" />
        )}
        {activeHub === 'field' && activeFunction === 'operational-approvals' && (
          <ApprovalManagementView initialCategory="Operational Budget" />
        )}

        {/* Hub 4: Security & Governance */}
        {activeHub === 'security' && activeFunction === 'audit' && (
          <SecurityAuditView initialTab="audit" />
        )}
        {activeHub === 'security' && activeFunction === 'security' && (
          <SecurityAuditView initialTab="security" />
        )}
        {activeHub === 'security' && activeFunction === 'notifications' && (
          <NotificationsBroadcastView />
        )}

        {/* Hub 5: Data & Reporting */}
        {activeHub === 'data' && activeFunction === 'settings' && (
          <DataSettingsSupportView initialTab="settings" />
        )}
        {activeHub === 'data' && activeFunction === 'data-mgmt' && (
          <DataSettingsSupportView initialTab="data" />
        )}
        {activeHub === 'data' && activeFunction === 'reports' && (
          <DataSettingsSupportView initialTab="reports" />
        )}

        {/* Hub 6: Support & Knowledge */}
        {activeHub === 'support' && activeFunction === 'faqs' && (
          <DataSettingsSupportView initialTab="help" />
        )}
      </div>

      {/* Global Search Quick Modal */}
      <Modal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title="Global Administrator System Search"
        size="lg"
      >
        <div className="space-y-4">
          <GlobalSearchView onSelectEntity={() => setIsSearchModalOpen(false)} />
        </div>
      </Modal>
    </div>
  );
}
