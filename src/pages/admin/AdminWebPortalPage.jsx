import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  FolderKanban,
  Settings,
  UserCheck,
  KeyRound,
  FileCheck,
  MapPin,
  HeartHandshake,
  History,
  Lock,
  Radio,
  Database,
  BarChart3,
  HelpCircle,
  Search
} from 'lucide-react';
import { AdminWebPortalLayout } from '../../components/layout/AdminWebPortalLayout';

// Sub-views
import { AdminDashboardView } from './components/AdminDashboardView';
import { UserRoleManagementView } from './components/UserRoleManagementView';
import { PermissionMatrixView } from './components/PermissionMatrixView';
import { ApprovalManagementView } from './components/ApprovalManagementView';
import { BeneficiaryOversightView } from './components/BeneficiaryOversightView';
import { FieldGovernanceView } from './components/FieldGovernanceView';
import { SecurityAuditView } from './components/SecurityAuditView';
import { NotificationsBroadcastView } from './components/NotificationsBroadcastView';
import { DataSettingsSupportView } from './components/DataSettingsSupportView';

export function AdminWebPortalPage({ onSwitchToFieldApp }) {
  // 6 Primary Sections: 'overview', 'identity', 'beneficiaries', 'field', 'security', 'system'
  const [activeSection, setActiveSection] = useState('overview');

  // Sub-tabs for each section
  const [subTabs, setSubTabs] = useState({
    identity: 'users',      // 'users' | 'permissions' | 'approvals'
    field: 'programmes',    // 'programmes' | 'locations' | 'approvals'
    security: 'audit',      // 'audit' | 'policies' | 'broadcasts'
    system: 'settings',     // 'settings' | 'backups' | 'reports' | 'faqs'
  });

  const setSectionSubTab = (section, tab) => {
    setSubTabs(prev => ({ ...prev, [section]: tab }));
  };

  // Callback from overview dashboard quick action buttons
  const handleOverviewNavigate = (target) => {
    switch (target) {
      case 'users':
        setActiveSection('identity');
        setSectionSubTab('identity', 'users');
        break;
      case 'permissions':
        setActiveSection('identity');
        setSectionSubTab('identity', 'permissions');
        break;
      case 'approvals':
        setActiveSection('identity');
        setSectionSubTab('identity', 'approvals');
        break;
      case 'beneficiaries':
        setActiveSection('beneficiaries');
        break;
      case 'programmes':
        setActiveSection('field');
        setSectionSubTab('field', 'programmes');
        break;
      case 'locations':
        setActiveSection('field');
        setSectionSubTab('field', 'locations');
        break;
      case 'security':
        setActiveSection('security');
        setSectionSubTab('security', 'policies');
        break;
      case 'audit':
        setActiveSection('security');
        setSectionSubTab('security', 'audit');
        break;
      case 'data':
      case 'settings':
        setActiveSection('system');
        setSectionSubTab('system', 'backups');
        break;
      default:
        setActiveSection('overview');
    }
  };

  return (
    <AdminWebPortalLayout
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      onSwitchToFieldApp={onSwitchToFieldApp}
    >
      {/* 1. OVERVIEW */}
      {activeSection === 'overview' && (
        <AdminDashboardView onNavigateTab={handleOverviewNavigate} />
      )}

      {/* 2. IDENTITY & ACCESS */}
      {activeSection === 'identity' && (
        <div className="space-y-6">
          {/* Clean Segmented Tab Control */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-850 border border-slate-800 w-fit">
            <button
              onClick={() => setSectionSubTab('identity', 'users')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                subTabs.identity === 'users'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Users & Roles
            </button>

            <button
              onClick={() => setSectionSubTab('identity', 'permissions')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                subTabs.identity === 'permissions'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Permission Matrix
            </button>

            <button
              onClick={() => setSectionSubTab('identity', 'approvals')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                subTabs.identity === 'approvals'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Account Approvals
            </button>
          </div>

          <div>
            {subTabs.identity === 'users' && <UserRoleManagementView />}
            {subTabs.identity === 'permissions' && <PermissionMatrixView />}
            {subTabs.identity === 'approvals' && <ApprovalManagementView initialCategory="User Registration" />}
          </div>
        </div>
      )}

      {/* 3. BENEFICIARY MANAGEMENT */}
      {activeSection === 'beneficiaries' && (
        <div className="space-y-6">
          <BeneficiaryOversightView />
        </div>
      )}

      {/* 4. FIELD OPERATIONS */}
      {activeSection === 'field' && (
        <div className="space-y-6">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-850 border border-slate-800 w-fit">
            <button
              onClick={() => setSectionSubTab('field', 'programmes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                subTabs.field === 'programmes'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              Programmes
            </button>

            <button
              onClick={() => setSectionSubTab('field', 'locations')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                subTabs.field === 'locations'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Operational Locations
            </button>

            <button
              onClick={() => setSectionSubTab('field', 'approvals')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                subTabs.field === 'approvals'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              Budget Approvals
            </button>
          </div>

          <div>
            {subTabs.field === 'programmes' && <FieldGovernanceView initialTab="programmes" />}
            {subTabs.field === 'locations' && <FieldGovernanceView initialTab="locations" />}
            {subTabs.field === 'approvals' && <ApprovalManagementView initialCategory="Operational Budget" />}
          </div>
        </div>
      )}

      {/* 5. SECURITY & AUDIT */}
      {activeSection === 'security' && (
        <div className="space-y-6">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-850 border border-slate-800 w-fit">
            <button
              onClick={() => setSectionSubTab('security', 'audit')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                subTabs.security === 'audit'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Audit Logs
            </button>

            <button
              onClick={() => setSectionSubTab('security', 'policies')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                subTabs.security === 'policies'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Security Policies
            </button>

            <button
              onClick={() => setSectionSubTab('security', 'broadcasts')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                subTabs.security === 'broadcasts'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              Announcements & Alerts
            </button>
          </div>

          <div>
            {subTabs.security === 'audit' && <SecurityAuditView initialTab="audit" />}
            {subTabs.security === 'policies' && <SecurityAuditView initialTab="security" />}
            {subTabs.security === 'broadcasts' && <NotificationsBroadcastView />}
          </div>
        </div>
      )}

      {/* 6. SYSTEM & DATA */}
      {activeSection === 'system' && (
        <div className="space-y-6">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-850 border border-slate-800 w-fit">
            <button
              onClick={() => setSectionSubTab('system', 'settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                subTabs.system === 'settings'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Organization Settings
            </button>

            <button
              onClick={() => setSectionSubTab('system', 'backups')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                subTabs.system === 'backups'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Backups & Integrity
            </button>

            <button
              onClick={() => setSectionSubTab('system', 'reports')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                subTabs.system === 'reports'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analytical Reports
            </button>

            <button
              onClick={() => setSectionSubTab('system', 'faqs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                subTabs.system === 'faqs'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Support & FAQs
            </button>
          </div>

          <div>
            {subTabs.system === 'settings' && <DataSettingsSupportView initialTab="settings" />}
            {subTabs.system === 'backups' && <DataSettingsSupportView initialTab="data" />}
            {subTabs.system === 'reports' && <DataSettingsSupportView initialTab="reports" />}
            {subTabs.system === 'faqs' && <DataSettingsSupportView initialTab="help" />}
          </div>
        </div>
      )}
    </AdminWebPortalLayout>
  );
}
